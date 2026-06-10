import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/vendorSession';
import { getVendorCatalogApproval } from '@/lib/vendorApprovalSync';

export const dynamic = 'force-dynamic';

/** Returns catalog approval for the current vendor session (no approval required). */
export async function GET(request: NextRequest) {
  const session = await getVendorSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized vendor access' },
      { status: 401 },
    );
  }

  const approval = await getVendorCatalogApproval(session);
  return NextResponse.json({
    success: true,
    ...approval,
  });
}
