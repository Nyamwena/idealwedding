import type { VendorSession } from '@/lib/vendorSession';

/**
 * The vendor record in `vendors.json` whose `email` matches the logged-in session (case-insensitive).
 * Used to align leads that store catalog ids (`v1`, `v2`, …) with `session.vendorId` like `vendor_8`.
 */
export function findVendorBySessionEmail(
  vendors: any[] | null | undefined,
  session: VendorSession,
): any | null {
  const e = String(session.email || '').trim().toLowerCase();
  if (!e) return null;
  const row = (vendors || []).find(
    (v: any) => String(v?.email || '').trim().toLowerCase() === e,
  );
  return row ?? null;
}

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
 *
 * @param catalogVendor — optional row from `vendors.json` (same email as session) so leads tagged with
 *   that row's `id` (e.g. `v2`) are visible to the account even when `vendorUserId` was not stored.
 */
export function leadBelongsToVendor(
  lead: any,
  session: VendorSession,
  catalogVendor?: { id: string } | null,
): boolean {
  const uid = String(session.userId);
  const vid = session.vendorId;
  if (String(lead.vendorUserId || '') === uid) return true;
  if (String(lead.vendorId || '') === vid) return true;

  const lVid = String(lead.vendorId || '');
  if (lVid && idsMatchLoose(lVid, uid)) return true;
  if (lVid && idsMatchLoose(lVid, vid)) return true;

  const sVid = String(vid || '');
  if (sVid.startsWith('vendor_')) {
    const sSuffix = sVid.slice('vendor_'.length);
    if (idsMatchLoose(lVid, sSuffix)) return true;
  }

  if (lVid.startsWith('vendor_')) {
    const suffix = lVid.slice('vendor_'.length);
    if (idsMatchLoose(suffix, uid)) return true;
    if (idsMatchLoose(suffix, sVid)) return true;
  }

  if (catalogVendor && lVid && String(catalogVendor.id) === lVid) return true;
  return false;
}

/** Same scoping as leads, for `bookings.json` rows. */
export function bookingBelongsToVendor(
  booking: any,
  session: VendorSession,
  catalogVendor?: { id: string } | null,
): boolean {
  return leadBelongsToVendor(
    {
      vendorId: booking?.vendorId,
      vendorUserId: booking?.vendorUserId,
    },
    session,
    catalogVendor,
  );
}
