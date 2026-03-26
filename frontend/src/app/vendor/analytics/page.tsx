'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

interface AnalyticsData {
  totalLeads: number;
  totalBookings: number;
  conversionRate: number;
  totalRevenue: number;
  averageBookingValue: number;
  responseTime: number;
  customerSatisfaction: number;
  repeatCustomers: number;
  monthlyGrowth: {
    leads: number;
    bookings: number;
    revenue: number;
  };
  categoryPerformance: {
    category: string;
    leads: number;
    bookings: number;
    revenue: number;
    conversionRate: number;
  }[];
  monthlyTrends: {
    month: string;
    leads: number;
    bookings: number;
    revenue: number;
  }[];
}

export default function VendorAnalyticsPage() {
  const { user,  isVendor } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');



  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vendor/analytics?period=${selectedPeriod}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }

      setAnalytics(result.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };



  if (!isVendor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[
          { label: 'Vendor Dashboard', href: '/vendor' },
          { label: 'Analytics & Reports', href: '/vendor/analytics' }
        ]} />
        
        <VendorTopMenu />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Analytics & <span className="gradient-text">Reports</span></h1>
            <p className="text-gray-600 mt-2">Track your business performance and growth metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Link href="/vendor">
              <button className="btn-outline btn-md hover-lift">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading analytics...</span>
          </div>
        ) : analytics ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalLeads}</p>
                    <p className="text-sm text-green-600">+{analytics.monthlyGrowth.leads}% from last month</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <span className="text-blue-600 text-xl">📋</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalBookings}</p>
                    <p className="text-sm text-green-600">+{analytics.monthlyGrowth.bookings}% from last month</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <span className="text-green-600 text-xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.conversionRate}%</p>
                    <p className="text-sm text-gray-600">Lead to booking</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <span className="text-purple-600 text-xl">📈</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">${analytics.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+{analytics.monthlyGrowth.revenue}% from last month</p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-3">
                    <span className="text-yellow-600 text-xl">💰</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Booking Value</span>
                    <span className="font-semibold">${analytics.averageBookingValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-semibold">{analytics.responseTime} hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Customer Satisfaction</span>
                    <span className="font-semibold">{analytics.customerSatisfaction}/5.0 ⭐</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Repeat Customers</span>
                    <span className="font-semibold">{analytics.repeatCustomers}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                <div className="space-y-4">
                  {analytics.categoryPerformance.map((category, index) => (
                    <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-900">{category.category}</span>
                        <span className="text-sm text-gray-600">{category.conversionRate}% conversion</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{category.leads} leads → {category.bookings} bookings</span>
                        <span>${category.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Trends Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Trends</h3>
              <div className="overflow-x-auto">
                <div className="flex space-x-4 min-w-max">
                  {analytics.monthlyTrends.map((month, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div className="text-sm text-gray-600">{month.month}</div>
                      <div className="flex flex-col space-y-1">
                        <div className="w-8 bg-blue-200 rounded" style={{ height: `${(month.leads / 50) * 100}px` }}></div>
                        <div className="w-8 bg-green-200 rounded" style={{ height: `${(month.bookings / 20) * 100}px` }}></div>
                        <div className="w-8 bg-purple-200 rounded" style={{ height: `${(month.revenue / 15000) * 100}px` }}></div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        <div>{month.leads}L</div>
                        <div>{month.bookings}B</div>
                        <div>${(month.revenue / 1000).toFixed(1)}k</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-200 rounded"></div>
                  <span className="text-gray-600">Leads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-200 rounded"></div>
                  <span className="text-gray-600">Bookings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-200 rounded"></div>
                  <span className="text-gray-600">Revenue</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/vendor/leads">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">💬</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Manage Leads</h3>
                  <p className="text-gray-600 text-sm">View and manage your leads</p>
                </div>
              </Link>

              <Link href="/vendor/bookings">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">📅</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">View Bookings</h3>
                  <p className="text-gray-600 text-sm">Check your booking schedule</p>
                </div>
              </Link>

              <Link href="/vendor/profile">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">👤</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Update Profile</h3>
                  <p className="text-gray-600 text-sm">Improve your profile visibility</p>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
            <p className="text-gray-600">Start receiving leads to see your analytics here.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}