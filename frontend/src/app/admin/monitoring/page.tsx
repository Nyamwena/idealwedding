'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  status: 'healthy' | 'warning' | 'critical';
}

interface VendorActivity {
  id: string;
  vendorName: string;
  action: string;
  timestamp: string;
  details: string;
  impact: 'low' | 'medium' | 'high';
}

interface CreditUsage {
  vendorId: string;
  vendorName: string;
  creditsUsed: number;
  creditsRemaining: number;
  usagePercentage: number;
  lastUsed: string;
}

interface LeadGeneration {
  vendorId: string;
  vendorName: string;
  leadsGenerated: number;
  conversionRate: number;
  revenue: number;
  period: string;
}

export default function AdminMonitoringPage() {
  const { user,  isAdmin, logout } = useAuth();
  const router = useRouter();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [vendorActivities, setVendorActivities] = useState<VendorActivity[]>([]);
  const [creditUsage, setCreditUsage] = useState<CreditUsage[]>([]);
  const [leadGeneration, setLeadGeneration] = useState<LeadGeneration[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);



  useEffect(() => {
    if (isAdmin) {
      loadMonitoringData();
    }
  }, [isAdmin, selectedTimeRange]);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/monitoring');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load monitoring data');
      }
      
      const data = result.data;
      
      // Convert raw data to SystemMetric format
      const metrics: SystemMetric[] = [
        {
          name: 'Active Vendors',
          value: data.metrics.activeVendors,
          unit: 'vendors',
          change: 8.2,
          changeType: 'increase',
          status: 'healthy'
        },
        {
          name: 'Active Users',
          value: data.metrics.activeUsers,
          unit: 'users',
          change: 15.3,
          changeType: 'increase',
          status: 'healthy'
        },
        {
          name: 'Credits Used Today',
          value: data.metrics.creditsUsedToday,
          unit: 'credits',
          change: -2.1,
          changeType: 'decrease',
          status: data.metrics.creditsUsedToday > 200 ? 'warning' : 'healthy'
        },
        {
          name: 'Leads Generated',
          value: data.metrics.leadsGenerated,
          unit: 'leads',
          change: 12.5,
          changeType: 'increase',
          status: 'healthy'
        },
        {
          name: 'System Uptime',
          value: data.metrics.systemUptime,
          unit: '%',
          change: 0.1,
          changeType: 'increase',
          status: data.metrics.systemUptime > 99 ? 'healthy' : 'warning'
        },
        {
          name: 'Response Time',
          value: data.metrics.responseTime,
          unit: 'ms',
          change: -15.2,
          changeType: 'decrease',
          status: data.metrics.responseTime < 300 ? 'healthy' : 'warning'
        }
      ];
      
      setSystemMetrics(metrics);
      setVendorActivities(data.vendorActivities || []);
      setCreditUsage(data.creditUsage || []);
      setLeadGeneration(data.leadGeneration || []);
      setLastUpdated(data.lastUpdated);
      
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load monitoring data');
      // Set default values to prevent crashes
      setSystemMetrics([]);
      setVendorActivities([]);
      setCreditUsage([]);
      setLeadGeneration([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh' }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh monitoring data');
      }
      
      await loadMonitoringData();
      
    } catch (error) {
      console.error('Error refreshing monitoring data:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      healthy: 'text-green-600',
      warning: 'text-yellow-600',
      critical: 'text-red-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  const getStatusBg = (status: string) => {
    const colors = {
      healthy: 'bg-green-100',
      warning: 'bg-yellow-100',
      critical: 'bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100';
  };

  const getImpactColor = (impact: string) => {
    const colors = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    };
    return colors[impact as keyof typeof colors] || 'text-gray-600';
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };



  if (!isAdmin) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Monitoring</h1>
            <p className="text-gray-600">Monitor vendor activity, credit usage, and system performance</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={refreshData}
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">❌</div>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-blue-600 mr-3">ℹ️</div>
              <p className="text-blue-800">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {systemMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">{metric.name}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBg(metric.status)} ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {metric.value.toLocaleString()}
                </span>
                <span className="ml-2 text-sm text-gray-500">{metric.unit}</span>
              </div>
              <div className="mt-2">
                <span className={`text-sm font-medium ${
                  metric.changeType === 'increase' ? 'text-green-600' : 
                  metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.changeType === 'increase' ? '+' : ''}{metric.change}%
                </span>
                <span className="ml-1 text-sm text-gray-500">from last period</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vendor Activity */}
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Vendor Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {vendorActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.impact === 'high' ? 'bg-red-500' :
                      activity.impact === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.vendorName}
                        </p>
                        <span className={`text-xs font-medium ${getImpactColor(activity.impact)}`}>
                          {activity.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Credit Usage */}
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Credit Usage Overview</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {creditUsage.map((usage) => (
                  <div key={usage.vendorId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{usage.vendorName}</span>
                      <span className={`text-sm font-medium ${getUsageColor(usage.usagePercentage)}`}>
                        {usage.usagePercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          usage.usagePercentage >= 90 ? 'bg-red-500' :
                          usage.usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${usage.usagePercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{usage.creditsUsed} used</span>
                      <span>{usage.creditsRemaining} remaining</span>
                      <span>{usage.lastUsed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lead Generation Analytics */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lead Generation Analytics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leadGeneration.map((lead) => (
                  <tr key={lead.vendorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.vendorName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lead.leadsGenerated}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900 mr-2">
                          {lead.conversionRate}%
                        </div>
                        <div className={`w-16 h-2 bg-gray-200 rounded-full`}>
                          <div 
                            className={`h-2 rounded-full ${
                              lead.conversionRate >= 70 ? 'bg-green-500' :
                              lead.conversionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${lead.conversionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${lead.revenue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.period}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health Status */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">System Health Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900">API Gateway</h3>
              <p className="text-xs text-gray-500">99.9% uptime</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900">Database</h3>
              <p className="text-xs text-gray-500">99.8% uptime</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 text-2xl">⚠️</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900">Payment Service</h3>
              <p className="text-xs text-gray-500">98.5% uptime</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900">Email Service</h3>
              <p className="text-xs text-gray-500">99.7% uptime</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
