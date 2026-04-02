import type { VendorSession } from '@/lib/vendorSession';

/** Compare ids when either side may be zero-padded (e.g. "001" vs "1"). */
export function idsMatchLoose(a: string, b: string): boolean {
  const sa = String(a ?? '').trim();
  const sb = String(b ?? '').trim();
  if (sa === sb) return true;
  const na = parseInt(sa, 10);
  const nb = parseInt(sb, 10);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na === nb) return true;
  return false;
}

/**
 * Whether a lead row belongs to the logged-in vendor.
 * Supports `vendorUserId` + `vendorId`, and legacy rows with only `vendorId: vendor_XXX`
 * where XXX matches `session.userId` (including numeric padding).
 */
export function leadBelongsToVendor(lead: any, session: VendorSession): boolean {
  const uid = String(session.userId);
  const vid = session.vendorId;
  if (String(lead.vendorUserId || '') === uid) return true;
  if (String(lead.vendorId || '') === vid) return true;

  const lVid = String(lead.vendorId || '');
  if (lVid.startsWith('vendor_')) {
    const suffix = lVid.slice('vendor_'.length);
    if (idsMatchLoose(suffix, uid)) return true;
  }
  return false;
}
