'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useVendorCredits } from '@/hooks/useVendorCredits';
import { useVendorLeads } from '@/hooks/useVendorLeads';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import { useVendorNotifications } from '@/hooks/useVendorNotifications';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { VendorNotificationBell } from '@/components/vendor/VendorNotificationBell';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

interface VendorStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'quote' | 'review' | 'payment' | 'lead';
  title: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'cancelled';
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

export default function VendorDashboard() {
  const { user,  isVendor, logout } = useAuth();
  const { creditData, loading: creditsLoading, getCreditStatus, purchaseCredits } = useVendorCredits();
  const { leads, stats: leadStats, loading: leadsLoading, getRecentLeads, getPerformanceInsights, simulateNewLead } = useVendorLeads();
  const { profile, loading: profileLoading, getProfileCompletion } = useVendorProfile();
  const { notifications, stats: notificationStats, simulateNewLead: simulateNotification } = useVendorNotifications();
  const router = useRouter();
  const [stats, setStats] = useState<VendorStats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    responseRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [bookingGrowthPct, setBookingGrowthPct] = useState<number | null>(null);
  const [earningsGrowthPct, setEarningsGrowthPct] = useState<number | null>(null);



  useEffect(() => {
    const fetchVendorData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/vendor/dashboard-summary', { credentials: 'include' });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load dashboard');
        }
        setStats(json.data.stats);
        setRecentActivity(json.data.recentActivity || []);
        setBookingGrowthPct(json.data.meta?.bookingGrowthPct ?? null);
        setEarningsGrowthPct(json.data.meta?.earningsGrowthPct ?? null);
      } catch (error) {
        console.error('Failed to fetch vendor data:', error);
        setStats({
          totalBookings: 0,
          pendingBookings: 0,
          completedBookings: 0,
          totalEarnings: 0,
          monthlyEarnings: 0,
          averageRating: 0,
          totalReviews: 0,
          responseRate: 0,
        });
        setRecentActivity([]);
        setBookingGrowthPct(null);
        setEarningsGrowthPct(null);
      } finally {
        setLoading(false);
      }
    };

    if (isVendor) {
      fetchVendorData();
    }
  }, [isVendor]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handlePurchaseCredits = async (amount: number) => {
    const success = await purchaseCredits(amount);
    if (success) {
      setShowCreditModal(false);
      // Show success message
      console.log(`Successfully purchased ${amount} credits!`);
    }
  };

  const handleSimulateLead = async () => {
    const success = await simulateNewLead();
    if (success) {
      console.log('New lead received!');
    } else {
      console.log('Cannot receive lead - insufficient credits');
    }
  };

  const creditStatus = getCreditStatus();
  const performanceInsights = getPerformanceInsights();
  const recentLeads = getRecentLeads(3);



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[{ label: 'Vendor Dashboard', href: '/vendor' }]} />
        
        {/* Vendor Top Menu */}
        <VendorTopMenu />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Vendor <span className="gradient-text">Dashboard</span></h1>
            {/*<p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Manage your business here.</p>*/}
          </div>
          <div className="flex items-center space-x-4">
            <VendorNotificationBell />
            <span className="text-sm text-gray-600">Last login: Today</span>
            <button
              onClick={handleLogout}
              className="btn-ghost btn-md hover-lift"
            >
              Logout
            </button>
          </div>
        </div>

        {loading || creditsLoading || leadsLoading || profileLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading dashboard...</span>
          </div>
        ) : (
          <>
            {/* Credit Balance Alert */}
            {creditData.isLowBalance && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-400 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Low Credit Balance
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>You have {creditData.currentCredits} credits remaining. Purchase more credits to continue receiving leads.</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => setShowCreditModal(true)}
                        className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-200"
                      >
                        Purchase Credits
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Completion Alert */}
            {profile && getProfileCompletion() < 80 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-yellow-600 text-xl mr-3">📝</span>
                  <div className="flex-1">
                    <h3 className="text-yellow-800 font-medium">Complete Your Profile</h3>
                    <p className="text-yellow-700 text-sm">
                      Your profile is {getProfileCompletion()}% complete. Complete it to improve your visibility and attract more leads.
                    </p>
                  </div>
                  <Link href="/vendor/profile">
                    <button className="btn-primary btn-sm">
                      Complete Profile
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Credit Balance Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Credit Balance</h2>
                  <p className="text-4xl font-bold mb-1">{creditData.currentCredits}</p>
                  <p className="text-blue-100">Available Credits</p>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 rounded-lg p-4 mb-2">
                    <p className="text-sm text-blue-100">Total Used</p>
                    <p className="text-xl font-bold">{creditData.totalUsed}</p>
                  </div>
                  <button
                    onClick={() => setShowCreditModal(true)}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    Top Up Credits
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-blue-100">Status: <span className={`font-medium ${creditStatus.color === 'green' ? 'text-green-300' : creditStatus.color === 'yellow' ? 'text-yellow-300' : 'text-red-300'}`}>{creditStatus.message}</span></span>
                <span className="text-blue-100">Last Top Up: {new Date(creditData.lastTopUp).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <span className="text-blue-600 text-xl">📅</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-sm ${bookingGrowthPct != null && bookingGrowthPct >= 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {bookingGrowthPct != null && bookingGrowthPct !== 0
                      ? `${bookingGrowthPct > 0 ? '+' : ''}${bookingGrowthPct}% vs prior month`
                      : 'Bookings tied to your account'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingBookings}</p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-3">
                    <span className="text-yellow-600 text-xl">⏳</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-yellow-600">Requires attention</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-3xl font-bold text-gray-900">${stats.totalEarnings.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <span className="text-green-600 text-xl">💰</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-sm ${earningsGrowthPct != null && earningsGrowthPct >= 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {earningsGrowthPct != null && earningsGrowthPct !== 0
                      ? `${earningsGrowthPct > 0 ? '+' : ''}${earningsGrowthPct}% vs prior month`
                      : 'Completed payments for your vendor ID'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.averageRating}</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <span className="text-purple-600 text-xl">⭐</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-600">
                    {stats.totalReviews > 0
                      ? `${stats.totalReviews} public review${stats.totalReviews === 1 ? '' : 's'} on your profile`
                      : 'Add testimonials on your profile'}
                  </span>
                </div>
              </div>
            </div>

            {recentActivity.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent activity</h2>
                <ul className="divide-y divide-gray-100">
                  {recentActivity.slice(0, 8).map((item) => (
                    <li key={item.id} className="py-3 flex justify-between gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">{item.title}</span>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                      <span className="text-gray-400 whitespace-nowrap">{formatRelativeTime(item.timestamp)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Recent Leads */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Recent Leads</h2>
                  <button
                    onClick={handleSimulateLead}
                    className="btn-primary btn-sm"
                    disabled={creditData.currentCredits < 5}
                  >
                    Simulate Lead
                  </button>
                </div>
                <div className="space-y-4">
                  {recentLeads.length > 0 ? recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <div className="rounded-full p-2 bg-blue-100">
                        <span className="text-sm text-blue-600">💬</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{lead.coupleName}</h3>
                        <p className="text-sm text-gray-600">{lead.serviceCategory} - {lead.location}</p>
                        <p className="text-sm text-gray-500">{lead.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">{new Date(lead.timestamp).toLocaleDateString()}</p>
                          <span className="text-xs text-blue-600 font-medium">{lead.referralTag}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lead.status === 'new' ? 'bg-green-100 text-green-800' :
                        lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'quoted' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'booked' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl mb-4 block">📭</span>
                      <p>No recent leads</p>
                    </div>
                  )}
                </div>
                {recentLeads.length > 0 && (
                  <div className="mt-4 text-center">
                    <Link href="/vendor/leads">
                      <button className="btn-outline btn-sm">View All Leads</button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Performance Insights */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Insights</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Lead Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Leads:</span>
                        <span className="font-medium">{leadStats.totalLeads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conversion Rate:</span>
                        <span className="font-medium text-green-600">{leadStats.conversionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">New Leads:</span>
                        <span className="font-medium text-blue-600">{leadStats.newLeads}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Top Categories</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Most Active:</span>
                        <span className="font-medium">{performanceInsights.mostActiveCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Top Location:</span>
                        <span className="font-medium">{performanceInsights.topLocation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowCreditModal(true)}
                        className="w-full btn-primary btn-sm"
                      >
                        💳 Purchase Credits
                      </button>
                      <Link href="/vendor/leads">
                        <button className="w-full btn-outline btn-sm">
                          📋 View All Leads
                        </button>
                      </Link>
                      <Link href="/vendor/profile">
                        <button className="w-full btn-outline btn-sm">
                          👤 Manage Profile
                        </button>
                      </Link>
                      <Link href="/vendor/billing">
                        <button className="w-full btn-outline btn-sm">
                          💰 Billing & History
                        </button>
                      </Link>
                      <Link href="/vendor/analytics">
                        <button className="w-full btn-outline btn-sm">
                          📊 View Analytics
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Modules */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Vendor Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/vendor/profile">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">👤</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Profile Management</h3>
                  <p className="text-gray-600 text-sm">Update your business profile and information</p>
                </div>
              </Link>

              <Link href="/vendor/services">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">🛠️</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Services & Portfolio</h3>
                  <p className="text-gray-600 text-sm">Manage your services and showcase your work</p>
                </div>
              </Link>

              <Link href="/vendor/bookings">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">📅</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Booking Management</h3>
                  <p className="text-gray-600 text-sm">View and manage all your bookings</p>
                </div>
              </Link>

              <Link href="/vendor/quotes">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">💬</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Quote Management</h3>
                  <p className="text-gray-600 text-sm">Respond to quote requests and manage proposals</p>
                </div>
              </Link>

              <Link href="/vendor/calendar">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">📆</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Calendar & Availability</h3>
                  <p className="text-gray-600 text-sm">Manage your schedule and availability</p>
                </div>
              </Link>

              <Link href="/vendor/billing">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">💰</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Billing & History</h3>
                  <p className="text-gray-600 text-sm">Manage credits, billing, and subscription</p>
                </div>
              </Link>

              <Link href="/vendor/reviews">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">⭐</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Reviews & Ratings</h3>
                  <p className="text-gray-600 text-sm">View and respond to customer reviews</p>
                </div>
              </Link>

              <Link href="/vendor/analytics">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">📊</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics & Reports</h3>
                  <p className="text-gray-600 text-sm">View detailed analytics and performance reports</p>
                </div>
              </Link>

              <Link href="/vendor/ads">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">📢</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Ad Bidding</h3>
                  <p className="text-gray-600 text-sm">Bid for top ad slots and pay per click from credits</p>
                </div>
              </Link>

              <Link href="/vendor/settings">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-3xl mb-4">⚙️</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Settings</h3>
                  <p className="text-gray-600 text-sm">Manage your account settings and preferences</p>
                </div>
              </Link>
            </div>
          </>
        )}

        {/* Credit Purchase Modal */}
        {showCreditModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <span className="text-blue-600 text-xl">💳</span>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Purchase Credits
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Choose a credit package to continue receiving leads. Each lead costs 5 credits.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => handlePurchaseCredits(25)}
                      className="bg-white border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">25</div>
                        <div className="text-sm text-gray-600">Credits</div>
                        <div className="text-sm font-medium text-gray-900">$25</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handlePurchaseCredits(50)}
                      className="bg-white border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">50</div>
                        <div className="text-sm text-gray-600">Credits</div>
                        <div className="text-sm font-medium text-gray-900">$45</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handlePurchaseCredits(100)}
                      className="bg-white border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">100</div>
                        <div className="text-sm text-gray-600">Credits</div>
                        <div className="text-sm font-medium text-gray-900">$80</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handlePurchaseCredits(200)}
                      className="bg-white border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">200</div>
                        <div className="text-sm text-gray-600">Credits</div>
                        <div className="text-sm font-medium text-gray-900">$150</div>
                      </div>
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={() => setShowCreditModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
