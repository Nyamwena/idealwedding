'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

interface NotificationAnalytics {
  totalNotifications: number;
  sentNotifications: number;
  scheduledNotifications: number;
  draftNotifications: number;
  totalRecipients: number;
  averageOpenRate: number;
  notificationsByType: {
    info: number;
    success: number;
    warning: number;
    error: number;
  };
  notificationsByTarget: {
    all_users: number;
    customers: number;
    vendors: number;
    admin: number;
  };
  notificationsByCategory: {
    general: number;
    system: number;
    admin: number;
    booking: number;
    payment: number;
    vendor: number;
    promotion: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    action: string;
    timestamp: string;
    user: string;
  }>;
  topPerformingNotifications: Array<{
    id: string;
    title: string;
    recipients: number;
    openRate: number;
    type: string;
  }>;
}

export default function NotificationAnalyticsPage() {
  const { user,  isAdmin, logout } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notifications');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load notifications');
      }
      
      // Calculate analytics from notification data
      const notifications = result.data;
      const sentNotifications = notifications.filter((n: any) => n.status === 'sent');
      const analyticsData: NotificationAnalytics = {
        totalNotifications: notifications.length,
        sentNotifications: sentNotifications.length,
        scheduledNotifications: notifications.filter((n: any) => n.status === 'scheduled').length,
        draftNotifications: notifications.filter((n: any) => n.status === 'draft').length,
        totalRecipients: notifications.reduce((sum: number, n: any) => sum + (n.recipients || 0), 0),
        averageOpenRate: sentNotifications.length > 0 
          ? Math.round(sentNotifications.reduce((sum: number, n: any) => sum + (parseInt(n.openRate) || 0), 0) / sentNotifications.length)
          : 0,
        notificationsByType: {
          info: notifications.filter((n: any) => n.type === 'info').length,
          success: notifications.filter((n: any) => n.type === 'success').length,
          warning: notifications.filter((n: any) => n.type === 'warning').length,
          error: notifications.filter((n: any) => n.type === 'error').length,
        },
        notificationsByTarget: {
          all_users: notifications.filter((n: any) => n.target === 'all_users').length,
          customers: notifications.filter((n: any) => n.target === 'customers').length,
          vendors: notifications.filter((n: any) => n.target === 'vendors').length,
          admin: notifications.filter((n: any) => n.target === 'admin').length,
        },
        notificationsByCategory: {
          general: notifications.filter((n: any) => n.category === 'general').length,
          system: notifications.filter((n: any) => n.category === 'system').length,
          admin: notifications.filter((n: any) => n.category === 'admin').length,
          booking: notifications.filter((n: any) => n.category === 'booking').length,
          payment: notifications.filter((n: any) => n.category === 'payment').length,
          vendor: notifications.filter((n: any) => n.category === 'vendor').length,
          promotion: notifications.filter((n: any) => n.category === 'promotion').length,
        },
        recentActivity: notifications
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map((n: any) => ({
            id: n.id,
            title: n.title,
            action: n.status === 'sent' ? 'Sent' : n.status === 'scheduled' ? 'Scheduled' : 'Updated',
            timestamp: new Date(n.updatedAt).toLocaleString(),
            user: n.author
          })),
        topPerformingNotifications: sentNotifications
          .filter((n: any) => parseInt(n.openRate) > 0)
          .sort((a: any, b: any) => parseInt(b.openRate) - parseInt(a.openRate))
          .slice(0, 5)
          .map((n: any) => ({
            id: n.id,
            title: n.title,
            recipients: n.recipients,
            openRate: parseInt(n.openRate),
            type: n.type
          }))
      };
      
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'info': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };



  if (!isAdmin) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Header />
        <main className="container-modern py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/admin/notifications" className="btn-primary">
              ← Back to Notifications
            </Link>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Analytics</h1>
            <p className="text-gray-600">Comprehensive insights into notification performance and engagement</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadAnalytics}
              disabled={loading}
              className={`btn-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <Link href="/admin/notifications" className="btn-outline">
              ← Back to Notifications
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
                    <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalNotifications}</p>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalRecipients.toLocaleString()}</p>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Open Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.averageOpenRate}%</p>
                    <p className="text-xs text-gray-500 mt-1">Sent notifications only</p>
                  </div>
                  <div className="text-3xl">📈</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sent Notifications</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.sentNotifications}</p>
                  </div>
                  <div className="text-3xl">📤</div>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">Sent</span>
                    </div>
                    <span className="font-semibold text-gray-900">{analytics.sentNotifications}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">Scheduled</span>
                    </div>
                    <span className="font-semibold text-gray-900">{analytics.scheduledNotifications}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">Draft</span>
                    </div>
                    <span className="font-semibold text-gray-900">{analytics.draftNotifications}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Notifications by Type</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">ℹ️</span>
                      <span className="text-gray-700">Info</span>
                    </div>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByType.info}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">✅</span>
                      <span className="text-gray-700">Success</span>
                    </div>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByType.success}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">⚠️</span>
                      <span className="text-gray-700">Warning</span>
                    </div>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByType.warning}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">❌</span>
                      <span className="text-gray-700">Error</span>
                    </div>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByType.error}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Audience & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Target Audience</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">All Users</span>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByTarget.all_users}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Customers</span>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByTarget.customers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Vendors</span>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByTarget.vendors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Admin</span>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByTarget.admin}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Categories</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">System</span>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByCategory.system}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">General</span>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByCategory.general}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Payment</span>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByCategory.payment}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Booking</span>
                    <span className="font-semibold text-gray-900">{analytics.notificationsByCategory.booking}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Notifications</h2>
                {analytics.topPerformingNotifications.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topPerformingNotifications.map((notification) => (
                      <div key={notification.id} className="border-l-4 border-primary-500 pl-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600">
                              {notification.recipients} recipients • {notification.openRate}% open rate
                            </p>
                          </div>
                          <span className={`text-lg ${getTypeColor(notification.type)}`}>
                            {getTypeIcon(notification.type)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No sent notifications with open rate data yet</p>
                )}
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {analytics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">
                          {activity.action} by {activity.user}
                        </p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
