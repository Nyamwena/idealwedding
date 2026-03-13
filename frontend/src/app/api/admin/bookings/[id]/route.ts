import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read bookings from file
function readBookings() {
  return readDataFile<any[]>('bookings.json', []);
}

// Helper function to write bookings to file
function writeBookings(bookings: any[]) {
  return writeDataFile('bookings.json', bookings);
}

// GET /api/admin/bookings/[id] - Get specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookings = await readBookings();
    const booking = bookings.find((b: any) => b.id === params.id);
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/bookings/[id] - Update specific booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const bookings = await readBookings();
    const bookingIndex = bookings.findIndex((b: any) => b.id === params.id);
    
    if (bookingIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Update the booking
    bookings[bookingIndex] = { ...bookings[bookingIndex], ...body };
    await writeBookings(bookings);
    
    return NextResponse.json({
      success: true,
      data: bookings[bookingIndex]
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/bookings/[id] - Delete specific booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookings = await readBookings();
    const bookingIndex = bookings.findIndex((b: any) => b.id === params.id);
    
    if (bookingIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    const deletedBooking = bookings.splice(bookingIndex, 1)[0];
    await writeBookings(bookings);
    
    return NextResponse.json({
      success: true,
      data: deletedBooking
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
