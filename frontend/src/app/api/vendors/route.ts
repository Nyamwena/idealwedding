import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';

// Helper to read vendors from file
const getVendors = () => {
  return readDataFile<any[]>('vendors.json', []);
};

// Helper to read vendor profiles from file
const getVendorProfiles = () => {
  return readDataFile<any[]>('vendor-profiles.json', []);
};

// GET /api/vendors - Get all approved vendors with their profiles
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const [vendors, vendorProfiles] = await Promise.all([
      getVendors(),
      getVendorProfiles(),
    ]);

    // Filter only approved vendors
    let approvedVendors = vendors.filter((vendor: any) => vendor.status === 'approved');

    // Merge vendor data with profile data
    const vendorsWithProfiles = approvedVendors.map((vendor: any) => {
      const profile = vendorProfiles.find((p: any) => p.id === vendor.id);
      
      return {
        id: vendor.id,
        name: vendor.name,
        businessName: profile?.businessName || vendor.name,
        email: vendor.email,
        category: vendor.category,
        location: vendor.location,
        rating: vendor.rating,
        reviewCount: Math.floor(Math.random() * 100) + 20, // Mock review count
        description: profile?.description || vendor.description,
        isApproved: vendor.status === 'approved',
        isVisible: true,
        isFeatured: profile?.services?.some((s: any) => s.isFeatured) || false,
        phone: profile?.contactInfo?.phone || vendor.phone,
        website: profile?.contactInfo?.website || vendor.website,
        languages: profile?.businessInfo?.languages || ['English'],
        specialties: profile?.serviceCategories || [vendor.category],
        availability: ['Weekends', 'Evenings'], // Mock availability
        portfolio: profile?.portfolio?.filter((p: any) => p.isPublic) || [],
        services: profile?.services || [],
        contactInfo: profile?.contactInfo || {
          email: vendor.email,
          phone: vendor.phone,
          website: vendor.website
        },
        businessInfo: profile?.businessInfo || {
          yearsInBusiness: Math.floor(Math.random() * 15) + 1,
          teamSize: Math.floor(Math.random() * 10) + 1,
          languages: ['English'],
          certifications: [],
          insurance: true
        },
        stats: profile?.stats || {
          profileViews: Math.floor(Math.random() * 1000) + 100,
          portfolioViews: Math.floor(Math.random() * 2000) + 200,
          inquiryCount: Math.floor(Math.random() * 50) + 10,
          responseRate: Math.floor(Math.random() * 20) + 80,
          averageResponseTime: Math.random() * 5 + 1
        }
      };
    });

    // Apply filters
    let filteredVendors = vendorsWithProfiles;

    if (category) {
      filteredVendors = filteredVendors.filter((vendor: any) => 
        vendor.category.toLowerCase() === category.toLowerCase() ||
        vendor.specialties.some((s: string) => s.toLowerCase().includes(category.toLowerCase()))
      );
    }

    if (location) {
      filteredVendors = filteredVendors.filter((vendor: any) => 
        vendor.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredVendors = filteredVendors.filter((vendor: any) => 
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.businessName.toLowerCase().includes(searchLower) ||
        vendor.description.toLowerCase().includes(searchLower) ||
        vendor.category.toLowerCase().includes(searchLower) ||
        vendor.specialties.some((s: string) => s.toLowerCase().includes(searchLower))
      );
    }

    if (minPrice || maxPrice) {
      filteredVendors = filteredVendors.filter((vendor: any) => {
        const services = vendor.services || [];
        if (services.length === 0) return true;
        
        const minServicePrice = Math.min(...services.map((s: any) => s.priceRange?.min || 0));
        const maxServicePrice = Math.max(...services.map((s: any) => s.priceRange?.max || 0));
        
        const min = minPrice ? parseInt(minPrice) : 0;
        const max = maxPrice ? parseInt(maxPrice) : 100000;
        
        return minServicePrice <= max && maxServicePrice >= min;
      });
    }

    // Sort by featured first, then by rating
    filteredVendors.sort((a: any, b: any) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.rating - a.rating;
    });

    return NextResponse.json({
      success: true,
      data: filteredVendors,
      total: filteredVendors.length,
      filters: {
        category,
        location,
        search,
        minPrice,
        maxPrice
      }
    });
  } catch (error) {
    console.error('Error in GET /api/vendors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}
