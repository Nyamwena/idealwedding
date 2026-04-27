import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/vendorSession';
import { readDataFile } from '@/lib/dataFileStore';
import { findVendorBySessionEmail, leadBelongsToVendor } from '@/lib/vendorLeadScope';
import { readQuoteRequestsArray } from '@/lib/quotesData';

/**
 * Open instant quote requests from couples. Visible to every logged-in vendor until
 * the couple approves a quotation (request status becomes `awarded`).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 },
      );
    }
    const all = await readQuoteRequestsArray();
    const vendors = await readDataFile<any[]>('vendors.json', []);
    const catalogVendor = findVendorBySessionEmail(vendors, session);
    const open = (all as any[]).filter((r) => {
      if (String(r?.status || '') !== 'open') return false;
      const scopedVendorId = String(r?.targetVendorId || '').trim();
      const scopedVendorUserId = String(r?.targetVendorUserId || '').trim();
      // Global request: visible to all vendors
      if (!scopedVendorId && !scopedVendorUserId) return true;
      // Targeted request: visible only to matching vendor account
      return leadBelongsToVendor(
        { vendorId: scopedVendorId, vendorUserId: scopedVendorUserId },
        session,
        catalogVendor,
      );
    });
    const rows = open
      .map((r) => ({
        id: String(r.id),
        customerName: String(r.customerName || 'Couple'),
        customerEmail: String(r.customerEmail || ''),
        category: String(r.category || ''),
        description: String(r.description || ''),
        budget: Number(r.budget) || 0,
        location: String(r.location || ''),
        eventDate: String(r.eventDate || ''),
        guestCount: r.guestCount != null ? Number(r.guestCount) : undefined,
        specialRequirements: r.specialRequirements != null ? String(r.specialRequirements) : undefined,
        targetVendorId: r.targetVendorId ? String(r.targetVendorId) : undefined,
        targetVendorName: r.targetVendorName ? String(r.targetVendorName) : undefined,
        createdAt: String(r.createdAt || ''),
        status: 'open' as const,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('GET /api/vendor/quote-requests', e);
    return NextResponse.json(
      { success: false, error: 'Failed to load open quote requests' },
      { status: 500 },
    );
  }
}
