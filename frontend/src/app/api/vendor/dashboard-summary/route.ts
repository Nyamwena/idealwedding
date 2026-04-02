import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { leadBelongsToVendor } from '@/lib/vendorLeadScope';
import { findVendorProfile } from '@/lib/vendorProfileScope';

export const dynamic = 'force-dynamic';

function matchesVendor(r: any, userId: string, vendorId: string) {
  return String(r.vendorUserId || '') === userId || String(r.vendorId || '') === vendorId;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }
    const { userId, vendorId } = session;

    const [bookings, payments, leads, quotes, profiles] = await Promise.all([
      readDataFile<any[]>('bookings.json', []),
      readDataFile<any[]>('payments.json', []),
      readDataFile<any[]>('vendor-leads.json', []),
      readDataFile<any[]>('quotes.json', []),
      readDataFile<any[]>('vendor-profiles.json', []),
    ]);

    const vBookings = bookings.filter((b) => matchesVendor(b, userId, vendorId));
    const vPayments = payments.filter((p) => matchesVendor(p, userId, vendorId));
    const vLeads = leads.filter((l) => leadBelongsToVendor(l, session));
    const vQuotes = quotes.filter((q) => matchesVendor(q, userId, vendorId));

    const profile = findVendorProfile(profiles, session);
    const testimonials = Array.isArray(profile?.testimonials) ? profile.testimonials : [];
    const publicReviews = testimonials.filter((t: any) => t.isPublic !== false);
    const totalReviews = publicReviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round(
            (publicReviews.reduce((s: number, t: any) => s + Number(t.rating || 0), 0) / totalReviews) * 10,
          ) / 10
        : 0;

    const totalBookings = vBookings.length;
    const pendingBookings = vBookings.filter((b: any) =>
      ['pending', 'PENDING', 'requested'].includes(String(b.status || '')),
    ).length;
    const completedBookings = vBookings.filter((b: any) =>
      ['completed', 'COMPLETED', 'done'].includes(String(b.status || '')),
    ).length;

    const completedPayments = vPayments.filter((p: any) =>
      ['completed', 'COMPLETED', 'paid'].includes(String(p.status || '')),
    );
    const totalEarnings = completedPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEarnings = completedPayments
      .filter((p: any) => new Date(p.createdAt || p.date || 0) >= monthStart)
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = monthStart;
    const bookingsLastMonth = vBookings.filter((b: any) => {
      const d = new Date(b.createdAt || 0);
      return d >= prevMonthStart && d < prevMonthEnd;
    }).length;
    const bookingsThisMonth = vBookings.filter((b: any) => {
      const d = new Date(b.createdAt || 0);
      return d >= monthStart;
    }).length;
    const bookingGrowthPct =
      bookingsLastMonth > 0
        ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 1000) / 10
        : bookingsThisMonth > 0
          ? 100
          : 0;

    const earningsLastMonth = completedPayments
      .filter((p: any) => {
        const d = new Date(p.createdAt || p.date || 0);
        return d >= prevMonthStart && d < prevMonthEnd;
      })
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const earningsGrowthPct =
      earningsLastMonth > 0
        ? Math.round(((monthlyEarnings - earningsLastMonth) / earningsLastMonth) * 1000) / 10
        : monthlyEarnings > 0
          ? 100
          : 0;

    const responseRate =
      profile?.stats?.responseRate != null ? Number(profile.stats.responseRate) : 0;

    type Activity = {
      id: string;
      type: 'booking' | 'quote' | 'review' | 'payment' | 'lead';
      title: string;
      description: string;
      timestamp: string;
      status: 'pending' | 'completed' | 'cancelled';
    };

    const recentActivity: Activity[] = [];

    for (const b of vBookings) {
      recentActivity.push({
        id: `booking-${b.id}`,
        type: 'booking',
        title: 'Booking',
        description: `${b.coupleName || b.customerName || 'Couple'} — ${b.serviceType || b.serviceCategory || 'Service'}`,
        timestamp: b.updatedAt || b.createdAt || new Date().toISOString(),
        status:
          String(b.status).toLowerCase() === 'cancelled'
            ? 'cancelled'
            : String(b.status).toLowerCase() === 'completed'
              ? 'completed'
              : 'pending',
      });
    }
    for (const q of vQuotes) {
      recentActivity.push({
        id: `quote-${q.id}`,
        type: 'quote',
        title: 'Quote',
        description: `${q.coupleName || 'Couple'} — $${Number(q.amount || 0)}`,
        timestamp: q.createdAt || new Date().toISOString(),
        status: String(q.status || '').toLowerCase() === 'accepted' ? 'completed' : 'pending',
      });
    }
    for (const p of vPayments.slice(0, 20)) {
      recentActivity.push({
        id: `payment-${p.id}`,
        type: 'payment',
        title: 'Payment',
        description: `$${Number(p.amount || 0)} — ${p.description || p.status || ''}`,
        timestamp: p.createdAt || new Date().toISOString(),
        status: String(p.status || '').toLowerCase() === 'completed' ? 'completed' : 'pending',
      });
    }
    for (const l of vLeads.slice(0, 15)) {
      recentActivity.push({
        id: `lead-${l.id}`,
        type: 'lead',
        title: 'Lead',
        description: `${l.coupleName || 'Couple'} — ${l.serviceCategory || ''}`,
        timestamp: l.timestamp || new Date().toISOString(),
        status: 'pending',
      });
    }

    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBookings,
          pendingBookings,
          completedBookings,
          totalEarnings,
          monthlyEarnings,
          averageRating,
          totalReviews,
          responseRate,
        },
        meta: {
          bookingGrowthPct,
          earningsGrowthPct,
          totalLeads: vLeads.length,
          quotesCount: vQuotes.length,
        },
        recentActivity: recentActivity.slice(0, 12),
      },
      vendorId,
    });
  } catch (e) {
    console.error('GET /api/vendor/dashboard-summary:', e);
    return NextResponse.json({ success: false, error: 'Failed to load dashboard' }, { status: 500 });
  }
}
