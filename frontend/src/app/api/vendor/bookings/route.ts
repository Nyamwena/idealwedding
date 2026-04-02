import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';

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

    const vendorId = session!.vendorId;
    const bookings = await readBookings();
    const scoped = bookings.filter(
      (b: any) =>
        String(b.vendorUserId || '') === vendorUserId ||
        String(b.vendorId || '') === vendorId
    );

    return NextResponse.json({ success: true, data: scoped });
  } catch (error) {
    console.error('Error reading vendor bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read vendor bookings' },
      { status: 500 }
    );
  }
}
