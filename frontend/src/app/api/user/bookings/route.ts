import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import { getAuthenticatedUserFromRequest } from '@/lib/auth';
import { buildVendorNameResolver } from '@/lib/userBookingVendorNames';

const getBookings = () => readDataFile<any[]>('bookings.json', []);

// GET /api/user/bookings — bookings for the signed-in user only
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = String(user.id);
    const allBookings = await getBookings();
    const resolveName = await buildVendorNameResolver();

    // Only rows for this JWT user; never return demo/seed rows (__seed_* customerIds).
    const userBookings = allBookings
      .filter((booking: any) => {
        const bid = String(booking.customerId ?? '');
        if (!bid || bid.startsWith('__seed_')) return false;
        return bid === customerId;
      })
      .map((booking: any) => ({
        ...booking,
        vendorName: resolveName(String(booking.vendorId ?? '')),
      }));

    return NextResponse.json({
      success: true,
      data: userBookings,
    });
  } catch (error) {
    console.error('Error in GET /api/user/bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user bookings' },
      { status: 500 }
    );
  }
}
