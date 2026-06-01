import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { findVendorBySessionEmail } from '@/lib/vendorLeadScope';
import type { VendorSession } from '@/lib/vendorSession';

export type VendorApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export function catalogStatusToApproval(status: unknown): VendorApprovalStatus {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'suspended') return 'suspended';
  return 'pending';
}

/** Apply admin catalog status (`vendors.json`) onto a vendor profile row. */
export function applyCatalogApprovalToProfile(profile: any, catalogVendor: any | null | undefined) {
  if (!catalogVendor) return profile;
  const approvalStatus = catalogStatusToApproval(catalogVendor.status);
  return {
    ...profile,
    approvalStatus,
    isApproved: approvalStatus === 'approved',
  };
}

export function findProfileIndexesForCatalogVendor(
  profiles: any[],
  catalogVendor: { id?: string; email?: string },
): number[] {
  const email = String(catalogVendor.email || '').trim().toLowerCase();
  const vendorId = String(catalogVendor.id || '');
  const indexes = new Set<number>();

  profiles.forEach((profile, index) => {
    const profileId = String(profile?.id || '');
    const profileEmail = String(profile?.contactInfo?.email || '').trim().toLowerCase();
    const userId = String(profile?.userId || '');

    if (vendorId && profileId === vendorId) indexes.add(index);
    if (vendorId && profileId === `vendor_${vendorId}`) indexes.add(index);
    if (vendorId && userId && userId === vendorId.replace(/^vendor_/i, '')) indexes.add(index);
    if (email && profileEmail === email) indexes.add(index);
  });

  return Array.from(indexes);
}

/** Keep vendor-profiles.json in sync when admin changes vendors.json status. */
export async function syncVendorProfilesApprovalForCatalogVendor(catalogVendor: {
  id?: string;
  email?: string;
  status?: unknown;
}) {
  const profiles = await readDataFile<any[]>('vendor-profiles.json', []);
  const indexes = findProfileIndexesForCatalogVendor(profiles, catalogVendor);
  if (indexes.length === 0) return;

  const approvalStatus = catalogStatusToApproval(catalogVendor.status);
  const isApproved = approvalStatus === 'approved';
  let changed = false;

  for (const index of indexes) {
    const row = profiles[index];
    if (
      row.approvalStatus === approvalStatus &&
      Boolean(row.isApproved) === isApproved
    ) {
      continue;
    }
    profiles[index] = {
      ...row,
      approvalStatus,
      isApproved,
      lastUpdated: new Date().toISOString(),
    };
    changed = true;
  }

  if (changed) {
    await writeDataFile('vendor-profiles.json', profiles);
  }
}

/** Resolve approval from catalog when a vendor loads their profile. Persists if stale. */
export async function resolveVendorProfileApproval(
  session: VendorSession,
  profile: any,
  profiles: any[],
): Promise<any> {
  const vendors = await readDataFile<any[]>('vendors.json', []);
  const catalogVendor = findVendorBySessionEmail(vendors, session);
  const resolved = applyCatalogApprovalToProfile(profile, catalogVendor);

  if (!catalogVendor) return resolved;

  const indexes = new Set(findProfileIndexesForCatalogVendor(profiles, catalogVendor));
  const currentIdx = profiles.findIndex(
    (p) => String(p?.id || '') === String(profile?.id || ''),
  );
  if (currentIdx >= 0) indexes.add(currentIdx);

  let changed = false;
  for (const index of indexes) {
    const row = profiles[index];
    if (
      row.approvalStatus === resolved.approvalStatus &&
      Boolean(row.isApproved) === Boolean(resolved.isApproved)
    ) {
      continue;
    }
    profiles[index] = {
      ...row,
      approvalStatus: resolved.approvalStatus,
      isApproved: resolved.isApproved,
      lastUpdated: new Date().toISOString(),
    };
    changed = true;
  }

  if (changed) {
    await writeDataFile('vendor-profiles.json', profiles);
  }

  return resolved;
}
