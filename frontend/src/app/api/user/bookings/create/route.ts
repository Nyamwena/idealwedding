import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getAuthenticatedUserFromRequest } from '@/lib/auth';

// Helper to read bookings from file
const getBookings = () => {
  return readDataFile<any[]>('bookings.json', []);
};

// Helper to write bookings to file
const saveBookings = (bookings: any[]) => {
  return writeDataFile('bookings.json', bookings);
};

// POST /api/user/bookings/create - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vendorId,
      serviceCategory,
      serviceName,
      weddingDate,
      location,
      amount,
      notes,
      customerName,
      customerEmail
    } = body;

    // Validate required fields
    if (!vendorId || !serviceCategory || !serviceName || !weddingDate || !location || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required booking fields' },
        { status: 400 }
      );
    }

    const customerId = String(user.id);
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    const resolvedName = customerName?.trim() || displayName || user.email.split('@')[0] || 'Couple';
    const resolvedEmail = (customerEmail?.trim() || user.email).toLowerCase();

    const vendorUserIdMatch = typeof vendorId === 'string' ? vendorId.match(/^vendor_(.+)$/) : null;
    const vendorUserId = vendorUserIdMatch ? vendorUserIdMatch[1] : undefined;

    // Create new booking
    const newBooking = {
      id: `booking_${Date.now()}`,
      vendorId,
      vendorUserId,
      customerId,
      customerName: resolvedName,
      customerEmail: resolvedEmail,
      serviceCategory,
      serviceName,
      weddingDate,
      location,
      amount: parseFloat(amount),
      status: 'pending',
      depositPaid: false,
      depositAmount: Math.round(parseFloat(amount) * 0.2), // 20% deposit
      finalPaymentDue: new Date(new Date(weddingDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days before wedding
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to file
    let allBookings = await getBookings();
    allBookings.push(newBooking);
    await saveBookings(allBookings);

    return NextResponse.json({
      success: true,
      data: newBooking,
      message: 'Booking created successfully! The vendor will be notified.',
    });
  } catch (error) {
    console.error('Error in POST /api/user/bookings/create:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

