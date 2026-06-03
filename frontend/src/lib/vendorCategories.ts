/** Wedding vendor service categories (shared across admin + vendor profile). */
export const VENDOR_CATEGORY_OPTIONS = [
  'Photography',
  'Videography',
  'Floral',
  'Florist',
  'Catering',
  'Venues',
  'Venue',
  'Entertainment',
  'Wedding Planning',
  'Transportation',
  'Beauty & Styling',
  'Decorations',
  'General',
  'Other',
] as const;

/** Normalize a single value or array into a deduplicated category list. */
export function normalizeCategoryList(input: unknown): string[] {
  const items: string[] = [];
  if (Array.isArray(input)) {
    for (const v of input) {
      if (typeof v === 'string' && v.trim()) items.push(v.trim());
    }
  } else if (typeof input === 'string' && input.trim()) {
    items.push(input.trim());
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of items) {
    const key = c.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/** Union of profile categories, service line categories, and catalog vendor categories. */
export function getVendorCategories(vendor?: any, profile?: any): string[] {
  const fromVendor = normalizeCategoryList([
    ...(Array.isArray(vendor?.categories) ? vendor.categories : []),
    ...(typeof vendor?.category === 'string' ? [vendor.category] : []),
  ]);
  const fromProfile = normalizeCategoryList(profile?.serviceCategories);
  const fromServices = normalizeCategoryList(
    (profile?.services || []).map((s: any) => s?.category).filter(Boolean),
  );
  return normalizeCategoryList([...fromVendor, ...fromProfile, ...fromServices]);
}

/** Recompute `serviceCategories` from explicit picks + service rows. */
export function mergeProfileCategories(profile: {
  serviceCategories?: unknown;
  services?: Array<{ category?: string }>;
}): string[] {
  const explicit = normalizeCategoryList(profile.serviceCategories);
  const fromServices = normalizeCategoryList(
    (profile.services || []).map((s) => s?.category).filter(Boolean),
  );
  return normalizeCategoryList([...explicit, ...fromServices]);
}

export function vendorMatchesCategoryFilter(
  vendorCategories: string[] | string,
  filter: string,
): boolean {
  if (!filter || filter.toLowerCase() === 'all') return true;
  const list = Array.isArray(vendorCategories)
    ? vendorCategories
    : normalizeCategoryList(vendorCategories);
  const b = filter.toLowerCase();
  return list.some((cat) => {
    const a = cat.toLowerCase();
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    if (b === 'flowers' && (a.includes('floral') || a.includes('flower'))) return true;
    if ((b === 'venue' || b === 'venues') && a.includes('venue')) return true;
    return false;
  });
}
