import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { leadBelongsToVendor } from '@/lib/vendorLeadScope';

function readQuotes() {
  return readDataFile<any[]>('quotes.json', []);
}

function writeQuotes(quotes: any[]) {
  return writeDataFile('quotes.json', quotes);
}

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

    const vendorId = session!.vendorId;
    const quotes = await readQuotes();
    const scoped = quotes.filter(
      (q: any) =>
        String(q.vendorUserId || '') === vendorUserId ||
        String(q.vendorId || '') === vendorId
    );

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
    const { leadId, amount, description, notes } = body;

    if (!leadId || !amount || !description) {
      return NextResponse.json(
        { success: false, error: 'leadId, amount and description are required' },
        { status: 400 }
      );
    }

    const vendorId = session!.vendorId;
    const [quotes, leads] = await Promise.all([readQuotes(), readLeads()]);
    const lead = leads.find(
      (l: any) => l.id === leadId && leadBelongsToVendor(l, session),
    );

    const now = new Date();
    const quote = {
      id: `quote_${Date.now()}`,
      leadId,
      coupleName: lead?.coupleName || 'Unknown Couple',
      coupleEmail: lead?.coupleEmail || '',
      serviceType: lead?.serviceCategory || 'Wedding Service',
      eventDate: lead?.weddingDate || '',
      location: lead?.location || '',
      status: 'draft',
      amount: Number(amount),
      description,
      notes: notes || '',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      vendorUserId,
      vendorId,
    };

    quotes.push(quote);
    await writeQuotes(quotes);

    return NextResponse.json({ success: true, data: quote }, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor quote' },
      { status: 500 }
    );
  }
}
