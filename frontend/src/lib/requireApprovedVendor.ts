import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession, type VendorSession } from '@/lib/vendorSession';
import { getVendorCatalogApproval } from '@/lib/vendorApprovalSync';

export type ApprovedVendorResult =
  | { ok: true; session: VendorSession }
  | { ok: false; response: NextResponse };

/** Require a signed-in vendor whose catalog status is approved. */
export async function requireApprovedVendor(
  request: NextRequest,
): Promise<ApprovedVendorResult> {
  const session = await getVendorSession(request);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 },
      ),
    };
  }

  const approval = await getVendorCatalogApproval(session);
  if (!approval.isApproved) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Vendor account is not approved',
          approvalStatus: approval.approvalStatus,
          message: approval.message,
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, session };
}
