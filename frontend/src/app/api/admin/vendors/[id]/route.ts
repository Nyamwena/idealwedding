import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import jwt from 'jsonwebtoken';

// Read vendors from file
const getVendors = () => {
  return readDataFile<any[]>('vendors.json', []);
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

// GET /api/admin/vendors/[id] - Get specific vendor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const vendors = await getVendors();
    const vendor = vendors.find(v => v.id === params.id);
    
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/vendors/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/vendors/[id] - Update specific vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      description,
      status,
      subscription
    } = body;

    // Validate required fields
    if (!name || !email || !category || !location) {
      return NextResponse.json(
        { success: false, error: 'Name, email, category, and location are required' },
        { status: 400 }
      );
    }

    const vendors = await getVendors();
    const vendorIndex = vendors.findIndex(v => v.id === params.id);
    
    if (vendorIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Check if email is already used by another vendor
    const existingVendor = vendors.find(v => v.email === email && v.id !== params.id);
    if (existingVendor) {
      return NextResponse.json(
        { success: false, error: 'Email address is already in use by another vendor' },
        { status: 409 }
      );
    }

    // Update vendor
    vendors[vendorIndex] = {
      ...vendors[vendorIndex],
      name,
      email,
      category,
      location,
      phone: phone || vendors[vendorIndex].phone,
      website: website || vendors[vendorIndex].website,
      description: description || vendors[vendorIndex].description,
      status: status || vendors[vendorIndex].status,
      subscription: subscription || vendors[vendorIndex].subscription,
    };

    // Save to file
    await saveVendors(vendors);

    return NextResponse.json({
      success: true,
      data: vendors[vendorIndex],
      message: 'Vendor updated successfully',
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/vendors/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/vendors/[id] - Delete specific vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const vendors = await getVendors();
    const vendorIndex = vendors.findIndex(v => v.id === params.id);
    
    if (vendorIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Remove vendor from array
    const deletedVendor = vendors.splice(vendorIndex, 1)[0];

    // Save to file
    await saveVendors(vendors);

    return NextResponse.json({
      success: true,
      data: deletedVendor,
      message: 'Vendor deleted successfully',
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/vendors/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}
