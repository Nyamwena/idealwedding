import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

const defaultData = [
      {
        id: 'vendor_001',
        businessName: 'Elite Wedding Photography',
        logo: '/images/vendor-logo.jpg',
        description: 'Professional wedding photography with 10+ years of experience. Specializing in candid and artistic shots that capture the magic of your special day.',
        services: [
          {
            id: 'service_001',
            name: 'Full Day Wedding Photography',
            category: 'Photography',
            priceRange: { min: 2000, max: 3500 },
            description: 'Complete wedding day coverage from preparation to reception',
            isPremium: true,
            isFeatured: true,
          },
          {
            id: 'service_002',
            name: 'Engagement Session',
            category: 'Photography',
            priceRange: { min: 300, max: 500 },
            description: 'Romantic engagement photo session at your favorite location',
            isPremium: false,
            isFeatured: false,
          },
        ],
        serviceCategories: ['Photography', 'Videography'],
        locationsServed: [
          { city: 'New York', state: 'NY', radius: 50 },
          { city: 'Brooklyn', state: 'NY', radius: 30 },
        ],
        portfolio: [
          {
            id: 'portfolio_001',
            type: 'image',
            url: '/images/portfolio/wedding-1.jpg',
            title: 'Garden Wedding Ceremony',
            description: 'Beautiful outdoor ceremony with natural lighting',
            category: 'Photography',
            isPublic: true,
          },
        ],
        testimonials: [
          {
            id: 'testimonial_001',
            clientName: 'Sarah & John',
            clientEmail: 'sarah.john@email.com',
            rating: 5,
            review: 'Amazing photographer! Captured every moment perfectly. Highly recommended!',
            date: '2024-08-15T00:00:00Z',
            isVerified: true,
            isPublic: true,
          },
        ],
        availability: [
          {
            date: '2024-10-15',
            status: 'booked',
            eventType: 'Wedding',
            notes: 'Sarah & John wedding',
          },
          {
            date: '2024-10-20',
            status: 'available',
          },
        ],
        contactInfo: {
          email: 'contact@elitephoto.com',
          phone: '+1 (555) 123-4567',
          website: 'https://elitephoto.com',
          socialMedia: {
            facebook: 'https://facebook.com/elitephoto',
            instagram: 'https://instagram.com/elitephoto',
          },
        },
        businessInfo: {
          yearsInBusiness: 10,
          teamSize: 3,
          languages: ['English', 'Spanish'],
          certifications: ['Professional Photographer Certification'],
          insurance: true,
          licenseNumber: 'PHOTO-NY-2024-001',
        },
        settings: {
          autoAcceptLeads: false,
          leadNotificationEmail: true,
          leadNotificationSMS: true,
          profileVisibility: 'public',
          showPricing: true,
          allowDirectBooking: false,
        },
        stats: {
          profileViews: 1250,
          portfolioViews: 3400,
          inquiryCount: 45,
          responseRate: 95,
          averageResponseTime: 2.5,
        },
        isApproved: true,
        approvalStatus: 'approved',
        lastUpdated: '2024-09-24T10:30:00Z',
      }
    ];

async function readProfiles() {
  return readDataFile<any[]>('vendor-profiles.json', defaultData);
}

function getToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get('token')?.value || null;
}

function getVendorIdentity(request: NextRequest): { userId: string; email: string } | null {
  const token = getToken(request);
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as {
      userId?: string | number;
      email?: string;
      role?: string;
    };
    const role = String(payload.role || '').toUpperCase();
    if (!payload.userId || role !== 'VENDOR') return null;
    return { userId: String(payload.userId), email: String(payload.email || '') };
  } catch {
    return null;
  }
}

function createDefaultProfileForVendor(userId: string, email: string) {
  return {
    ...defaultData[0],
    id: `vendor_${userId}`,
    userId,
    businessName: defaultData[0].businessName || `Vendor ${userId}`,
    contactInfo: {
      ...defaultData[0].contactInfo,
      email: email || defaultData[0].contactInfo.email,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const vendor = getVendorIdentity(request);
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const data = await readProfiles();
    let profile = data.find((item: any) => String(item.userId || '') === vendor.userId);

    if (!profile) {
      profile = createDefaultProfileForVendor(vendor.userId, vendor.email);
      data.push(profile);
      await writeDataFile('vendor-profiles.json', data);
    }

    return NextResponse.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error reading vendor profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read vendor profile data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const vendor = getVendorIdentity(request);
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = await readProfiles();
    const index = data.findIndex((item: any) => String(item.userId || '') === vendor.userId);
    const current = index >= 0 ? data[index] : createDefaultProfileForVendor(vendor.userId, vendor.email);

    const updated = {
      ...current,
      ...body,
      id: current.id,
      userId: vendor.userId,
      lastUpdated: new Date().toISOString(),
    };

    if (index >= 0) {
      data[index] = updated;
    } else {
      data.push(updated);
    }

    await writeDataFile('vendor-profiles.json', data);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Vendor profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vendor profile' },
      { status: 500 }
    );
  }
}
