import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper to read bookings from file
const getBookings = () => {
  return readDataFile<any[]>('bookings.json', []);
};

// Helper to write bookings to file
const saveBookings = (bookings: any[]) => {
  return writeDataFile('bookings.json', bookings);
};

// GET /api/user/bookings/[id] - Get specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const userId = 'customer_001'; // Mock user ID - in real app, get from auth

    const allBookings = await getBookings();
    const booking = allBookings.find((b: any) => b.id === bookingId && b.customerId === userId);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error in GET /api/user/bookings/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT /api/user/bookings/[id] - Update booking (cancel, complete, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const userId = 'customer_001'; // Mock user ID - in real app, get from auth
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    let allBookings = await getBookings();
    const bookingIndex = allBookings.findIndex((b: any) => b.id === bookingId && b.customerId === userId);

    if (bookingIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = allBookings[bookingIndex];
    let updatedBooking = { ...booking };

    // Handle different actions
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
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update the booking in the array
    allBookings[bookingIndex] = updatedBooking;

    // Save to file
    await saveBookings(allBookings);

    return NextResponse.json({
      success: true,
      data: updatedBooking,
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

