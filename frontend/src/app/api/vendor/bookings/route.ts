import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { readDataFile } from '@/lib/dataFileStore';

function getToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get('token')?.value || null;
}

function getVendorUserId(request: NextRequest): string | null {
  const token = getToken(request);
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as {
      userId?: string | number;
      role?: string;
    };
    const role = String(payload.role || '').toUpperCase();
    if (!payload.userId || role !== 'VENDOR') return null;
    return String(payload.userId);
  } catch {
    return null;
  }
}

function readBookings() {
  return readDataFile<any[]>('bookings.json', []);
}

export async function GET(request: NextRequest) {
  try {
    const vendorUserId = getVendorUserId(request);
    if (!vendorUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const vendorId = `vendor_${vendorUserId}`;
    const bookings = await readBookings();
    const scoped = bookings.filter(
      (b: any) =>
        String(b.vendorUserId || '') === vendorUserId ||
        String(b.vendorId || '') === vendorId
    );

    return NextResponse.json({ success: true, data: scoped });
  } catch (error) {
    console.error('Error reading vendor bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read vendor bookings' },
      { status: 500 }
    );
  }
}
