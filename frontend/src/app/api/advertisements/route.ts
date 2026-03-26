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
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const limit = Math.max(1, Number(searchParams.get('limit') || 5));

    const [advertisements, wallets, clickEvents] = await Promise.all([
      readAdvertisements(),
      readWallets(),
      readClickEvents(),
    ]);
    const ads = (advertisements.bannerAds || []).filter((ad: any) => ad.status === 'active');

    const now = new Date();
    const today = dayKey(now);
    const eligible = ads.filter((ad: any) => {
      if (position && ad.position !== position) return false;
      if (ad.startDate && new Date(ad.startDate) > now) return false;
      if (ad.endDate && new Date(ad.endDate) < now) return false;

      const wallet = wallets.find(
        (w) =>
          String(w.vendorUserId || '') === String(ad.vendorUserId || '') ||
          String(w.vendorId || '') === String(ad.vendorId || '') ||
          String(w.email || '').toLowerCase() === String(ad.advertiserEmail || '').toLowerCase(),
      );
      const credits = Number(wallet?.currentCredits || 0);
      const bid = Number(ad.bidPerClick || ad.cost || 0);
      if (credits < bid) return false;

      const maxDailyBudget = Number(ad.maxDailyBudget || 0);
      if (maxDailyBudget > 0) {
        const dailySpent = clickEvents
          .filter((ev: any) => ev.adId === ad.id && dayKey(ev.timestamp) === today)
          .reduce((sum: number, ev: any) => sum + Number(ev.charge || 0), 0);
        if (dailySpent + bid > maxDailyBudget) return false;
      }
      return true;
    });

    const ranked = eligible
      .slice()
      .sort((a: any, b: any) => {
        const bidDelta = Number(b.bidPerClick || b.cost || 0) - Number(a.bidPerClick || a.cost || 0);
        if (bidDelta !== 0) return bidDelta;
        return Number(b.ctr || 0) - Number(a.ctr || 0);
      })
      .slice(0, limit);

    if (ranked.length > 0) {
      const idSet = new Set(ranked.map((ad: any) => ad.id));
      advertisements.bannerAds = (advertisements.bannerAds || []).map((ad: any) => {
        if (!idSet.has(ad.id)) return ad;
        const impressions = Number(ad.impressions || 0) + 1;
        const clicks = Number(ad.clicks || 0);
        const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
        return {
          ...ad,
          impressions,
          ctr,
          updatedAt: new Date().toISOString(),
        };
      });
      await writeAdvertisements(advertisements);
    }

    return NextResponse.json({
      success: true,
      data: ranked,
    });
  } catch (error) {
    console.error('Error in GET /api/advertisements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advertisements' },
      { status: 500 },
    );
  }
}
