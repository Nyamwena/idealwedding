import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { createDefaultProfileForVendor } from '@/lib/vendorProfileDefaults';
import { findVendorProfile, findVendorProfileIndex } from '@/lib/vendorProfileScope';

export const dynamic = 'force-dynamic';

function bookingStatusColor(status: string) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending' || s === 'requested') return 'bg-yellow-500';
  if (s === 'completed' || s === 'done') return 'bg-green-500';
  if (s === 'cancelled' || s === 'canceled') return 'bg-gray-500';
  return 'bg-blue-500';
}

function mapBookingToEvent(b: any) {
  const eventDate = String(b.eventDate || b.weddingDate || b.createdAt || '').slice(0, 10);
  const startRaw = b.start || b.eventStart;
  const endRaw = b.end || b.eventEnd;
  let start = typeof startRaw === 'string' ? startRaw : `${eventDate}T10:00:00`;
  let end = typeof endRaw === 'string' ? endRaw : `${eventDate}T18:00:00`;
  if (start.length === 10) start = `${start}T10:00:00`;
  if (end.length === 10) end = `${end}T18:00:00`;
  const st = String(b.status || 'pending').toLowerCase();
  const calStatus =
    st === 'cancelled' || st === 'canceled'
      ? 'cancelled'
      : st === 'completed'
        ? 'completed'
        : st === 'confirmed'
          ? 'confirmed'
          : 'pending';
  return {
    id: `booking:${String(b.id)}`,
    title: `${b.serviceType || b.serviceName || 'Booking'} — ${b.coupleName || b.customerName || 'Client'}`,
    customerName: String(b.coupleName || b.customerName || ''),
    serviceName: String(b.serviceType || b.serviceName || 'Service'),
    start,
    end,
    status: calStatus as 'confirmed' | 'pending' | 'completed' | 'cancelled',
    location: String(b.location || ''),
    notes: String(b.notes || ''),
    color: bookingStatusColor(b.status),
  };
}

function mapProfileAvailability(a: any, idx: number) {
  const date = String(a.date || '').slice(0, 10);
  const notes = String(a.notes || '');
  let startTime = '09:00';
  let endTime = '17:00';
  const m = notes.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (m) {
    startTime = m[1];
    endTime = m[2];
  }
  return {
    id: `avail:${date}:${idx}`,
    date,
    startTime,
    endTime,
    isAvailable: String(a.status || 'available').toLowerCase() === 'available',
    isRecurring: false,
    recurringDays: [] as string[],
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const bookings = await readDataFile<any[]>('bookings.json', []);
    const scopedBookings = bookings.filter(
      (b) =>
        String(b.vendorUserId || '') === session.userId ||
        String(b.vendorId || '') === session.vendorId,
    );

    const profiles = await readDataFile<any[]>('vendor-profiles.json', []);
    const profile = findVendorProfile(profiles, session);
    const extraEvents = Array.isArray(profile?.calendarEvents) ? profile.calendarEvents : [];
    const availRows = Array.isArray(profile?.availability) ? profile.availability : [];

    const fromBookings = scopedBookings.map(mapBookingToEvent);
    const fromProfile = extraEvents.map((e: any) => ({
      id: String(e.id),
      title: String(e.title || 'Event'),
      customerName: String(e.customerName || ''),
      serviceName: String(e.serviceName || ''),
      start: String(e.start),
      end: String(e.end),
      status: (e.status || 'confirmed') as 'confirmed' | 'pending' | 'completed' | 'cancelled',
      location: String(e.location || ''),
      notes: String(e.notes || ''),
      color: String(e.color || 'bg-blue-500'),
    }));

    const events = [...fromBookings, ...fromProfile];
    const availability = availRows.map((a: any, i: number) => mapProfileAvailability(a, i));

    return NextResponse.json({ success: true, data: { events, availability } });
  } catch (e) {
    console.error('GET /api/vendor/calendar:', e);
    return NextResponse.json({ success: false, error: 'Failed to load calendar' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const body = await request.json();
    const type = String(body.type || '');

    const profiles = await readDataFile<any[]>('vendor-profiles.json', []);
    let idx = findVendorProfileIndex(profiles, session);

    if (idx < 0) {
      profiles.push(createDefaultProfileForVendor(session.userId, session.email));
      idx = profiles.length - 1;
    }

    const profile = profiles[idx];
    const now = new Date().toISOString();

    if (type === 'event') {
      const e = body.event || body;
      const row = {
        id: String(e.id || `cal_${Date.now()}`),
        title: String(e.title || 'Event'),
        customerName: String(e.customerName || ''),
        serviceName: String(e.serviceName || ''),
        start: String(e.start),
        end: String(e.end),
        status: String(e.status || 'confirmed'),
        location: String(e.location || ''),
        notes: String(e.notes || ''),
        color: String(e.color || 'bg-blue-500'),
      };
      const calendarEvents = Array.isArray(profile.calendarEvents) ? [...profile.calendarEvents] : [];
      calendarEvents.push(row);
      profiles[idx] = { ...profile, calendarEvents, lastUpdated: now };
      await writeDataFile('vendor-profiles.json', profiles);
      return NextResponse.json({ success: true, data: row }, { status: 201 });
    }

    if (type === 'availability') {
      const a = body.availability || body;
      const date = String(a.date || '').slice(0, 10);
      if (!date) {
        return NextResponse.json({ success: false, error: 'date is required' }, { status: 400 });
      }
      const startTime = String(a.startTime || '09:00');
      const endTime = String(a.endTime || '17:00');
      const availability = Array.isArray(profile.availability) ? [...profile.availability] : [];
      availability.push({
        date,
        status: 'available',
        notes: `Window: ${startTime}-${endTime}`,
      });
      profiles[idx] = { ...profile, availability, lastUpdated: now };
      await writeDataFile('vendor-profiles.json', profiles);
      const slot = mapProfileAvailability(availability[availability.length - 1], availability.length - 1);
      return NextResponse.json({ success: true, data: slot }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: 'type must be event or availability' }, { status: 400 });
  } catch (e) {
    console.error('POST /api/vendor/calendar:', e);
    return NextResponse.json({ success: false, error: 'Failed to save calendar item' }, { status: 500 });
  }
}
