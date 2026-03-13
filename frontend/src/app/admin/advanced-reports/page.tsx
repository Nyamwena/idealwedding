'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminExportSimple } from '@/components/admin/AdminExportSimple';

interface ReportQuery {
  id: string;
  name: string;
  description: string;
  category: 'vendors' | 'users' | 'revenue' | 'performance' | 'custom';
  parameters: {
    dateRange: string;
    vendorCategory?: string;
    status?: string;
    minRevenue?: number;
    maxRevenue?: number;
    sortBy?: string;
    limit?: number;
  };
  results: any[];
  createdAt: string;
  lastRun: string;
}

interface VendorPerformanceReport {
  vendorId: string;
  vendorName: string;
  category: string;
  totalLeads: number;
  totalQuotes: number;
  totalBookings: number;
  conversionRate: number;
  revenue: number;
  creditsUsed: number;
  rating: number;
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

interface CreditConsumptionReport {
  vendorId: string;
  vendorName: string;
  category: string;
  creditsPurchased: number;
  creditsUsed: number;
  creditsRemaining: number;
  usagePercentage: number;
  avgCreditsPerLead: number;
  lastPurchase: string;
  lastUsed: string;
}

interface TopCategoryReport {
  category: string;
  vendorCount: number;
  totalLeads: number;
  totalRevenue: number;
  avgRating: number;
  topVendor: string;
  growthRate: number;
}

export default function AdminAdvancedReportsPage() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [reportQueries, setReportQueries] = useState<ReportQuery[]>([]);
  const [vendorPerformance, setVendorPerformance] = useState<VendorPerformanceReport[]>([]);
  const [creditConsumption, setCreditConsumption] = useState<CreditConsumptionReport[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategoryReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('vendor-performance');
  const [dateRange, setDateRange] = useState('30d');
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState({
    name: '',
    description: '',
    category: 'vendors' as const,
    parameters: {
      dateRange: '30d',
      vendorCategory: '',
      status: '',
      minRevenue: 0,
      maxRevenue: 100000,
      sortBy: 'revenue',
      limit: 100
    }
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    loadAdvancedReportsData();
  }, [dateRange]);

  const loadAdvancedReportsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/advanced-reports');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load advanced reports data');
      }
      
      setVendorPerformance(result.data.vendorPerformance || []);
      setCreditConsumption(result.data.creditConsumption || []);
      setTopCategories(result.data.topCategories || []);
      setReportQueries(result.data.customQueries || []);
    } catch (error) {
      console.error('Error loading advanced reports:', error);
      setError(error instanceof Error ? error.message : 'Failed to load advanced reports');
      // Set default values to prevent crashes
      setVendorPerformance([]);
      setCreditConsumption([]);
      setTopCategories([]);
      setReportQueries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getPerformanceBadge = (performance: string) => {
    const styles = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      average: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    };
    return styles[performance as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const handleCreateQuery = async () => {
    if (!newQuery.name.trim()) {
      setError('Query name is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/advanced-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addCustomQuery',
          query: newQuery
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create custom query');
      }

      setReportQueries(prev => [...prev, result.data]);
      setShowQueryBuilder(false);
      setSuccessMessage('Custom query created successfully');
      setNewQuery({
        name: '',
        description: '',
        category: 'vendors',
        parameters: {
          dateRange: '30d',
          vendorCategory: '',
          status: '',
          minRevenue: 0,
          maxRevenue: 100000,
          sortBy: 'revenue',
          limit: 100
        }
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error creating custom query:', error);
      setError(error instanceof Error ? error.message : 'Failed to create custom query');
    }
  };

  const handleGenerateReport = async (queryId: string) => {
    try {
      const response = await fetch('/api/admin/advanced-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateReport',
          query: { id: queryId }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate report');
      }

      // Update the query's results
      setReportQueries(prev => prev.map(query => 
        query.id === queryId 
          ? { ...query, results: result.data, lastRun: new Date().toISOString() }
          : query
      ));

      setSuccessMessage('Report generated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    }
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'vendor-performance':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Vendor Performance Report</h3>
              <AdminExportSimple 
                data={vendorPerformance} 
                filename="vendor-performance-report"
                headers={['Vendor Name', 'Category', 'Total Leads', 'Total Quotes', 'Total Bookings', 'Conversion Rate', 'Revenue', 'Credits Used', 'Rating', 'Performance']}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendorPerformance.map((vendor) => (
                    <tr key={vendor.vendorId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vendor.vendorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vendor.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.totalLeads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.totalQuotes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.totalBookings}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.conversionRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${vendor.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceBadge(vendor.performance)}`}>
                          {vendor.performance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'credit-consumption':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Credit Consumption Trends</h3>
              <AdminExportSimple 
                data={creditConsumption} 
                filename="credit-consumption-report"
                headers={['Vendor Name', 'Category', 'Credits Purchased', 'Credits Used', 'Credits Remaining', 'Usage %', 'Avg Credits/Lead', 'Last Purchase', 'Last Used']}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg/Lead</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {creditConsumption.map((vendor) => (
                    <tr key={vendor.vendorId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vendor.vendorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vendor.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.creditsPurchased}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.creditsUsed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.creditsRemaining}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900 mr-2">
                            {vendor.usagePercentage}%
                          </div>
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className={`h-2 rounded-full ${
                                vendor.usagePercentage >= 90 ? 'bg-red-500' :
                                vendor.usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${vendor.usagePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.avgCreditsPerLead}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'top-categories':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Top Categories Analysis</h3>
              <AdminExportSimple 
                data={topCategories} 
                filename="top-categories-report"
                headers={['Category', 'Vendor Count', 'Total Leads', 'Total Revenue', 'Avg Rating', 'Top Vendor', 'Growth Rate']}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topCategories.map((category, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">{category.category}</h4>
                    <span className="text-2xl font-bold text-primary-600">#{index + 1}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Vendors:</span>
                      <span className="text-sm font-medium text-gray-900">{category.vendorCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Leads:</span>
                      <span className="text-sm font-medium text-gray-900">{category.totalLeads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Revenue:</span>
                      <span className="text-sm font-medium text-gray-900">${category.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Rating:</span>
                      <span className="text-sm font-medium text-gray-900">{category.avgRating} ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Top Vendor:</span>
                      <span className="text-sm font-medium text-gray-900">{category.topVendor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Growth:</span>
                      <span className="text-sm font-medium text-green-600">+{category.growthRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Select a report to view</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Reports</h1>
            <p className="text-gray-600">Generate detailed reports with advanced querying capabilities</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowQueryBuilder(true)}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Loading...' : '+ Create Custom Query'}
            </button>
            <button 
              onClick={loadAdvancedReportsData}
              className="btn-outline"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <Link href="/admin" className="btn-outline">
              ← Back to Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Report Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedReport('vendor-performance')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedReport === 'vendor-performance'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900">Vendor Performance</h3>
              <p className="text-sm text-gray-600">Most requested vendors, conversion rates, and performance metrics</p>
            </button>
            <button
              onClick={() => setSelectedReport('credit-consumption')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedReport === 'credit-consumption'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900">Credit Consumption</h3>
              <p className="text-sm text-gray-600">Credit usage trends, efficiency metrics, and consumption patterns</p>
            </button>
            <button
              onClick={() => setSelectedReport('top-categories')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedReport === 'top-categories'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900">Top Categories</h3>
              <p className="text-sm text-gray-600">Category performance, growth rates, and market analysis</p>
            </button>
          </div>
        </div>

        {/* Custom Queries Section */}
        {reportQueries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Queries</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportQueries.map((query) => (
                    <tr key={query.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {query.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {query.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {query.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(query.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(query.lastRun).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleGenerateReport(query.id)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                          disabled={loading}
                        >
                          {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                        <span className="text-gray-500">
                          {query.results.length} results
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {renderReportContent()}
        </div>

        {/* Custom Query Builder Modal */}
        {showQueryBuilder && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6" id="modal-title">
                        Create Custom Query
                      </h3>
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Query Name</label>
                          <input 
                            type="text" 
                            value={newQuery.name}
                            onChange={(e) => setNewQuery(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter query name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea 
                            value={newQuery.description}
                            onChange={(e) => setNewQuery(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Describe what this query does"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select 
                            value={newQuery.category}
                            onChange={(e) => setNewQuery(prev => ({ ...prev, category: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="vendors">Vendors</option>
                            <option value="users">Users</option>
                            <option value="revenue">Revenue</option>
                            <option value="performance">Performance</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <select 
                              value={newQuery.parameters.dateRange}
                              onChange={(e) => setNewQuery(prev => ({ 
                                ...prev, 
                                parameters: { ...prev.parameters, dateRange: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="7d">Last 7 days</option>
                              <option value="30d">Last 30 days</option>
                              <option value="90d">Last 90 days</option>
                              <option value="1y">Last year</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                            <select 
                              value={newQuery.parameters.sortBy}
                              onChange={(e) => setNewQuery(prev => ({ 
                                ...prev, 
                                parameters: { ...prev.parameters, sortBy: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="revenue">Revenue</option>
                              <option value="leads">Leads</option>
                              <option value="rating">Rating</option>
                              <option value="conversion">Conversion Rate</option>
                            </select>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleCreateQuery}
                  >
                    Create Query
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setShowQueryBuilder(false)}
                  >
                    Cancel
                  </button>
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
