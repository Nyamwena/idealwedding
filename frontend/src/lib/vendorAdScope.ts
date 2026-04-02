import type { VendorSession } from '@/lib/vendorSession';
import { idsMatchLoose } from '@/lib/vendorLeadScope';

export function adBelongsToVendor(ad: any, session: VendorSession): boolean {
  if (!ad) return false;
  const uid = String(session.userId);
  const vid = session.vendorId;
  if (String(ad.vendorUserId || '') === uid) return true;
  if (String(ad.vendorId || '') === vid) return true;
  const aVid = String(ad.vendorId || '');
  if (aVid.startsWith('vendor_')) {
    const suffix = aVid.slice('vendor_'.length);
    if (idsMatchLoose(suffix, uid)) return true;
  }
  const em = String(ad.advertiserEmail || '').toLowerCase().trim();
  if (em && em === session.email.toLowerCase().trim()) return true;
  return false;
}

/**
 * Pre-scope rows: no vendor id/email on the ad, but `advertiser` matches the vendor's profile business name.
 * Avoids leaking legacy global ads to the wrong vendor.
 */
export function legacyAdMatchesVendorProfile(
  ad: any,
  session: VendorSession,
  profile: any | null | undefined,
): boolean {
  if (!profile) return false;
  if (String(ad.vendorUserId || '') || String(ad.vendorId || '') || String(ad.advertiserEmail || '').trim()) {
    return false;
  }
  const bn = String(profile.businessName || '').trim();
  if (!bn) return false;
  return String(ad.advertiser || '').trim() === bn;
}

export function adVisibleToVendor(
  ad: any,
  session: VendorSession,
  profile: any | null | undefined,
): boolean {
  return adBelongsToVendor(ad, session) || legacyAdMatchesVendorProfile(ad, session, profile);
}
