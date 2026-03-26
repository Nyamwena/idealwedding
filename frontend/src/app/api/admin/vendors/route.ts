import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import jwt from 'jsonwebtoken';

// Read vendors from file
const getVendors = () => {
  return readDataFile<any[]>('vendors.json', []);
};

const getCreditWallets = () => {
  return readDataFile<any[]>('vendor-credit-wallets.json', []);
};

// Write vendors to file
const saveVendors = (vendors: any[]) => {
  return writeDataFile('vendors.json', vendors);
};

function getAuthToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return request.cookies.get('token')?.value || null;
}

function requireAdmin(request: NextRequest): NextResponse | null {
  const token = getAuthToken(request);
  if (!token || !process.env.JWT_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as { role?: string };
    const role = String(payload.role || '').toUpperCase();
    if (role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}

// GET /api/admin/vendors - Get all vendors
export async function GET(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const [vendors, wallets] = await Promise.all([getVendors(), getCreditWallets()]);
    const merged = vendors.map((vendor) => {
      const wallet = wallets.find(
        (w) =>
          String(w.vendorId || '') === String(vendor.id || '') ||
          String(w.email || '').toLowerCase() === String(vendor.email || '').toLowerCase(),
      );
      if (!wallet) return vendor;
      return {
        ...vendor,
        credits: Number(wallet.currentCredits || vendor.credits || 0),
      };
    });
    
    return NextResponse.json({
      success: true,
      data: merged,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/vendors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST /api/admin/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { 
      name, 
      email, 
      category, 
      location, 
      phone, 
      website, 
      description 
    } = body;

    // Validate required fields
    if (!name || !email || !category || !location) {
      return NextResponse.json(
        { success: false, error: 'Name, email, category, and location are required' },
        { status: 400 }
      );
    }

    const vendors = await getVendors();

    // Check if email is already used
    const existingVendor = vendors.find(v => v.email === email);
    if (existingVendor) {
      return NextResponse.json(
        { success: false, error: 'A vendor with this email already exists' },
        { status: 409 }
      );
    }

    // Create new vendor
    const newVendor = {
      id: (vendors.length + 1).toString(),
      name,
      email,
      category,
      status: 'pending',
      location,
      rating: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: 'Never',
      credits: 0,
      leadsGenerated: 0,
      quotesSent: 0,
      bookingsCompleted: 0,
      revenue: 0,
      performance: 'average' as const,
      subscription: 'basic' as const,
      phone: phone || '',
      website: website || '',
      description: description || '',
    };

    vendors.push(newVendor);

    // Save to file
    await saveVendors(vendors);

    return NextResponse.json({
      success: true,
      data: newVendor,
      message: 'Vendor created successfully',
    });

  } catch (error) {
    console.error('Error in POST /api/admin/vendors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
