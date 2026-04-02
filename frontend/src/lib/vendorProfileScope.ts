import type { VendorSession } from '@/lib/vendorSession';
import { idsMatchLoose } from '@/lib/vendorLeadScope';

/**
 * Whether a `vendor-profiles.json` row belongs to the logged-in vendor.
 * Supports `userId`, `id === session.vendorId`, and legacy `id: vendor_XXX` with padded suffix.
 */
export function profileBelongsToVendor(profile: any, session: VendorSession): boolean {
  if (!profile) return false;
  const uid = String(session.userId);
  const vid = session.vendorId;
  if (String(profile.userId || '') === uid) return true;
  if (String(profile.id || '') === vid) return true;
  const pid = String(profile.id || '');
  if (pid.startsWith('vendor_')) {
    const suffix = pid.slice('vendor_'.length);
    if (idsMatchLoose(suffix, uid)) return true;
  }
  return false;
}

export function findVendorProfileIndex(profiles: any[], session: VendorSession): number {
  return profiles.findIndex((p) => profileBelongsToVendor(p, session));
}

export function findVendorProfile(profiles: any[], session: VendorSession): any | undefined {
  return profiles.find((p) => profileBelongsToVendor(p, session));
}
