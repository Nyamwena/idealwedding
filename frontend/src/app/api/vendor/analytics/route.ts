import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { findVendorBySessionEmail, leadBelongsToVendor } from '@/lib/vendorLeadScope';
import { findVendorProfile } from '@/lib/vendorProfileScope';

// Helper to read vendor leads from file
const getVendorLeads = () => {
  return readDataFile<any[]>('vendor-leads.json', []);
};

// Helper to read vendor profiles from file
const getVendorProfiles = () => {
  return readDataFile<any[]>('vendor-profiles.json', []);
};

// Helper to read bookings from file
const getBookings = () => {
  return readDataFile<any[]>('bookings.json', []);
};

// Helper to read payments from file
const getPayments = () => {
  return readDataFile<any[]>('payments.json', []);
};

export const dynamic = "force-dynamic";

// GET /api/vendor/analytics - Get vendor analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const session = await getVendorSession(request);
    const vendorUserId = session?.userId;
    if (!vendorUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const vendorId = session!.vendorId;

    // Get all data
    const [allLeads, allBookings, allPayments, vendorProfiles, vendors] = await Promise.all([
      getVendorLeads(),
      getBookings(),
      getPayments(),
      getVendorProfiles(),
      readDataFile<any[]>('vendors.json', []),
    ]);
    const catalogVendor = findVendorBySessionEmail(vendors, session!);

    // Filter data for this vendor
    const vendorLeads = allLeads.filter((lead: any) =>
      leadBelongsToVendor(lead, session!, catalogVendor),
    );
    const vendorBookings = allBookings.filter(
      (booking: any) =>
        String(booking.vendorUserId || '') === vendorUserId ||
        String(booking.vendorId || '') === vendorId,
    );
    const vendorPayments = allPayments.filter(
      (payment: any) =>
        String(payment.vendorUserId || '') === vendorUserId ||
        String(payment.vendorId || '') === vendorId,
    );

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Filter data by date range
    const filteredLeads = vendorLeads.filter((lead: any) => 
      new Date(lead.timestamp) >= startDate
    );
    const filteredBookings = vendorBookings.filter((booking: any) => 
      new Date(booking.createdAt) >= startDate
    );
    const filteredPayments = vendorPayments.filter((payment: any) => 
      new Date(payment.createdAt) >= startDate
    );

    // Calculate basic metrics
    const totalLeads = filteredLeads.length;
    const totalBookings = filteredBookings.length;
    const conversionRate = totalLeads > 0 ? (totalBookings / totalLeads) * 100 : 0;
    
    // Calculate revenue from completed payments
    const totalRevenue = filteredPayments
      .filter((payment: any) => payment.status === 'completed')
      .reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
    
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate response time (mock calculation)
    const responseTime = 2.5; // hours - in real app, calculate from lead timestamps

    // Calculate customer satisfaction (mock calculation)
    const customerSatisfaction = 4.8; // in real app, calculate from reviews

    // Calculate repeat customers
    const repeatCustomers = filteredBookings
      .map((booking: any) => booking.customerId)
      .filter((id: string, index: number, arr: string[]) => arr.indexOf(id) !== index)
      .length;

    // Calculate monthly growth (compare with previous period)
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousLeads = vendorLeads.filter((lead: any) => 
      new Date(lead.timestamp) >= previousStartDate && new Date(lead.timestamp) < startDate
    ).length;
    const previousBookings = vendorBookings.filter((booking: any) => 
      new Date(booking.createdAt) >= previousStartDate && new Date(booking.createdAt) < startDate
    ).length;
    const previousRevenue = vendorPayments
      .filter((payment: any) => 
        new Date(payment.createdAt) >= previousStartDate && 
        new Date(payment.createdAt) < startDate &&
        payment.status === 'completed'
      )
      .reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

    const leadsGrowth = previousLeads > 0 ? ((totalLeads - previousLeads) / previousLeads) * 100 : 0;
    const bookingsGrowth = previousBookings > 0 ? ((totalBookings - previousBookings) / previousBookings) * 100 : 0;
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Calculate category performance
    const vendorProfile = findVendorProfile(vendorProfiles, session!);
    const categoryPerformance = vendorProfile?.services?.map((service: any) => {
      const serviceLeads = filteredLeads.filter((lead: any) => 
        lead.serviceCategory === service.category
      ).length;
      const serviceBookings = filteredBookings.filter((booking: any) => 
        booking.serviceCategory === service.category
      ).length;
      const serviceRevenue = filteredPayments
        .filter((payment: any) => 
          payment.serviceCategory === service.category && 
          payment.status === 'completed'
        )
        .reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
      
      return {
        category: service.category,
        leads: serviceLeads,
        bookings: serviceBookings,
        revenue: serviceRevenue,
        conversionRate: serviceLeads > 0 ? (serviceBookings / serviceLeads) * 100 : 0,
      };
    }) || [];

    // Generate monthly trends for the last 12 months
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthLeads = vendorLeads.filter((lead: any) => {
        const leadDate = new Date(lead.timestamp);
        return leadDate >= monthDate && leadDate < nextMonthDate;
      }).length;
      
      const monthBookings = vendorBookings.filter((booking: any) => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= monthDate && bookingDate < nextMonthDate;
      }).length;
      
      const monthRevenue = vendorPayments
        .filter((payment: any) => {
          const paymentDate = new Date(payment.createdAt);
          return paymentDate >= monthDate && 
                 paymentDate < nextMonthDate && 
                 payment.status === 'completed';
        })
        .reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

      monthlyTrends.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        leads: monthLeads,
        bookings: monthBookings,
        revenue: monthRevenue,
      });
    }

    const analyticsData = {
      totalLeads,
      totalBookings,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalRevenue,
      averageBookingValue: Math.round(averageBookingValue * 100) / 100,
      responseTime,
      customerSatisfaction,
      repeatCustomers,
      monthlyGrowth: {
        leads: Math.round(leadsGrowth * 10) / 10,
        bookings: Math.round(bookingsGrowth * 10) / 10,
        revenue: Math.round(revenueGrowth * 10) / 10,
      },
      categoryPerformance,
      monthlyTrends,
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
      period,
      vendorId,
    });
  } catch (error) {
    console.error('Error in GET /api/vendor/analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

