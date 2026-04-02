import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getAuthenticatedUserFromRequest } from '@/lib/auth';
import { buildVendorNameResolver } from '@/lib/userBookingVendorNames';

const getBookings = () => readDataFile<any[]>('bookings.json', []);
const saveBookings = (bookings: any[]) => writeDataFile('bookings.json', bookings);

// GET /api/user/bookings/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;
    const customerId = String(user.id);
    const allBookings = await getBookings();
    const booking = allBookings.find((b: any) => {
      const bid = String(b.customerId ?? '');
      if (!bid || bid.startsWith('__seed_')) return false;
      return b.id === bookingId && bid === customerId;
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const resolveName = await buildVendorNameResolver();

    return NextResponse.json({
      success: true,
      data: {
        ...booking,
        vendorName: resolveName(String(booking.vendorId ?? '')),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/user/bookings/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT /api/user/bookings/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;
    const customerId = String(user.id);
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    let allBookings = await getBookings();
    const bookingIndex = allBookings.findIndex((b: any) => {
      const bid = String(b.customerId ?? '');
      if (!bid || bid.startsWith('__seed_')) return false;
      return b.id === bookingId && bid === customerId;
    });

    if (bookingIndex === -1) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const booking = allBookings[bookingIndex];
    let updatedBooking = { ...booking };

    switch (action) {
      case 'cancel':
        if (booking.status === 'pending' || booking.status === 'confirmed') {
          updatedBooking.status = 'cancelled';
          updatedBooking.updatedAt = new Date().toISOString();
        } else {
          return NextResponse.json(
            { success: false, error: 'Cannot cancel booking in current status' },
            { status: 400 }
          );
        }
        break;

      case 'complete':
        if (booking.status === 'confirmed') {
          updatedBooking.status = 'completed';
          updatedBooking.updatedAt = new Date().toISOString();
        } else {
          return NextResponse.json(
            { success: false, error: 'Cannot complete booking in current status' },
            { status: 400 }
          );
        }
        break;

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    allBookings[bookingIndex] = updatedBooking;
    await saveBookings(allBookings);

    const resolveName = await buildVendorNameResolver();

    return NextResponse.json({
      success: true,
      data: {
        ...updatedBooking,
        vendorName: resolveName(String(updatedBooking.vendorId ?? '')),
      },
      message: `Booking ${action} successfully`,
    });
  } catch (error) {
    console.error('Error in PUT /api/user/bookings/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}
