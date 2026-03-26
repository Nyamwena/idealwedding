import { NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';

const getVendors = () => readDataFile<any[]>('vendors.json', []);
const getVendorProfiles = () =>
  readDataFile<any[]>('vendor-profiles.json', []);

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [vendors, vendorProfiles] = await Promise.all([
      getVendors(),
      getVendorProfiles(),
    ]);

    const vendor = vendors.find((v: any) => String(v.id) === params.id);
    if (!vendor || vendor.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const profile = vendorProfiles.find((p: any) => String(p.id) === params.id);
    const data = {
      id: String(vendor.id),
      businessName: profile?.businessName || vendor.name,
      description: profile?.description || vendor.description || '',
      logo: profile?.logo || '',
      services: profile?.services || [],
      portfolio: profile?.portfolio || [],
      contactInfo: profile?.contactInfo || {
        email: vendor.email,
        phone: vendor.phone || '',
        website: vendor.website || '',
      },
      rating: vendor.rating || 0,
      reviewCount: profile?.stats?.reviewCount || 0,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /api/vendors/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor details' },
      { status: 500 }
    );
  }
}
