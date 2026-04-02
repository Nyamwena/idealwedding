import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/vendorSession';
import { ensureAdFundsWallet } from '@/lib/vendorAdFunds';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }
    const { rows, index } = await ensureAdFundsWallet(session);
    const w = rows[index];
    return NextResponse.json({
      success: true,
      data: {
        balance: Number(w.balance || 0),
        pendingBalance: Number(w.pendingBalance || 0),
        totalAdded: Number(w.totalAdded || 0),
        totalSpent: Number(w.totalSpent || 0),
        updatedAt: w.updatedAt,
      },
    });
  } catch (e) {
    console.error('GET /api/vendor/advertising-funds:', e);
    return NextResponse.json({ success: false, error: 'Failed to load ad funds' }, { status: 500 });
  }
}

/** Vendors cannot credit ad wallets; admins use POST /api/admin/vendor-ad-funds/add. */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Advertising funds are added by an administrator. Contact support if you need a top-up.',
    },
    { status: 403 },
  );
}
