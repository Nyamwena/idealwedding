import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { findVendorBySessionEmail, bookingBelongsToVendor } from '@/lib/vendorLeadScope';

function readBookings() {
  return readDataFile<any[]>('bookings.json', []);
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

    const [bookings, vendors] = await Promise.all([readBookings(), readDataFile<any[]>('vendors.json', [])]);
    const catalogVendor = findVendorBySessionEmail(vendors, session!);
    const scoped = bookings.filter((b: any) => bookingBelongsToVendor(b, session!, catalogVendor));

    return NextResponse.json({ success: true, data: scoped });
  } catch (error) {
    console.error('Error reading vendor bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read vendor bookings' },
      { status: 500 }
    );
  }
}
