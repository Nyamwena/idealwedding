import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read quotes from file
function readQuotes() {
  return readDataFile<any>('quotes.json', [
    {
      id: '1',
      customerName: 'Sarah & Mike Johnson',
      customerEmail: 'sarah.mike@example.com',
      vendorName: 'Elegant Flowers',
      service: 'Wedding Flowers',
      status: 'pending',
      amount: 2500,
      requestDate: '2024-09-20',
      message: 'Looking for beautiful wedding flowers for our ceremony in October.'
    }
  ]);
}

// Helper function to write quotes to file
function writeQuotes(quotes: any[]) {
  return writeDataFile('quotes.json', quotes);
}

function readVendorLeads() {
  return readDataFile<any>('vendor-leads.json', []);
}

function writeVendorLeads(leads: any[]) {
  return writeDataFile('vendor-leads.json', leads);
}

function normalizeRows(input: any, key?: string): any[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === 'object' && key && Array.isArray(input[key])) return input[key];
  return [];
}

function readVendors() {
  return readDataFile<any[]>('vendors.json', []);
}

// GET /api/admin/quotes - Get all quotes
export async function GET() {
  try {
    const raw = await readQuotes();
    const quotes = normalizeRows(raw, 'quotes');
    return NextResponse.json({
      success: true,
      data: quotes
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/quotes - Create new quote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const quotes = normalizeRows(await readQuotes(), 'quotes');
    const leads = normalizeRows(await readVendorLeads(), 'leads');
    const vendors = await readVendors();
    const newId = `q${Date.now()}`;
    
    const newQuote = {
      id: newId,
      ...body,
      requestDate: new Date().toISOString().split('T')[0]
    };
    
    quotes.push(newQuote);
    const isSponsoredRequest = String(body?.source || '') === 'sponsored_ad';
    let vendorId = String(body?.vendorId || '').trim();
    let vendorUserId = String(body?.vendorUserId || '').trim();
    if (!vendorId) {
      if (vendorUserId) {
        const vByUser = vendors.find(
          (v: any) => String(v.userId || v.vendorUserId || '').trim() === vendorUserId,
        );
        if (vByUser) vendorId = String(vByUser.id || '');
      }
      if (!vendorId && body?.advertiserEmail) {
        const vByEmail = vendors.find(
          (v: any) =>
            String(v.email || '').trim().toLowerCase() === String(body.advertiserEmail || '').trim().toLowerCase(),
        );
        if (vByEmail) vendorId = String(vByEmail.id || '');
      }
      if (!vendorId && body?.vendorName) {
        const vByName = vendors.find(
          (v: any) =>
            String(v.name || '').trim().toLowerCase() === String(body.vendorName || '').trim().toLowerCase(),
        );
        if (vByName) vendorId = String(vByName.id || '');
      }
    }
    if (!vendorUserId && vendorId) {
      const v = vendors.find((row: any) => String(row.id) === String(vendorId).trim());
      if (v) vendorUserId = String(v.userId || v.vendorUserId || v.authUserId || '').trim();
    }
    if (!vendorId && vendorUserId) {
      // Keep a stable scoped key so /api/vendor/leads can match by session vendor id format.
      vendorId = `vendor_${vendorUserId}`;
    }
    if (isSponsoredRequest && !vendorId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This ad is not linked to a vendor account. Please link a vendor in Admin Ads (vendor dropdown) and try again.',
        },
        { status: 400 },
      );
    }

    if (isSponsoredRequest && vendorId) {
      const nowIso = new Date().toISOString();
      const leadDescription = [
        `Ad: ${String(body?.adTitle || body?.vendorName || 'Sponsored request')}`,
        String(body?.description || body?.message || '').trim(),
        body?.specialRequirements
          ? `Special requirements: ${String(body.specialRequirements).trim()}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      const lead = {
        id: `lead_${Date.now()}`,
        vendorId,
        vendorUserId: vendorUserId || undefined,
        customerId: body?.customerId ? String(body.customerId) : undefined,
        coupleName: String(body?.customerName || 'New Couple'),
        coupleEmail: String(body?.customerEmail || ''),
        couplePhone: String(body?.customerPhone || ''),
        weddingDate: String(body?.eventDate || body?.weddingDate || ''),
        location: String(body?.location || ''),
        serviceCategory: String(body?.serviceCategory || body?.category || body?.service || 'General'),
        budget: Number(body?.budget || body?.amount || 0),
        description: leadDescription,
        timestamp: nowIso,
        status: 'new',
        referralTag: `REF-${new Date().getFullYear()}-${Date.now()}`,
        creditsUsed: 0,
        responseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        creditsSettled: true,
        source: 'sponsored_quote_request',
        adId: body?.adId ? String(body.adId) : undefined,
      };
      leads.push(lead);
    }

    await Promise.all([writeQuotes(quotes), writeVendorLeads(leads)]);
    
    return NextResponse.json({
      success: true,
      data: newQuote
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}
