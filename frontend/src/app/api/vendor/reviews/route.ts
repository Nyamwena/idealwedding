import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { findVendorProfile, findVendorProfileIndex } from '@/lib/vendorProfileScope';

export const dynamic = 'force-dynamic';

function testimonialToReview(t: any, businessName: string) {
  const text = String(t.review || '');
  const title =
    text.length > 52 ? `${text.slice(0, 52).trim()}…` : text || 'Client review';
  return {
    id: String(t.id),
    customerName: String(t.clientName || 'Client'),
    customerEmail: String(t.clientEmail || ''),
    serviceName: String(t.serviceName || businessName || 'Service'),
    rating: Number(t.rating || 0),
    title,
    comment: text,
    response: String(t.vendorResponse || ''),
    responseDate: String(t.vendorResponseDate || ''),
    isPublic: t.isPublic !== false,
    isVerified: Boolean(t.isVerified),
    createdAt: String(t.date || new Date().toISOString()),
    updatedAt: String(t.vendorResponseDate || t.date || new Date().toISOString()),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const profiles = await readDataFile<any[]>('vendor-profiles.json', []);
    const profile = findVendorProfile(profiles, session);
    const testimonials = Array.isArray(profile?.testimonials) ? profile.testimonials : [];
    const businessName = String(profile?.businessName || '');

    const data = testimonials
      .filter((t: any) => t.isPublic !== false)
      .map((t: any) => testimonialToReview(t, businessName));

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('GET /api/vendor/reviews:', e);
    return NextResponse.json({ success: false, error: 'Failed to load reviews' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const body = await request.json();
    const testimonialId = String(body.testimonialId || body.id || '');
    const vendorResponse = String(body.vendorResponse || body.response || '').trim();
    if (!testimonialId || !vendorResponse) {
      return NextResponse.json(
        { success: false, error: 'testimonialId and vendorResponse are required' },
        { status: 400 },
      );
    }

    const profiles = await readDataFile<any[]>('vendor-profiles.json', []);
    const idx = findVendorProfileIndex(profiles, session);
    if (idx < 0) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    const profile = profiles[idx];
    const list = Array.isArray(profile.testimonials) ? [...profile.testimonials] : [];
    const tIdx = list.findIndex((t: any) => String(t.id) === testimonialId);
    if (tIdx < 0) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    list[tIdx] = {
      ...list[tIdx],
      vendorResponse,
      vendorResponseDate: now.split('T')[0],
    };
    profiles[idx] = {
      ...profile,
      testimonials: list,
      lastUpdated: now,
    };
    await writeDataFile('vendor-profiles.json', profiles);

    const updated = testimonialToReview(list[tIdx], String(profile.businessName || ''));
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error('PATCH /api/vendor/reviews:', e);
    return NextResponse.json({ success: false, error: 'Failed to save response' }, { status: 500 });
  }
}
