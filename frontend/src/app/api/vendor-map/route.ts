import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import {
  readAdFundsWallets,
  getAdFundsBalanceForAd,
  canServeSponsoredAd,
  dayKey,
} from '@/lib/vendorAdFunds';

export const dynamic = 'force-dynamic';

type VendorRow = {
  id: string;
  name: string;
  email?: string;
  category?: string;
  location?: string;
  rating?: number;
  phone?: string;
  website?: string;
  description?: string;
  status?: string;
};

/** Deterministic coordinates so pins stay stable without geocoding. */
function stableCoords(seed: string, base = { lat: 38.2975, lng: -122.2869 }): { lat: number; lng: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const r1 = ((h >>> 0) % 1000) / 1000;
  const r2 = ((h * 17) >>> 0) % 1000 / 1000;
  return {
    lat: base.lat + (r1 - 0.5) * 0.08,
    lng: base.lng + (r2 - 0.5) * 0.08,
  };
}

function categoryMatchesFilter(vendorCategory: string, filter: string): boolean {
  if (filter === 'all') return true;
  const a = (vendorCategory || '').toLowerCase();
  const b = filter.toLowerCase();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  if (b === 'flowers' && (a.includes('floral') || a.includes('flower'))) return true;
  if ((b === 'venue' || b === 'venues') && a.includes('venue')) return true;
  return false;
}

function priceRangeFromProfile(profile: any): { min: number; max: number } {
  const services = profile?.services;
  if (!Array.isArray(services) || services.length === 0) return { min: 0, max: 0 };
  const mins = services.map((s: any) => Number(s?.priceRange?.min)).filter(Number.isFinite);
  const maxs = services.map((s: any) => Number(s?.priceRange?.max)).filter(Number.isFinite);
  if (mins.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...mins), max: Math.max(...maxs) };
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

function findVendorAndProfile(
  ad: Record<string, unknown>,
  vendors: VendorRow[],
  profiles: any[],
): { vendor: VendorRow | null; profile: any | null } {
  const vid = ad.vendorId ?? ad.vendorUserId;
  if (vid !== undefined && vid !== null && String(vid).length > 0) {
    const tryIds = normalizeVendorIdKey(String(vid));
    for (const key of tryIds) {
      const v = vendors.find((x) => String(x.id) === key);
      if (v) {
        const profile = profiles.find((p: any) => String(p.id) === String(v.id)) || null;
        return { vendor: v, profile };
      }
    }
    const p = profiles.find((x: any) => tryIds.some((k) => String(x.id) === k));
    if (p) {
      const v2 = vendors.find((x) => String(x.id) === String((p as any).vendorId ?? (p as any).linkedVendorId));
      return { vendor: v2 || null, profile: p };
    }
  }
  const email = typeof ad.advertiserEmail === 'string' ? ad.advertiserEmail.toLowerCase() : '';
  if (email) {
    const v = vendors.find((x) => (x.email || '').toLowerCase() === email);
    if (v) {
      const profile = profiles.find((p: any) => String(p.id) === String(v.id)) || null;
      return { vendor: v, profile };
    }
  }
  return { vendor: null, profile: null };
}

function mapToMapVendor(
  vendor: VendorRow,
  profile: any | null,
  extra: { isSponsored?: boolean; adId?: string; targetUrl?: string; imageUrl?: string; adTitle?: string },
): Record<string, unknown> {
  const businessName = profile?.businessName || vendor.name;
  const description = profile?.description || vendor.description || '';
  const pr = priceRangeFromProfile(profile);
  const coords = stableCoords(String(vendor.id));
  return {
    id: String(vendor.id),
    name: businessName,
    category: vendor.category || profile?.serviceCategories?.[0] || 'Other',
    location: vendor.location || '—',
    coordinates: coords,
    rating: Number(vendor.rating) || 0,
    priceRange: pr,
    contact: {
      email: vendor.email || profile?.contactInfo?.email || '',
      phone: vendor.phone || profile?.contactInfo?.phone || '',
    },
    description,
    isSponsored: extra.isSponsored ?? false,
    adId: extra.adId,
    targetUrl: extra.targetUrl,
    imageUrl: extra.imageUrl || profile?.logo || '',
    website: vendor.website || profile?.contactInfo?.website || '',
  };
}

