import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  readAdFundsWallets,
  writeAdFundsWallets,
  findAdFundsWalletIndexForAd,
  approvePendingAdFundsAtIndex,
} from '@/lib/vendorAdFunds';

export const dynamic = 'force-dynamic';

function getAuthToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7).trim() || null;
  return request.cookies.get('accessToken')?.value || null;
}

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (String(user.role || '').toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/**
 * POST body: identify wallet with any of vendorUserId, vendorId, advertiserEmail (matches vendor-ad-funds + ad rows).
 */
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const syntheticAd = {
      vendorUserId: body.vendorUserId,
      vendorId: body.vendorId,
      advertiserEmail: body.advertiserEmail || body.email,
    };

    const hasId =
      String(syntheticAd.vendorUserId || '').trim() ||
      String(syntheticAd.vendorId || '').trim() ||
      String(syntheticAd.advertiserEmail || '').trim();
    if (!hasId) {
      return NextResponse.json(
        { success: false, error: 'Provide vendorUserId, vendorId, or advertiserEmail' },
        { status: 400 },
      );
    }

    const rows = await readAdFundsWallets();
    const idx = findAdFundsWalletIndexForAd(rows, syntheticAd);
    if (idx < 0) {
      return NextResponse.json(
        { success: false, error: 'No advertising wallet found for this advertiser' },
        { status: 404 },
      );
    }

    const moved = approvePendingAdFundsAtIndex(rows, idx);
    if (moved <= 0) {
      return NextResponse.json({
        success: true,
        data: {
          moved: 0,
          balance: Number(rows[idx].balance || 0),
          pendingBalance: Number(rows[idx].pendingBalance || 0),
        },
        message: 'No pending funds to approve',
      });
    }

    await writeAdFundsWallets(rows);

    return NextResponse.json({
      success: true,
      data: {
        moved,
        balance: Number(rows[idx].balance || 0),
        pendingBalance: Number(rows[idx].pendingBalance || 0),
        totalAdded: Number(rows[idx].totalAdded || 0),
      },
      message: 'Pending advertising funds approved',
    });
  } catch (e) {
    console.error('POST /api/admin/vendor-ad-funds/approve:', e);
    return NextResponse.json({ success: false, error: 'Failed to approve funds' }, { status: 500 });
  }
}
