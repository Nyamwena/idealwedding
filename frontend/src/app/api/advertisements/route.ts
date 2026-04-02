import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import {
  readAdFundsWallets,
  getAdFundsBalanceForAd,
  canServeSponsoredAd,
  dayKey,
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const limit = Math.max(1, Number(searchParams.get('limit') || 5));

    const [advertisements, adFundsWallets, clickEvents] = await Promise.all([
      readAdvertisements(),
      readAdFundsWallets(),
      readClickEvents(),
    ]);
    const ads = (advertisements.bannerAds || []).filter((ad: any) => ad.status === 'active');

    const now = new Date();
    const today = dayKey(now);
    const eligible = ads.filter((ad: any) => {
      if (position && ad.position !== position) return false;
      if (ad.startDate && new Date(ad.startDate) > now) return false;
      if (ad.endDate && new Date(ad.endDate) < now) return false;
      return true;
    });

    const ranked = eligible
      .map((ad: any) => {
        const adFunds = getAdFundsBalanceForAd(adFundsWallets, ad);
        const canServe = canServeSponsoredAd(ad, adFunds, clickEvents, today);
        const bid = Number(ad.bidPerClick || ad.cost || 0);
        return {
          ...ad,
          availableAdFunds: adFunds,
          availableCredits: adFunds,
          canServePaidClick: canServe,
        };
      })
      .filter((ad: any) => ad.canServePaidClick)
      .sort((a: any, b: any) => {
        const balanceDelta = Number(b.availableAdFunds || 0) - Number(a.availableAdFunds || 0);
        if (balanceDelta !== 0) return balanceDelta;
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
