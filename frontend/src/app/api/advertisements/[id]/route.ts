import { NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import {
  readAdFundsWallets,
  getAdFundsBalanceForAd,
  canServeSponsoredAd,
  dayKey,
} from '@/lib/vendorAdFunds';

function readAdvertisements() {
  return readDataFile<any>('advertisements.json', { bannerAds: [], adSenseConfig: {} });
}

function readClickEvents() {
  return readDataFile<any[]>('advertisement-click-events.json', []);
}

function normalizeVendorIdKey(raw: string): string[] {
  const s = String(raw).trim();
  const keys = new Set<string>([s]);
  const stripped = s.replace(/^vendor_/i, '');
  if (stripped !== s) keys.add(stripped);
  const digits = s.match(/\d+/g);
  if (digits) digits.forEach((d) => keys.add(d));
  return Array.from(keys);
}

function resolveVendorIdForAd(ad: any, vendors: any[], profiles: any[]): string {
  const vid = ad.vendorId ?? ad.vendorUserId;
  if (vid !== undefined && vid !== null && String(vid).trim().length > 0) {
    const tryIds = normalizeVendorIdKey(String(vid));
    for (const key of tryIds) {
      const vendor = vendors.find((v: any) => String(v.id) === key);
      if (vendor) return String(vendor.id);
    }
    const profileMatch = profiles.find((p: any) => tryIds.some((k) => String(p?.id) === k));
    if (profileMatch) {
      const linkedVendorId = String((profileMatch as any).vendorId ?? (profileMatch as any).linkedVendorId ?? '').trim();
      const linkedVendor = vendors.find((v: any) => String(v.id) === linkedVendorId);
      if (linkedVendor) return String(linkedVendor.id);
    }
  }

  const vendorUserId = String(ad.vendorUserId || '').trim();
  if (vendorUserId) {
    const vendor = vendors.find((v: any) => String(v.userId || v.vendorUserId || '').trim() === vendorUserId);
    if (vendor) return String(vendor.id);
    // Fallback when vendor account exists in auth/session but no normalized vendors.json row yet.
    return `vendor_${vendorUserId}`;
  }

  const email = String(ad.advertiserEmail || '').trim().toLowerCase();
  if (email) {
    const vendor = vendors.find((v: any) => String(v.email || '').trim().toLowerCase() === email);
    if (vendor) return String(vendor.id);
  }

  const advertiserName = String(ad.advertiser || '').trim().toLowerCase();
  if (advertiserName) {
    const vendor = vendors.find((v: any) => String(v.name || '').trim().toLowerCase() === advertiserName);
    if (vendor) return String(vendor.id);
  }
  return '';
}

/**
 * Public: single sponsored / banner ad for the landing page (no admin-only fields).
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const [store, adFundsWallets, clickEvents, vendors, vendorProfiles] = await Promise.all([
      readAdvertisements(),
      readAdFundsWallets(),
      readClickEvents(),
      readDataFile<any[]>('vendors.json', []),
      readDataFile<any[]>('vendor-profiles.json', []),
    ]);
    const ad = (store.bannerAds || []).find((a: any) => a.id === params.id);
    if (!ad) {
      return NextResponse.json({ success: false, error: 'Advertisement not found' }, { status: 404 });
    }

    const today = dayKey(new Date());
    const balance = getAdFundsBalanceForAd(adFundsWallets, ad);
    const serving = canServeSponsoredAd(ad, balance, clickEvents, today);

    const resolvedCatalogId = resolveVendorIdForAd(ad, vendors, vendorProfiles);
    const rowForId = resolvedCatalogId
      ? vendors.find((v: any) => String(v.id) === String(resolvedCatalogId))
      : null;
    const fromRowUser = rowForId
      ? String((rowForId as any).userId || (rowForId as any).authUserId || (rowForId as any).vendorUserId || '').trim()
      : '';
    const fromAd = ad.vendorUserId != null && String(ad.vendorUserId).trim().length > 0 ? String(ad.vendorUserId) : '';
    const publicAd = {
      id: ad.id,
      title: ad.title,
      imageUrl: typeof ad.imageUrl === 'string' ? ad.imageUrl : '',
      targetUrl: typeof ad.targetUrl === 'string' ? ad.targetUrl : '',
      category: typeof ad.category === 'string' ? ad.category : '',
      advertiser: typeof ad.advertiser === 'string' ? ad.advertiser : '',
      advertiserEmail: typeof ad.advertiserEmail === 'string' ? ad.advertiserEmail : '',
      vendorId: resolvedCatalogId,
      vendorUserId: fromAd || fromRowUser,
      status: ad.status,
      startDate: ad.startDate,
      endDate: ad.endDate,
      description: typeof ad.description === 'string' ? ad.description : '',
      serving,
    };

    return NextResponse.json({ success: true, data: publicAd });
  } catch (error) {
    console.error('Error in GET /api/advertisements/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load advertisement' },
      { status: 500 },
    );
  }
}
