import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { findVendorBySessionEmail, leadBelongsToVendor } from '@/lib/vendorLeadScope';
import { readQuotesArray, writeQuotesArray, readQuoteRequestsArray } from '@/lib/quotesData';

function readLeads() {
  return readDataFile<any[]>('vendor-leads.json', []);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    const vendorUserId = session?.userId;
    if (!vendorUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const [quotes, vendors] = await Promise.all([readQuotesArray(), readDataFile<any[]>('vendors.json', [])]);
    const catalogVendor = findVendorBySessionEmail(vendors, session!);
    const scoped = quotes.filter((q: any) => leadBelongsToVendor(q, session!, catalogVendor));

    return NextResponse.json({ success: true, data: scoped });
  } catch (error) {
    console.error('Error reading vendor quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read vendor quotes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    const vendorUserId = session?.userId;
    if (!vendorUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const quoteRequestId = String(body?.quoteRequestId || '').trim();
    const leadId = String(body?.leadId || '').trim();
    const { amount, description, notes } = body;

    if (!amount || !description) {
      return NextResponse.json(
        { success: false, error: 'amount and description are required' },
        { status: 400 }
      );
    }

    const vendorId = session!.vendorId;
    const [quotes, leads, vendors, qreqs] = await Promise.all([
      readQuotesArray(),
      readLeads(),
      readDataFile<any[]>('vendors.json', []),
      readQuoteRequestsArray(),
    ]);
    const catalogVendor = findVendorBySessionEmail(vendors, session!);

    let lead: any = null;
    let fromRequest: any = null;

    if (quoteRequestId) {
      fromRequest = qreqs.find(
        (r: any) => String(r.id) === quoteRequestId && String(r.status || '') === 'open',
      );
      if (!fromRequest) {
        return NextResponse.json(
          { success: false, error: 'Quote request not found or already fulfilled' },
          { status: 400 },
        );
      }
    } else {
      if (!leadId) {
        return NextResponse.json(
          { success: false, error: 'leadId or quoteRequestId is required' },
          { status: 400 }
        );
      }
      lead = leads.find((l: any) => l.id === leadId && leadBelongsToVendor(l, session, catalogVendor));
      if (!lead) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
      }
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const quote: Record<string, unknown> = {
      id: `quote_${Date.now()}`,
      leadId: lead ? lead.id : '',
      coupleName: lead?.coupleName || fromRequest?.customerName || 'Unknown Couple',
      coupleEmail: lead?.coupleEmail || fromRequest?.customerEmail || '',
      customerName: lead?.coupleName || fromRequest?.customerName || 'Unknown Couple',
      customerEmail: lead?.coupleEmail || fromRequest?.customerEmail || '',
      customerId: lead?.customerId
        ? String(lead.customerId)
        : fromRequest?.customerId
          ? String(fromRequest.customerId)
          : undefined,
      serviceType: lead?.serviceCategory || fromRequest?.category || 'Wedding Service',
      serviceCategory: fromRequest?.category || lead?.serviceCategory,
      eventDate: lead?.weddingDate || fromRequest?.eventDate || '',
      location: lead?.location || fromRequest?.location || '',
      status: fromRequest ? 'sent' : 'draft',
      amount: Number(amount),
      description,
      notes: notes || '',
      createdAt: nowIso,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      vendorUserId,
      vendorId,
    };
    if (fromRequest) {
      quote.quoteRequestId = String(fromRequest.id);
      quote.sentAt = nowIso;
      quote.updatedAt = nowIso;
    }

    quotes.push(quote);
    await writeQuotesArray(quotes);

    return NextResponse.json({ success: true, data: quote }, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor quote' },
      { status: 500 }
    );
  }
}
