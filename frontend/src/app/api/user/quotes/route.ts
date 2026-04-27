import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/auth';
import { buildVendorNameResolver } from '@/lib/userBookingVendorNames';
import { readQuotesArray } from '@/lib/quotesData';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String(user.id);
    const userEmail = String(user.email || '').trim().toLowerCase();
    const quotes = await readQuotesArray();
    const resolveVendorName = await buildVendorNameResolver();

    const rows = quotes
      .filter((q: any) => {
        const qUserId = String(q.customerId || '').trim();
        const qEmail = String(q.customerEmail || q.coupleEmail || '').trim().toLowerCase();
        return (qUserId && qUserId === userId) || (qEmail && qEmail === userEmail);
      })
      .map((q: any) => ({
        ...q,
        vendorName: q.vendorName || resolveVendorName(String(q.vendorId || '')),
      }))
      .sort((a: any, b: any) => {
        const ta = new Date(a.sentAt || a.createdAt || a.requestDate || 0).getTime();
        const tb = new Date(b.sentAt || b.createdAt || b.requestDate || 0).getTime();
        return tb - ta;
      });

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error in GET /api/user/quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user quotes' },
      { status: 500 },
    );
  }
}
