import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

function readAdvertisements() {
  return readDataFile<any>('advertisements.json', { bannerAds: [], adSenseConfig: {} });
}
function writeAdvertisements(data: any) {
  return writeDataFile('advertisements.json', data);
}
function readWallets() {
  return readDataFile<any[]>('vendor-credit-wallets.json', []);
}
function writeWallets(data: any[]) {
  return writeDataFile('vendor-credit-wallets.json', data);
}
function readTransactions() {
  return readDataFile<any[]>('vendor-credit-transactions.json', []);
}
function writeTransactions(data: any[]) {
  return writeDataFile('vendor-credit-transactions.json', data);
}
function readVendors() {
  return readDataFile<any[]>('vendors.json', []);
}
function writeVendors(data: any[]) {
  return writeDataFile('vendors.json', data);
}
function readClickEvents() {
  return readDataFile<any[]>('advertisement-click-events.json', []);
}
function writeClickEvents(data: any[]) {
  return writeDataFile('advertisement-click-events.json', data);
}
function readBlocklist() {
  return readDataFile<any[]>('advertisement-click-blocklist.json', []);
}
function writeBlocklist(data: any[]) {
  return writeDataFile('advertisement-click-blocklist.json', data);
}

function dayKey(input: string | Date) {
  const d = new Date(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [adsStore, wallets, transactions, vendors, clickEvents, blocklist] = await Promise.all([
      readAdvertisements(),
      readWallets(),
      readTransactions(),
      readVendors(),
      readClickEvents(),
      readBlocklist(),
    ]);

    const adIndex = (adsStore.bannerAds || []).findIndex((a: any) => a.id === params.id);
    if (adIndex < 0) {
      return NextResponse.json({ success: false, error: 'Advertisement not found' }, { status: 404 });
    }

    const ad = adsStore.bannerAds[adIndex];
    const clickCost = Number(ad.bidPerClick || ad.cost || 0);
    if (clickCost <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid ad bid amount' }, { status: 400 });
    }

    const walletIndex = wallets.findIndex(
      (w: any) =>
        String(w.vendorUserId || '') === String(ad.vendorUserId || '') ||
        String(w.vendorId || '') === String(ad.vendorId || '') ||
        String(w.email || '').toLowerCase() === String(ad.advertiserEmail || '').toLowerCase(),
    );
    if (walletIndex < 0 || Number(wallets[walletIndex].currentCredits || 0) < clickCost) {
      return NextResponse.json(
        { success: false, error: 'Ad owner has insufficient credits' },
        { status: 400 },
      );
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    const fingerprint = `${ip}|${ua}`;
    const now = new Date();
    const nowMs = now.getTime();

    const activeBlocklist = blocklist.filter(
      (entry: any) => entry && entry.value && new Date(entry.expiresAt || 0).getTime() > nowMs,
    );
    const isIpBlocked = activeBlocklist.some(
      (entry: any) => entry.type === 'ip' && String(entry.value) === String(ip),
    );
    const isFingerprintBlocked = activeBlocklist.some(
      (entry: any) => entry.type === 'fingerprint' && String(entry.value) === String(fingerprint),
    );
    if (isIpBlocked || isFingerprintBlocked) {
      clickEvents.push({
        id: `adclick_blocked_${Date.now()}`,
        adId: ad.id,
        vendorId: ad.vendorId,
        vendorUserId: ad.vendorUserId,
        attemptedCharge: clickCost,
        fingerprint,
        ip,
        userAgent: ua,
        blocked: true,
        blockReason: isIpBlocked ? 'manual_block_ip' : 'manual_block_fingerprint',
        timestamp: now.toISOString(),
      });
      await Promise.all([writeClickEvents(clickEvents), writeBlocklist(activeBlocklist)]);
      return NextResponse.json(
        { success: false, error: 'Click rejected by admin block policy' },
        { status: 403 },
      );
    }

    // Basic anti-fraud cooldown: same fingerprint cannot click same ad repeatedly in short interval.
    const latestEvent = clickEvents
      .filter((ev: any) => ev.adId === ad.id && ev.fingerprint === fingerprint)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    if (latestEvent && nowMs - new Date(latestEvent.timestamp).getTime() < 60 * 1000) {
      clickEvents.push({
        id: `adclick_blocked_${Date.now()}`,
        adId: ad.id,
        vendorId: ad.vendorId,
        vendorUserId: ad.vendorUserId,
        attemptedCharge: clickCost,
        fingerprint,
        ip,
        userAgent: ua,
        blocked: true,
        blockReason: 'cooldown',
        timestamp: now.toISOString(),
      });
      await writeClickEvents(clickEvents);
      return NextResponse.json(
        { success: false, error: 'Click rejected by anti-fraud cooldown' },
        { status: 429 },
      );
    }

    const maxDailyBudget = Number(ad.maxDailyBudget || 0);
    if (maxDailyBudget > 0) {
      const today = dayKey(now);
      const dailySpent = clickEvents
        .filter((ev: any) => ev.adId === ad.id && dayKey(ev.timestamp) === today)
        .reduce((sum: number, ev: any) => sum + Number(ev.charge || 0), 0);
      if (dailySpent + clickCost > maxDailyBudget) {
        clickEvents.push({
          id: `adclick_blocked_${Date.now()}`,
          adId: ad.id,
          vendorId: ad.vendorId,
          vendorUserId: ad.vendorUserId,
          attemptedCharge: clickCost,
          fingerprint,
          ip,
          userAgent: ua,
          blocked: true,
          blockReason: 'daily_budget_cap',
          timestamp: now.toISOString(),
        });
        await writeClickEvents(clickEvents);
        return NextResponse.json(
          { success: false, error: 'Daily budget cap reached for this ad' },
          { status: 400 },
        );
      }
    }

    wallets[walletIndex] = {
      ...wallets[walletIndex],
      currentCredits: Number(wallets[walletIndex].currentCredits || 0) - clickCost,
      totalUsed: Number(wallets[walletIndex].totalUsed || 0) + clickCost,
      updatedAt: new Date().toISOString(),
    };

    adsStore.bannerAds[adIndex] = {
      ...ad,
      clicks: Number(ad.clicks || 0) + 1,
      impressions: Number(ad.impressions || 0),
      ctr:
        Number(ad.impressions || 0) > 0
          ? Number((((Number(ad.clicks || 0) + 1) / Number(ad.impressions || 0)) * 100).toFixed(2))
          : Number(ad.ctr || 0),
      totalSpent: Number(ad.totalSpent || 0) + clickCost,
      updatedAt: new Date().toISOString(),
    };

    transactions.push({
      id: `tx_${Date.now()}`,
      key: wallets[walletIndex].key || ad.vendorId,
      vendorId: ad.vendorId,
      vendorUserId: ad.vendorUserId,
      email: wallets[walletIndex].email,
      type: 'usage',
      amount: -clickCost,
      description: `Ad click charge for "${ad.title}"`,
      timestamp: new Date().toISOString(),
      referenceId: ad.id,
      source: 'ad_click',
    });

    clickEvents.push({
      id: `adclick_${Date.now()}`,
      adId: ad.id,
      vendorId: ad.vendorId,
      vendorUserId: ad.vendorUserId,
      charge: clickCost,
      fingerprint,
      ip,
      userAgent: ua,
      timestamp: now.toISOString(),
    });

    const vendorIndex = vendors.findIndex(
      (v: any) =>
        String(v.id || '') === String(ad.vendorId || '') ||
        String(v.email || '').toLowerCase() === String(wallets[walletIndex].email || '').toLowerCase(),
    );
    if (vendorIndex >= 0) {
      vendors[vendorIndex] = { ...vendors[vendorIndex], credits: wallets[walletIndex].currentCredits };
    }

    await Promise.all([
      writeAdvertisements(adsStore),
      writeWallets(wallets),
      writeTransactions(transactions),
      writeVendors(vendors),
      writeClickEvents(clickEvents),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        adId: ad.id,
        charged: clickCost,
        targetUrl: ad.targetUrl,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/advertisements/[id]/click:', error);
    return NextResponse.json({ success: false, error: 'Failed to track ad click' }, { status: 500 });
  }
}
