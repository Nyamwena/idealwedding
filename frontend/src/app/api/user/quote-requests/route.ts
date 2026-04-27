import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/auth';
import { readDataFile } from '@/lib/dataFileStore';
import { readQuoteRequestsArray, writeQuoteRequestsArray } from '@/lib/quotesData';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = String(user.id);
    const userEmail = String(user.email || '').trim().toLowerCase();
    const all = await readQuoteRequestsArray();
    const rows = all
      .filter((r: any) => {
        const id = String(r.customerId || '').trim();
        const em = String(r.customerEmail || '').trim().toLowerCase();
        return (id && id === userId) || (em && em === userEmail);
      })
      .sort((a: any, b: any) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('GET /api/user/quote-requests', e);
    return NextResponse.json(
      { success: false, error: 'Failed to load quote requests' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const category = String(body?.category || '').trim();
    const description = String(body?.description || '').trim();
    const location = String(body?.location || '').trim();
    const eventDate = String(body?.date || body?.eventDate || '').trim();
    const budget = Number(body?.budget);
    if (!category || !description || !location || !eventDate || !Number.isFinite(budget) || budget < 0) {
      return NextResponse.json(
        { success: false, error: 'category, description, location, date, and budget are required' },
        { status: 400 },
      );
    }
    const guestCount =
      body?.guestCount != null && String(body.guestCount).trim() !== ''
        ? Math.max(0, parseInt(String(body.guestCount), 10))
        : undefined;
    const specialRequirements = String(body?.specialRequirements || '').trim() || undefined;
    const targetVendorId = String(body?.vendorId || '').trim() || undefined;
    const targetVendorName = String(body?.vendorName || '').trim() || undefined;
    const userId = String(user.id);
    const userEmail = String(user.email || '').trim().toLowerCase();
    const customerName =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      userEmail.split('@')[0] ||
      'Couple';
    const id = `qreq_${Date.now()}`;
    const now = new Date().toISOString();
    let targetVendorUserId: string | undefined;
    if (targetVendorId) {
      const vendors = await readDataFile<any[]>('vendors.json', []);
      const matched = vendors.find((v: any) => String(v?.id || '') === targetVendorId);
      if (matched?.userId != null) {
        targetVendorUserId = String(matched.userId);
      }
    }
    const next = {
      id,
      customerId: userId,
      customerEmail: userEmail,
      customerName,
      category,
      description,
      budget,
      location,
      eventDate,
      guestCount: Number.isFinite(guestCount as number) ? guestCount : undefined,
      specialRequirements,
      targetVendorId,
      targetVendorUserId,
      targetVendorName,
      status: 'open' as const,
      createdAt: now,
    };
    const all = await readQuoteRequestsArray();
    all.push(next);
    await writeQuoteRequestsArray(all);
    return NextResponse.json({ success: true, data: next }, { status: 201 });
  } catch (e) {
    console.error('POST /api/user/quote-requests', e);
    return NextResponse.json(
      { success: false, error: 'Failed to create quote request' },
      { status: 500 },
    );
  }
}
