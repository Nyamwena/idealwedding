'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface AnalyticsData {
  totalUsers: number;
  activeVendors: number;
  totalQuotes: number;
  totalBookings: number;
  totalPayments: number;
  totalRevenue: number;
  pendingQuotes: number;
  completedBookings: number;
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    type: string;
  }>;
  topVendors: Array<{
    id: string;
    name: string;
    category: string;
    rating: number;
    totalBookings: number;
  }>;
  popularServices: Array<{
    service: string;
    count: number;
    percentage: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ( !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from all modules
      const [usersResponse, vendorsResponse, quotesResponse, bookingsResponse, paymentsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/vendors'),
        fetch('/api/admin/quotes'),
        fetch('/api/admin/bookings'),
        fetch('/api/admin/payments')
      ]);

      const [usersResult, vendorsResult, quotesResult, bookingsResult, paymentsResult] = await Promise.all([
        usersResponse.json(),
        vendorsResponse.json(),
        quotesResponse.json(),
        bookingsResponse.json(),
        paymentsResponse.json()
      ]);

      // Calculate analytics
      const users = usersResult.data || [];
      const vendors = vendorsResult.data || [];
      const quotes = quotesResult.data || [];
      const bookings = bookingsResult.data || [];
      const payments = paymentsResult.data || [];

      // Calculate revenue from payments
      const totalRevenue = payments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      // Get active vendors (approved vendors)
      const activeVendors = vendors.filter((v: any) => v.status === 'approved').length;

      // Get pending quotes
      const pendingQuotes = quotes.filter((q: any) => q.status === 'pending').length;

      // Get completed bookings
      const completedBookings = bookings.filter((b: any) => b.status === 'completed').length;

      // Calculate popular services from vendor categories
      const serviceCounts: { [key: string]: number } = {};
      vendors.forEach((vendor: any) => {
        const category = vendor.category || 'Other';
        serviceCounts[category] = (serviceCounts[category] || 0) + 1;
      });

      const totalServices = Object.values(serviceCounts).reduce((sum, count) => sum + count, 0);
      const popularServices = Object.entries(serviceCounts)
        .map(([service, count]) => ({
          service,
          count,
          percentage: totalServices > 0 ? Math.round((count / totalServices) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get top vendors by rating
      const topVendors = vendors
        .filter((v: any) => v.rating && v.rating > 0)
        .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)
        .map((v: any) => ({
          id: v.id,
          name: v.businessName || v.name || 'Unknown Vendor',
          category: v.category || 'Other',
          rating: v.rating || 0,
          totalBookings: Math.floor(Math.random() * 50) + 1 // Mock booking count
        }));

      // Generate recent activity from all modules
      const recentActivity = [
        ...users.slice(-2).map((u: any) => ({
          id: `user-${u.id}`,
          action: `New user registered: ${u.name || u.email}`,
          timestamp: new Date(u.createdAt || Date.now()).toLocaleString(),
          type: 'user'
        })),
        ...vendors.slice(-2).map((v: any) => ({
          id: `vendor-${v.id}`,
          action: `Vendor ${v.status === 'approved' ? 'approved' : 'pending'}: ${v.businessName || v.name}`,
          timestamp: new Date(v.createdAt || Date.now()).toLocaleString(),
          type: 'vendor'
        })),
        ...quotes.slice(-2).map((q: any) => ({
          id: `quote-${q.id}`,
          action: `Quote ${q.status}: ${q.serviceCategory || 'Service'}`,
          timestamp: new Date(q.createdAt || Date.now()).toLocaleString(),
          type: 'quote'
        })),
        ...bookings.slice(-2).map((b: any) => ({
          id: `booking-${b.id}`,
          action: `Booking ${b.status}: ${b.eventType || 'Event'}`,
          timestamp: new Date(b.createdAt || Date.now()).toLocaleString(),
          type: 'booking'
        }))
      ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

      const analyticsData: AnalyticsData = {
        totalUsers: users.length,
        activeVendors,
        totalQuotes: quotes.length,
        totalBookings: bookings.length,
        totalPayments: payments.length,
        totalRevenue,
        pendingQuotes,
        completedBookings,
        recentActivity,
        topVendors,
        popularServices
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if ( loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect to dashboard
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Header />
        <main className="container-modern py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={loadAnalytics} className="btn-primary">
              🔄 Retry
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time platform analytics and reports</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadAnalytics}
              disabled={loading}
              className={`btn-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <Link href="/admin" className="btn-outline">
              ← Back to Admin Dashboard
            </Link>
          </div>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-blue-600">Registered users</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.activeVendors.toLocaleString()}</p>
                    <p className="text-sm text-green-600">Approved vendors</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalQuotes.toLocaleString()}</p>
                    <p className="text-sm text-yellow-600">{analytics.pendingQuotes} pending</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-purple-600">From {analytics.totalPayments} payments</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* User Growth Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📈</div>
                    <p className="text-gray-600">Chart visualization would go here</p>
                    <p className="text-sm text-gray-500">Integration with charting library needed</p>
                  </div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💹</div>
                    <p className="text-gray-600">Revenue chart would go here</p>
                    <p className="text-sm text-gray-500">Integration with charting library needed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Top Vendors */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Vendors</h3>
                {analytics.topVendors.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topVendors.map((vendor, index) => (
                      <div key={vendor.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : 'bg-orange-100'
                          }`}>
                            <span className={`${
                              index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'
                            }`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{vendor.name}</p>
                            <p className="text-sm text-gray-600">{vendor.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">⭐ {vendor.rating}</p>
                          <p className="text-sm text-green-600">{vendor.totalBookings} bookings</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🏢</div>
                    <p className="text-gray-600">No vendors with ratings yet</p>
                  </div>
                )}
              </div>

              {/* Popular Services */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Services</h3>
                {analytics.popularServices.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.popularServices.map((service, index) => {
                      const getServiceIcon = (serviceName: string) => {
                        const name = serviceName.toLowerCase();
                        if (name.includes('photo')) return '📸';
                        if (name.includes('flower')) return '🌸';
                        if (name.includes('cater') || name.includes('food')) return '🍽️';
                        if (name.includes('music') || name.includes('dj')) return '🎵';
                        if (name.includes('venue') || name.includes('location')) return '🏛️';
                        if (name.includes('dress') || name.includes('fashion')) return '👗';
                        if (name.includes('cake') || name.includes('dessert')) return '🍰';
                        return '🎯';
                      };
                      
                      return (
                        <div key={service.service} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getServiceIcon(service.service)}</span>
                            <div>
                              <p className="font-medium text-gray-900">{service.service}</p>
                              <p className="text-sm text-gray-600">{service.count} vendors</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{service.percentage}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎯</div>
                    <p className="text-gray-600">No services data available</p>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                {analytics.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.recentActivity.map((activity) => {
                      const getActivityColor = (type: string) => {
                        switch (type) {
                          case 'user': return 'bg-blue-500';
                          case 'vendor': return 'bg-green-500';
                          case 'quote': return 'bg-yellow-500';
                          case 'booking': return 'bg-purple-500';
                          case 'payment': return 'bg-indigo-500';
                          default: return 'bg-gray-500';
                        }
                      };
                      
                      return (
                        <div key={activity.id} className="flex items-start">
                          <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${getActivityColor(activity.type)}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                            <p className="text-xs text-gray-600">{activity.timestamp}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-gray-600">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
