import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { findVendorProfile } from '@/lib/vendorProfileScope';
import { adVisibleToVendor, adBelongsToVendor, legacyAdMatchesVendorProfile } from '@/lib/vendorAdScope';
import {
  readAdFundsWallets,
  getAdFundsBalanceForAd,
  canServeSponsoredAd,
  ensureAdFundsWallet,
} from '@/lib/vendorAdFunds';

function readAdvertisements() {
  return readDataFile<any>('advertisements.json', { bannerAds: [], adSenseConfig: {} });
}
function writeAdvertisements(data: any) {
  return writeDataFile('advertisements.json', data);
}
function readClickEvents() {
  return readDataFile<any[]>('advertisement-click-events.json', []);
}

function dayKey(input: string | Date) {
  const d = new Date(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const identity = await getVendorSession(request);
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }
    const [adsStore, clickEvents, profiles] = await Promise.all([
      readAdvertisements(),
      readClickEvents(),
      readDataFile<any[]>('vendor-profiles.json', []),
    ]);
    const profile = findVendorProfile(profiles, identity);
    const mine = (adsStore.bannerAds || []).filter((ad: any) =>
      adVisibleToVendor(ad, identity, profile),
    );
    const today = dayKey(new Date());
    const adFundsWallets = await readAdFundsWallets();
    const { rows: fundRows, index: fundIdx } = await ensureAdFundsWallet(identity);
    const ranked = mine
      .map((ad: any) => {
        const adEvents = clickEvents.filter((ev: any) => ev.adId === ad.id);
        const dailySpent = adEvents
          .filter((ev: any) => !ev.blocked && dayKey(ev.timestamp) === today)
          .reduce((sum: number, ev: any) => sum + Number(ev.charge || 0), 0);

        const performance = Array.from({ length: 7 }).map((_, idx) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - idx));
          const key = dayKey(d);
          const dayEvents = adEvents.filter((ev: any) => dayKey(ev.timestamp) === key);
          return {
            day: key,
            clicks: dayEvents.length,
            spend: dayEvents.reduce((sum: number, ev: any) => sum + Number(ev.charge || 0), 0),
          };
        });

        const maxDailyBudget = Number(ad.maxDailyBudget || 0);
        const bal = getAdFundsBalanceForAd(adFundsWallets, ad);
        const canServe = canServeSponsoredAd(ad, bal, clickEvents, today);
        return {
          ...ad,
          dailySpent,
          remainingDailyBudget: maxDailyBudget > 0 ? Math.max(0, maxDailyBudget - dailySpent) : null,
          performance,
          availableAdFunds: bal,
          canServePaidClick: canServe,
        };
      })
      .sort((a: any, b: any) => Number(b.bidPerClick || 0) - Number(a.bidPerClick || 0));
    const w = fundRows[fundIdx];
    return NextResponse.json({
      success: true,
      data: ranked,
      adFunds: {
        balance: Number(w.balance || 0),
        pendingBalance: Number(w.pendingBalance || 0),
        totalAdded: Number(w.totalAdded || 0),
        totalSpent: Number(w.totalSpent || 0),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/vendor/advertisements:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vendor advertisements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await getVendorSession(request);
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }
    const body = await request.json();
    const bidPerClick = Number(body.bidPerClick || 0);
    const maxDailyBudget = Number(body.maxDailyBudget || 0);
    if (!body.title || !body.targetUrl || bidPerClick <= 0) {
      return NextResponse.json(
        { success: false, error: 'title, targetUrl and bidPerClick are required' },
        { status: 400 },
      );
    }
    if (maxDailyBudget < bidPerClick) {
      return NextResponse.json(
        {
          success: false,
          error: 'Daily budget must be set and at least equal to your bid per click.',
        },
        { status: 400 },
      );
    }

    const adFundsWallets = await readAdFundsWallets();
    const balance = getAdFundsBalanceForAd(adFundsWallets, {
      vendorUserId: identity.userId,
      vendorId: identity.vendorId,
      advertiserEmail: identity.email,
    });
    if (balance < bidPerClick) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Add advertising funds first — balance must cover at least one click at your bid amount.',
        },
        { status: 400 },
      );
    }

    const adsStore = await readAdvertisements();
    const ad = {
      id: `ad_${Date.now()}`,
      title: String(body.title),
      imageUrl: String(body.imageUrl || ''),
      targetUrl: String(body.targetUrl),
      position: body.position || 'top',
      status: 'pending_review',
      startDate: body.startDate || new Date().toISOString().slice(0, 10),
      endDate: body.endDate || '',
      clicks: 0,
      impressions: 0,
      ctr: 0,
      cost: bidPerClick,
      bidPerClick,
      maxDailyBudget,
      totalSpent: 0,
      advertiser: String(body.advertiser || identity.email || identity.vendorId),
      advertiserEmail: identity.email,
      category: String(body.category || 'General'),
      vendorUserId: identity.userId,
      vendorId: identity.vendorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    adsStore.bannerAds = adsStore.bannerAds || [];
    adsStore.bannerAds.unshift(ad);
    await writeAdvertisements(adsStore);
    return NextResponse.json({ success: true, data: ad }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/vendor/advertisements:', error);
    return NextResponse.json({ success: false, error: 'Failed to create advertisement' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const identity = await getVendorSession(request);
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }
    const body = await request.json();
    const adId = String(body.id || '');
    if (!adId) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const [adsStore, profiles] = await Promise.all([
      readAdvertisements(),
      readDataFile<any[]>('vendor-profiles.json', []),
    ]);
    const profile = findVendorProfile(profiles, identity);
    const idx = (adsStore.bannerAds || []).findIndex(
      (ad: any) =>
        ad.id === adId &&
        (adBelongsToVendor(ad, identity) || legacyAdMatchesVendorProfile(ad, identity, profile)),
    );
    if (idx < 0) {
      return NextResponse.json({ success: false, error: 'Advertisement not found' }, { status: 404 });
    }

    const currentRow = adsStore.bannerAds[idx];
    const nextBid =
      body.bidPerClick !== undefined
        ? Number(body.bidPerClick || 0)
        : Number(currentRow.bidPerClick || currentRow.cost || 0);
    const nextBudget =
      body.maxDailyBudget !== undefined
        ? Number(body.maxDailyBudget || 0)
        : Number(currentRow.maxDailyBudget || 0);
    const nextTitle = body.title !== undefined ? String(body.title) : currentRow.title;
    const nextUrl = body.targetUrl !== undefined ? String(body.targetUrl) : currentRow.targetUrl;
    const nextImg = body.imageUrl !== undefined ? String(body.imageUrl) : String(currentRow.imageUrl || '');
    const nextCat = body.category !== undefined ? String(body.category) : currentRow.category;
    const nextPos = body.position !== undefined ? String(body.position) : currentRow.position;

    if (nextBid <= 0) {
      return NextResponse.json({ success: false, error: 'bidPerClick must be positive' }, { status: 400 });
    }
    if (nextBudget < nextBid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Daily budget must be at least equal to your bid per click.',
        },
        { status: 400 },
      );
    }

    const adFundsWallets = await readAdFundsWallets();
    const bal = getAdFundsBalanceForAd(adFundsWallets, currentRow);
    if (bal < nextBid) {
      return NextResponse.json(
        { success: false, error: 'Advertising balance must cover at least one click at your bid.' },
        { status: 400 },
      );
    }

    const material =
      (body.title !== undefined && nextTitle !== currentRow.title) ||
      (body.targetUrl !== undefined && nextUrl !== currentRow.targetUrl) ||
      (body.imageUrl !== undefined && nextImg !== String(currentRow.imageUrl || '')) ||
      (body.category !== undefined && nextCat !== currentRow.category) ||
      (body.position !== undefined && nextPos !== currentRow.position) ||
      (body.bidPerClick !== undefined &&
        nextBid !== Number(currentRow.bidPerClick || currentRow.cost || 0)) ||
      (body.maxDailyBudget !== undefined && nextBudget !== Number(currentRow.maxDailyBudget || 0));

    let nextStatus = String(currentRow.status || 'pending_review');
    const st = nextStatus.toLowerCase();
    if (material && (st === 'active' || st === 'inactive')) {
      nextStatus = 'pending_review';
    }

    const updated = {
      ...currentRow,
      title: nextTitle,
      targetUrl: nextUrl,
      imageUrl: nextImg,
      category: nextCat,
      position: nextPos,
      status: nextStatus,
      bidPerClick: nextBid,
      maxDailyBudget: nextBudget,
      vendorUserId: identity.userId,
      vendorId: identity.vendorId,
      advertiserEmail: String(currentRow.advertiserEmail || '') || identity.email,
      updatedAt: new Date().toISOString(),
    };
    updated.cost = updated.bidPerClick;
    adsStore.bannerAds[idx] = updated;
    await writeAdvertisements(adsStore);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PUT /api/vendor/advertisements:', error);
    return NextResponse.json({ success: false, error: 'Failed to update advertisement' }, { status: 500 });
  }
}
