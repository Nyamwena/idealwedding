import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

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

function getToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get('token')?.value || null;
}

function getVendorIdentity(request: NextRequest): { userId: string; email: string; vendorId: string } | null {
  const token = getToken(request);
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as {
      userId?: string | number;
      email?: string;
      role?: string;
    };
    if (String(payload.role || '').toUpperCase() !== 'VENDOR' || !payload.userId) return null;
    const userId = String(payload.userId);
    return {
      userId,
      email: String(payload.email || '').toLowerCase(),
      vendorId: `vendor_${userId}`,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const identity = getVendorIdentity(request);
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }
    const [adsStore, clickEvents] = await Promise.all([
      readAdvertisements(),
      readClickEvents(),
    ]);
    const mine = (adsStore.bannerAds || []).filter(
      (ad: any) =>
        String(ad.vendorUserId || '') === identity.userId ||
        String(ad.vendorId || '') === identity.vendorId,
    );
    const today = dayKey(new Date());
    const ranked = mine
      .map((ad: any) => {
        const adEvents = clickEvents.filter((ev: any) => ev.adId === ad.id);
        const dailySpent = adEvents
          .filter((ev: any) => dayKey(ev.timestamp) === today)
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
        return {
          ...ad,
          dailySpent,
          remainingDailyBudget: maxDailyBudget > 0 ? Math.max(0, maxDailyBudget - dailySpent) : null,
          performance,
        };
      })
      .sort((a: any, b: any) => Number(b.bidPerClick || 0) - Number(a.bidPerClick || 0));
    return NextResponse.json({ success: true, data: ranked });
  } catch (error) {
    console.error('Error in GET /api/vendor/advertisements:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vendor advertisements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = getVendorIdentity(request);
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
    if (maxDailyBudget < 0 || (maxDailyBudget > 0 && maxDailyBudget < bidPerClick)) {
      return NextResponse.json(
        { success: false, error: 'maxDailyBudget must be 0 (unlimited) or >= bidPerClick' },
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
      status: 'active',
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
    const identity = getVendorIdentity(request);
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }
    const body = await request.json();
    const adId = String(body.id || '');
    if (!adId) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const adsStore = await readAdvertisements();
    const idx = (adsStore.bannerAds || []).findIndex(
      (ad: any) =>
        ad.id === adId &&
        (String(ad.vendorUserId || '') === identity.userId ||
          String(ad.vendorId || '') === identity.vendorId),
    );
    if (idx < 0) {
      return NextResponse.json({ success: false, error: 'Advertisement not found' }, { status: 404 });
    }

    const updated = {
      ...adsStore.bannerAds[idx],
      title: body.title ?? adsStore.bannerAds[idx].title,
      targetUrl: body.targetUrl ?? adsStore.bannerAds[idx].targetUrl,
      imageUrl: body.imageUrl ?? adsStore.bannerAds[idx].imageUrl,
      category: body.category ?? adsStore.bannerAds[idx].category,
      position: body.position ?? adsStore.bannerAds[idx].position,
      status: body.status ?? adsStore.bannerAds[idx].status,
      bidPerClick:
        body.bidPerClick !== undefined
          ? Number(body.bidPerClick || 0)
          : Number(adsStore.bannerAds[idx].bidPerClick || adsStore.bannerAds[idx].cost || 0),
      maxDailyBudget:
        body.maxDailyBudget !== undefined
          ? Number(body.maxDailyBudget || 0)
          : Number(adsStore.bannerAds[idx].maxDailyBudget || 0),
      updatedAt: new Date().toISOString(),
    };
    if (Number(updated.maxDailyBudget || 0) > 0 && Number(updated.maxDailyBudget || 0) < Number(updated.bidPerClick || 0)) {
      return NextResponse.json(
        { success: false, error: 'maxDailyBudget must be 0 (unlimited) or >= bidPerClick' },
        { status: 400 },
      );
    }
    updated.cost = updated.bidPerClick;
    adsStore.bannerAds[idx] = updated;
    await writeAdvertisements(adsStore);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PUT /api/vendor/advertisements:', error);
    return NextResponse.json({ success: false, error: 'Failed to update advertisement' }, { status: 500 });
  }
}
