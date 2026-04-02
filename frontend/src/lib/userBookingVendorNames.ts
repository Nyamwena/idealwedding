import { readDataFile } from '@/lib/dataFileStore';

const LEGACY_IDS: Record<string, string> = {
  vendor_001: 'Perfect Moments Photography',
  vendor_002: 'Elegant Wedding Planning',
  vendor_003: 'Dream Wedding Videos',
  vendor_004: 'Garden Party Catering',
  vendor_005: 'Blissful Floral Designs',
};

/** Build a lookup for vendor display names (legacy ids + vendors.json + vendor-profiles). */
export async function buildVendorNameResolver(): Promise<(vendorId: string) => string> {
  const map = new Map<string, string>(Object.entries(LEGACY_IDS));

  try {
    const vendors = await readDataFile<{ id?: string; name?: string }[]>('vendors.json', []);
    for (const v of vendors) {
      if (v?.id != null && v?.name) map.set(String(v.id), String(v.name));
    }
  } catch {
    /* ignore */
  }

  try {
    const profiles = await readDataFile<
      { userId?: string; id?: string; businessName?: string; name?: string }[]
    >('vendor-profiles.json', []);
    for (const p of profiles) {
      const label = p.businessName || p.name;
      if (!label) continue;
      if (p.userId != null) map.set(String(p.userId), label);
      if (p.id != null) map.set(String(p.id), label);
    }
  } catch {
    /* ignore */
  }

  return (vendorId: string) => (vendorId ? map.get(String(vendorId)) : undefined) || 'Vendor';
}
