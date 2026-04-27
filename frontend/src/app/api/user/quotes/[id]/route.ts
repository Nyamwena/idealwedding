import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/auth';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { readQuotesArray, readQuoteRequestsArray, writeQuotesArray, writeQuoteRequestsArray } from '@/lib/quotesData';

function readBookings() {
  return readDataFile<any[]>('bookings.json', []);
}

function writeBookings(bookings: any[]) {
  return writeDataFile('bookings.json', bookings);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const quoteId = String(params.id || '').trim();
    if (!quoteId) {
      return NextResponse.json({ success: false, error: 'Quote id is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '').trim().toLowerCase();
    if (action !== 'approve' && action !== 'reject' && action !== 'requote') {
      return NextResponse.json(
        { success: false, error: 'Action must be approve, requote, or reject' },
        { status: 400 },
      );
    }

    const [quotes, bookings] = await Promise.all([readQuotesArray(), readBookings()]);
    const userId = String(user.id);
    const userEmail = String(user.email || '').trim().toLowerCase();
    const idx = quotes.findIndex((q: any) => {
      if (String(q.id) !== quoteId) return false;
      const qUserId = String(q.customerId || '').trim();
      const qEmail = String(q.customerEmail || q.coupleEmail || '').trim().toLowerCase();
      return (qUserId && qUserId === userId) || (qEmail && qEmail === userEmail);
    });
    if (idx < 0) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const quote = { ...quotes[idx] };
    if (action === 'approve') {
      quote.status = 'accepted';
      quote.acceptedAt = nowIso;
      quote.updatedAt = nowIso;
      quote.customerId = quote.customerId || userId;
      quote.customerEmail = quote.customerEmail || userEmail;

      const requestId = String(quote.quoteRequestId || '').trim();
      if (requestId) {
        const qreq = await readQuoteRequestsArray();
        const ri = qreq.findIndex((r: any) => String(r.id) === requestId);
        if (ri >= 0) {
          qreq[ri] = {
            ...qreq[ri],
            status: 'awarded',
            awardedAt: nowIso,
            awardedQuoteId: quoteId,
          };
          await writeQuoteRequestsArray(qreq);
        }
      }

      const existingBooking = bookings.find(
        (b: any) => String(b.quoteId || '') === quoteId && String(b.customerId || '') === userId,
      );
      if (!existingBooking) {
        const amount = Number(quote.amount || quote.budget || 0);
        const weddingDate = String(quote.eventDate || quote.weddingDate || '');
        const booking = {
          id: `booking_${Date.now()}`,
          quoteId,
          vendorId: String(quote.vendorId || ''),
          vendorUserId: quote.vendorUserId ? String(quote.vendorUserId) : undefined,
          customerId: userId,
          customerName:
            String(quote.customerName || '').trim() ||
            [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
            String(user.email || '').split('@')[0] ||
            'Couple',
          customerEmail: String(quote.customerEmail || userEmail).trim().toLowerCase(),
          serviceCategory: String(quote.serviceCategory || quote.category || quote.service || 'General'),
          serviceName: String(quote.serviceType || quote.service || quote.adTitle || 'Wedding Service'),
          weddingDate,
          location: String(quote.location || ''),
          amount,
          status: 'pending',
          depositPaid: false,
          depositAmount: Math.round(amount * 0.2),
          finalPaymentDue: weddingDate
            ? new Date(new Date(weddingDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
            : nowIso,
          notes: String(quote.notes || quote.description || ''),
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        bookings.push(booking);
      }
    } else if (action === 'reject') {
      quote.status = 'rejected';
      quote.rejectedAt = nowIso;
      quote.updatedAt = nowIso;
      quote.customerId = quote.customerId || userId;
      quote.customerEmail = quote.customerEmail || userEmail;
    } else {
      quote.status = 'requote_requested';
      quote.requoteRequestedAt = nowIso;
      quote.updatedAt = nowIso;
      quote.customerId = quote.customerId || userId;
      quote.customerEmail = quote.customerEmail || userEmail;
    }

    quotes[idx] = quote;
    await Promise.all([writeQuotesArray(quotes), writeBookings(bookings)]);
    return NextResponse.json({ success: true, data: quote });
  } catch (error) {
    console.error('Error in PATCH /api/user/quotes/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quote' },
      { status: 500 },
    );
  }
}