/**
 * GET /api/vendor-map — approved vendors + sponsored rows from banner ads (position `vendor_map`) stored via dataFileStore / DB.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = (searchParams.get('category') || 'all').toLowerCase();

    const [vendorsRaw, profilesRaw, adsStore, adFundsWallets, clickEvents] = await Promise.all([
      readDataFile<VendorRow[]>('vendors.json', []),
      readDataFile<any[]>('vendor-profiles.json', []),
      readDataFile<{ bannerAds?: Record<string, unknown>[] }>('advertisements.json', { bannerAds: [] }),
      readAdFundsWallets(),
      readDataFile<any[]>('advertisement-click-events.json', []),
    ]);

    const approved = vendorsRaw.filter((v) => v.status === 'approved');
    const bannerAds = Array.isArray(adsStore.bannerAds) ? adsStore.bannerAds : [];
    const now = new Date();
    const today = dayKey(now);

    /** Vendor map strip: dedicated `vendor_map` placements, plus `top` banner ads (dashboard) so the same active ad can appear without creating a duplicate. */
    const positionEligible = bannerAds.filter((ad: any) => {
      const pos = String(ad.position || '');
      if (!(pos === 'vendor_map' || pos === 'top')) return false;
      if (ad.status !== 'active') return false;
      if (ad.startDate && new Date(ad.startDate) > now) return false;
      if (ad.endDate && String(ad.endDate).trim() && new Date(ad.endDate) < now) return false;
      return true;
    });

    /** Match public /api/advertisements: only show when bid > 0, wallet can cover one click, and daily cap allows it. */
    const mapAds = positionEligible
      .filter((ad: any) => {
        const balance = getAdFundsBalanceForAd(adFundsWallets, ad);
        return canServeSponsoredAd(ad, balance, clickEvents, today);
      })
      .sort(
        (a: any, b: any) =>
          Number(b.bidPerClick ?? b.cost ?? 0) - Number(a.bidPerClick ?? a.cost ?? 0),
      );

    const sponsored: Record<string, unknown>[] = [];
    const sponsoredVendorIds = new Set<string>();

    for (const ad of mapAds) {
      const { vendor, profile } = findVendorAndProfile(ad, approved, profilesRaw);
      const title = typeof ad.title === 'string' ? ad.title : '';
      const targetUrl = typeof ad.targetUrl === 'string' ? ad.targetUrl : '';
      const imageUrl = typeof ad.imageUrl === 'string' ? ad.imageUrl : '';

      if (vendor) {
        const row = mapToMapVendor(vendor, profile, {
          isSponsored: true,
          adId: String(ad.id),
          targetUrl,
          imageUrl: imageUrl || profile?.logo,
          adTitle: title,
        });
        row.displayTitle = title || row.name;
        sponsored.push(row);
        sponsoredVendorIds.add(String(vendor.id));
      } else {
        const cat = typeof ad.category === 'string' ? ad.category : 'Other';
        const advertiser = typeof ad.advertiser === 'string' ? ad.advertiser : 'Sponsored';
        sponsored.push({
          id: `ad_${String(ad.id)}`,
          name: advertiser,
          displayTitle: title || advertiser,
          category: cat,
          location: '—',
          coordinates: stableCoords(String(ad.id)),
          rating: 0,
          priceRange: { min: 0, max: 0 },
          contact: {
            email: typeof ad.advertiserEmail === 'string' ? ad.advertiserEmail : '',
            phone: '',
          },
          description: title || `${advertiser} — sponsored listing`,
          isSponsored: true,
          adId: String(ad.id),
          targetUrl,
          imageUrl,
          website: '',
          vendorMissing: true,
        });
      }
    }

    const vendors: Record<string, unknown>[] = [];
    for (const vendor of approved) {
      if (sponsoredVendorIds.has(String(vendor.id))) continue;
      const profile = profilesRaw.find((p: any) => String(p.id) === String(vendor.id)) || null;
      if (!categoryMatchesFilter(vendor.category || '', categoryFilter)) continue;
      vendors.push(
        mapToMapVendor(vendor, profile, { isSponsored: false }),
      );
    }

    const sponsoredFiltered =
      categoryFilter === 'all'
        ? sponsored
        : sponsored.filter((s: any) => categoryMatchesFilter(String(s.category || ''), categoryFilter));

    return NextResponse.json({
      success: true,
      data: {
        sponsored: sponsoredFiltered,
        vendors,
      },
    });
  } catch (error) {
    console.error('[vendor-map GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load vendor map data' },
      { status: 500 },
    );
  }
}
