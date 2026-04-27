import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { findVendorBySessionEmail, bookingBelongsToVendor } from '@/lib/vendorLeadScope';

function readBookings() {
  return readDataFile<any[]>('bookings.json', []);
}

function writeBookings(rows: any[]) {
  return writeDataFile('bookings.json', rows);
}

/**
 * Vendor confirms a pending booking or marks a confirmed booking as completed.
 */
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

    const bookingId = String(params.id || '').trim();
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking id is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '').trim().toLowerCase();
    if (action !== 'confirm' && action !== 'complete') {
      return NextResponse.json(
        { success: false, error: 'Action must be confirm or complete' },
        { status: 400 },
      );
    }

    const [bookings, vendors] = await Promise.all([readBookings(), readDataFile<any[]>('vendors.json', [])]);
    const catalogVendor = findVendorBySessionEmail(vendors, session);
    const idx = bookings.findIndex(
      (b: any) => String(b.id) === bookingId && bookingBelongsToVendor(b, session, catalogVendor),
    );
    if (idx < 0) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const current = { ...bookings[idx] };
    if (action === 'confirm') {
      if (String(current.status) !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Only pending bookings can be confirmed' },
          { status: 400 },
        );
      }
      current.status = 'confirmed';
      current.updatedAt = nowIso;
    } else {
      if (String(current.status) !== 'confirmed') {
        return NextResponse.json(
          { success: false, error: 'Only confirmed bookings can be marked complete' },
          { status: 400 },
        );
      }
      current.status = 'completed';
      current.updatedAt = nowIso;
    }

    bookings[idx] = current;
    await writeBookings(bookings);
    return NextResponse.json({ success: true, data: current });
  } catch (error) {
    console.error('Error in PATCH /api/vendor/bookings/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 },
    );
  }
}
