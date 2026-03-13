import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read bookings from file
function readBookings() {
  return readDataFile<any[]>('bookings.json', [
    {
      id: 'b1',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.johnson@email.com',
      vendorName: 'Elegant Flowers',
      serviceType: 'Florist',
      eventDate: '2024-10-15',
      status: 'confirmed',
      totalAmount: 2500,
      bookingDate: '2024-09-20',
      notes: 'Roses and peonies for wedding ceremony'
    }
  ]);
}

// Helper function to write bookings to file
function writeBookings(bookings: any[]) {
  return writeDataFile('bookings.json', bookings);
}

// GET /api/admin/bookings - Get all bookings
export async function GET() {
  try {
    const bookings = await readBookings();
    return NextResponse.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate new ID
    const bookings = await readBookings();
    const newId = `b${Date.now()}`;
    
    const newBooking = {
      id: newId,
      ...body,
      bookingDate: new Date().toISOString().split('T')[0]
    };
    
    bookings.push(newBooking);
    await writeBookings(bookings);
    
    return NextResponse.json({
      success: true,
      data: newBooking
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
