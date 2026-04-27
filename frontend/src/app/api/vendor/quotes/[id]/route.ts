import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { findVendorBySessionEmail, leadBelongsToVendor } from '@/lib/vendorLeadScope';
import { readQuotesArray, writeQuotesArray } from '@/lib/quotesData';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getVendorSession(request);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 },
      );
    }

    const quoteId = String(params.id || '').trim();
    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'Quote id is required' },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '').trim().toLowerCase();
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action is required (update, send, or resend)' },
        { status: 400 },
      );
    }

    const [quotes, vendors] = await Promise.all([
      readQuotesArray(),
      readDataFile<any[]>('vendors.json', []),
    ]);
    const catalogVendor = findVendorBySessionEmail(vendors, session);
    const idx = quotes.findIndex(
      (q: any) => String(q.id) === quoteId && leadBelongsToVendor(q, session, catalogVendor),
    );
    if (idx < 0) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 },
      );
    }

    const current = { ...quotes[idx] };
    const nowIso = new Date().toISOString();

    if (String(current.status || '').toLowerCase() === 'accepted') {
      return NextResponse.json(
        { success: false, error: 'This quotation was accepted; it cannot be edited here' },
        { status: 400 },
      );
    }

    if (action === 'update') {
      const amount = Number(body?.amount);
      const description = String(body?.description || '').trim();
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid amount is required' },
          { status: 400 },
        );
      }
      if (!description) {
        return NextResponse.json(
          { success: false, error: 'description is required' },
          { status: 400 },
        );
      }
      current.amount = amount;
      current.description = description;
      if (body?.notes != null) current.notes = String(body.notes);
      current.updatedAt = nowIso;
      if (String(current.status || '') === 'draft') {
        current.status = 'sent';
        current.sentAt = nowIso;
      }
    } else if (action === 'send' || action === 'resend') {
      current.status = 'sent';
      current.sentAt = nowIso;
      current.updatedAt = nowIso;
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported action' },
        { status: 400 },
      );
    }

    quotes[idx] = current;
    await writeQuotesArray(quotes);
    return NextResponse.json({ success: true, data: current });
  } catch (error) {
    console.error('Error in PATCH /api/vendor/quotes/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quote' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getVendorSession(request);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 },
      );
    }

    const quoteId = String(params.id || '').trim();
    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'Quote id is required' },
        { status: 400 },
      );
    }

    const [quotes, vendors] = await Promise.all([
      readQuotesArray(),
      readDataFile<any[]>('vendors.json', []),
    ]);
    const catalogVendor = findVendorBySessionEmail(vendors, session);
    const idx = quotes.findIndex(
      (q: any) => String(q.id) === quoteId && leadBelongsToVendor(q, session, catalogVendor),
    );
    if (idx < 0) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 },
      );
    }

    const row = quotes[idx] as { status?: string };
    if (String(row?.status || '').toLowerCase() === 'accepted') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove a quotation the couple has already accepted' },
        { status: 400 },
      );
    }

    const next = quotes.filter((_, i) => i !== idx);
    await writeQuotesArray(next);
    return NextResponse.json({ success: true, data: { id: quoteId } });
  } catch (error) {
    console.error('Error in DELETE /api/vendor/quotes/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove quote' },
      { status: 500 },
    );
  }
}
