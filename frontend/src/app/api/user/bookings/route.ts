import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';

// Helper to read bookings from file
const getBookings = () => {
  return readDataFile<any[]>('bookings.json', []);
};

// GET /api/user/bookings - Get all bookings for a user
export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get the user ID from the authenticated user
    const userId = 'customer_001'; // Mock user ID - in real app, get from auth

    const allBookings = await getBookings();
    
    // Filter bookings for this user and add vendor names
    const userBookings = allBookings
      .filter((booking: any) => booking.customerId === userId)
      .map((booking: any) => ({
        ...booking,
        vendorName: getVendorName(booking.vendorId), // Add vendor name
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

// Helper function to get vendor name (mock implementation)
const getVendorName = (vendorId: string) => {
  // In a real app, you'd fetch this from the vendors database
  const vendorNames: { [key: string]: string } = {
    'vendor_001': 'Perfect Moments Photography',
    'vendor_002': 'Elegant Wedding Planning',
    'vendor_003': 'Dream Wedding Videos',
    'vendor_004': 'Garden Party Catering',
    'vendor_005': 'Blissful Floral Designs',
  };
  
  return vendorNames[vendorId] || 'Unknown Vendor';
};

