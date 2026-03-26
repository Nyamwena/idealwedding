import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { readDataFile } from '@/lib/dataFileStore';

function getAuthToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get('token')?.value || null;
}

function requireAdmin(request: NextRequest): NextResponse | null {
  const token = getAuthToken(request);
  if (!token || !process.env.JWT_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as { role?: string };
    const role = String(payload.role || '').toUpperCase();
    if (role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const [transactions, vendors] = await Promise.all([
      readDataFile<any[]>('vendor-credit-transactions.json', []),
      readDataFile<any[]>('vendors.json', []),
    ]);

    const vendorById = new Map(vendors.map((v) => [String(v.id), v]));
    const vendorByEmail = new Map(vendors.map((v) => [String(v.email || '').toLowerCase(), v]));

    const enriched = transactions
      .map((tx) => {
        const vendor =
          vendorById.get(String(tx.vendorId || '')) ||
          vendorByEmail.get(String(tx.email || '').toLowerCase());
        return {
          ...tx,
          vendorName: vendor?.name || null,
          vendorCategory: vendor?.category || null,
          vendorEmail: vendor?.email || tx.email || null,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp || b.createdAt || 0).getTime() -
          new Date(a.timestamp || a.createdAt || 0).getTime(),
      );

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/credits/transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit transactions' },
      { status: 500 },
    );
  }
}
