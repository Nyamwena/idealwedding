import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

type WeddingDetails = {
  userId: string;
  weddingDate?: string;
  venue?: string;
  city?: string;
  guestCount?: number;
  budget?: number;
  notes?: string;
  updatedAt: string;
};

const getWeddingDetails = () =>
  readDataFile<WeddingDetails[]>('wedding-details.json', []);

const saveWeddingDetails = (data: WeddingDetails[]) =>
  writeDataFile('wedding-details.json', data);

function getToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get('token')?.value || null;
}

function getUserIdFromToken(request: NextRequest): string | null {
  const token = getToken(request);
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as { userId?: string | number };
    return payload.userId ? String(payload.userId) : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const all = await getWeddingDetails();
    const details = all.find((item) => item.userId === userId) || null;
    return NextResponse.json({ success: true, data: details });
  } catch (error) {
    console.error('Error in GET /api/user/wedding-details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load wedding details' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const all = await getWeddingDetails();
    const index = all.findIndex((item) => item.userId === userId);

    const record: WeddingDetails = {
      userId,
      weddingDate: body.weddingDate,
      venue: body.venue,
      city: body.city,
      guestCount:
        typeof body.guestCount === 'number' ? body.guestCount : undefined,
      budget: typeof body.budget === 'number' ? body.budget : undefined,
      notes: body.notes,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      all[index] = record;
    } else {
      all.push(record);
    }

    await saveWeddingDetails(all);
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error in POST /api/user/wedding-details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save wedding details' },
      { status: 500 },
    );
  }
}
