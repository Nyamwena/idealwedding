'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface Report {
  id: string;
  name: string;
  type: 'financial' | 'user_activity' | 'vendor_performance' | 'booking_analytics';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastGenerated: string;
  status: 'ready' | 'generating' | 'error';
  size: string;
  data?: any;
}

interface ReportData {
  users: any[];
  vendors: any[];
  quotes: any[];
  bookings: any[];
  payments: any[];
}

export default function AdminReportsPage() {
  const { user,  isAdmin, logout } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);



  useEffect(() => {
    if (isAdmin) {
      loadReportData();
      generateDefaultReports();
    }
  }, [isAdmin]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
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

      const data: ReportData = {
        users: usersResult.data || [],
        vendors: vendorsResult.data || [],
        quotes: quotesResult.data || [],
        bookings: bookingsResult.data || [],
        payments: paymentsResult.data || []
      };

      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultReports = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const defaultReports: Report[] = [
      {
        id: 'financial-monthly',
        name: 'Monthly Financial Report',
        type: 'financial',
        period: 'monthly',
        lastGenerated: today,
        status: 'ready',
        size: '2.1 MB'
      },
      {
        id: 'user-weekly',
        name: 'Weekly User Analytics',
        type: 'user_activity',
        period: 'weekly',
        lastGenerated: today,
        status: 'ready',
        size: '1.5 MB'
      },
      {
        id: 'vendor-monthly',
        name: 'Monthly Vendor Performance',
        type: 'vendor_performance',
        period: 'monthly',
        lastGenerated: today,
        status: 'ready',
        size: '2.8 MB'
      },
      {
        id: 'booking-daily',
        name: 'Daily Booking Analytics',
        type: 'booking_analytics',
        period: 'daily',
        lastGenerated: today,
        status: 'ready',
        size: '0.9 MB'
      }
    ];

    setReports(defaultReports);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const generateReport = async (type: string, period: string = 'monthly') => {
    if (!reportData) return;
    
    setGeneratingReport(type);
    
    try {
      // Simulate report generation time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportId = `${type}-${period}`;
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate report size based on data
      let size = '0.5 MB';
      switch (type) {
        case 'financial':
          size = `${(reportData.payments.length * 0.1 + 0.5).toFixed(1)} MB`;
          break;
        case 'user_activity':
          size = `${(reportData.users.length * 0.05 + 0.3).toFixed(1)} MB`;
          break;
        case 'vendor_performance':
          size = `${(reportData.vendors.length * 0.15 + 0.4).toFixed(1)} MB`;
          break;
        case 'booking_analytics':
          size = `${(reportData.bookings.length * 0.08 + 0.2).toFixed(1)} MB`;
          break;
      }
      
      const newReport: Report = {
        id: reportId,
        name: `${period.charAt(0).toUpperCase() + period.slice(1)} ${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report`,
        type: type as any,
        period: period as any,
        lastGenerated: today,
        status: 'ready',
        size: size,
        data: reportData
      };
      
      setReports(prev => {
        const filtered = prev.filter(r => r.id !== reportId);
        return [newReport, ...filtered];
      });
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(null);
    }
  };

  const downloadReport = (report: Report) => {
    if (!reportData) return;
    
    // Generate report content based on type
    let content = '';
    let filename = `${report.name.replace(/\s+/g, '_')}.txt`;
    
    switch (report.type) {
      case 'financial':
        const totalRevenue = reportData.payments
          .filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        content = `Financial Report - ${report.period.toUpperCase()}\n` +
                 `Generated: ${report.lastGenerated}\n\n` +
                 `Total Revenue: $${totalRevenue.toLocaleString()}\n` +
                 `Total Payments: ${reportData.payments.length}\n` +
                 `Completed Payments: ${reportData.payments.filter((p: any) => p.status === 'completed').length}\n` +
                 `Refunded Payments: ${reportData.payments.filter((p: any) => p.status === 'refunded').length}\n\n` +
                 `Payment Details:\n` +
                 reportData.payments.map((p: any) => 
                   `- ${p.id}: ${p.status}, Amount: $${p.amount}, Date: ${p.createdAt}`
                 ).join('\n');
        break;
        
      case 'user_activity':
        content = `User Analytics Report - ${report.period.toUpperCase()}\n` +
                 `Generated: ${report.lastGenerated}\n\n` +
                 `Total Users: ${reportData.users.length}\n` +
                 `User Details:\n` +
                 reportData.users.map((u: any) => 
                   `- ${u.name || u.email}: ${u.role || 'user'}, Created: ${u.createdAt}`
                 ).join('\n');
        break;
        
      case 'vendor_performance':
        const approvedVendors = reportData.vendors.filter((v: any) => v.status === 'approved');
        content = `Vendor Performance Report - ${report.period.toUpperCase()}\n` +
                 `Generated: ${report.lastGenerated}\n\n` +
                 `Total Vendors: ${reportData.vendors.length}\n` +
                 `Approved Vendors: ${approvedVendors.length}\n` +
                 `Pending Vendors: ${reportData.vendors.length - approvedVendors.length}\n\n` +
                 `Vendor Details:\n` +
                 reportData.vendors.map((v: any) => 
                   `- ${v.businessName || v.name}: ${v.category}, Status: ${v.status}, Rating: ${v.rating || 'N/A'}`
                 ).join('\n');
        break;
        
      case 'booking_analytics':
        const completedBookings = reportData.bookings.filter((b: any) => b.status === 'completed');
        content = `Booking Analytics Report - ${report.period.toUpperCase()}\n` +
                 `Generated: ${report.lastGenerated}\n\n` +
                 `Total Bookings: ${reportData.bookings.length}\n` +
                 `Completed Bookings: ${completedBookings.length}\n` +
                 `Pending Bookings: ${reportData.bookings.length - completedBookings.length}\n\n` +
                 `Booking Details:\n` +
                 reportData.bookings.map((b: any) => 
                   `- ${b.id}: ${b.eventType || 'Event'}, Status: ${b.status}, Date: ${b.eventDate}`
                 ).join('\n');
        break;
    }
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const viewReport = (report: Report) => {
    // Open report in a new window/tab with formatted data
    const reportWindow = window.open('', '_blank');
    if (reportWindow && reportData) {
      let html = `
        <html>
          <head>
            <title>${report.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>${report.name}</h1>
            <p>Generated: ${report.lastGenerated}</p>
      `;
      
      switch (report.type) {
        case 'financial':
          const totalRevenue = reportData.payments
            .filter((p: any) => p.status === 'completed')
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          html += `
            <div class="metric"><strong>Total Revenue:</strong> $${totalRevenue.toLocaleString()}</div>
            <div class="metric"><strong>Total Payments:</strong> ${reportData.payments.length}</div>
            <div class="metric"><strong>Completed Payments:</strong> ${reportData.payments.filter((p: any) => p.status === 'completed').length}</div>
          `;
          break;
        case 'user_activity':
          html += `
            <div class="metric"><strong>Total Users:</strong> ${reportData.users.length}</div>
          `;
          break;
        case 'vendor_performance':
          const approvedVendors = reportData.vendors.filter((v: any) => v.status === 'approved');
          html += `
            <div class="metric"><strong>Total Vendors:</strong> ${reportData.vendors.length}</div>
            <div class="metric"><strong>Approved Vendors:</strong> ${approvedVendors.length}</div>
          `;
          break;
        case 'booking_analytics':
          const completedBookings = reportData.bookings.filter((b: any) => b.status === 'completed');
          html += `
            <div class="metric"><strong>Total Bookings:</strong> ${reportData.bookings.length}</div>
            <div class="metric"><strong>Completed Bookings:</strong> ${completedBookings.length}</div>
          `;
          break;
      }
      
      html += `</body></html>`;
      reportWindow.document.write(html);
      reportWindow.document.close();
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      (r.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (typeFilter === 'all' || r.type === typeFilter) &&
      (periodFilter === 'all' || r.period === periodFilter)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return '💰';
      case 'user_activity': return '👥';
      case 'vendor_performance': return '🏢';
      case 'booking_analytics': return '📊';
      default: return '📄';
    }
  };

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case 'daily': return '📅';
      case 'weekly': return '📆';
      case 'monthly': return '🗓️';
      case 'yearly': return '📈';
      default: return '📅';
    }
  };



  if (!isAdmin) {
    return null; // Will redirect if not admin
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 lg:text-5xl">
            Reports & <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate and manage comprehensive platform reports and analytics.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => generateReport('financial', 'monthly')}
            disabled={generatingReport === 'financial' || !reportData}
            className={`bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left ${
              generatingReport === 'financial' || !reportData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-900">Financial Report</h3>
            <p className="text-sm text-gray-600">
              {generatingReport === 'financial' ? 'Generating...' : 'Generate revenue and financial data'}
            </p>
          </button>
          
          <button 
            onClick={() => generateReport('user_activity', 'weekly')}
            disabled={generatingReport === 'user_activity' || !reportData}
            className={`bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left ${
              generatingReport === 'user_activity' || !reportData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-semibold text-gray-900">User Analytics</h3>
            <p className="text-sm text-gray-600">
              {generatingReport === 'user_activity' ? 'Generating...' : 'User activity and engagement metrics'}
            </p>
          </button>
          
          <button 
            onClick={() => generateReport('vendor_performance', 'monthly')}
            disabled={generatingReport === 'vendor_performance' || !reportData}
            className={`bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left ${
              generatingReport === 'vendor_performance' || !reportData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="text-2xl mb-2">🏢</div>
            <h3 className="font-semibold text-gray-900">Vendor Report</h3>
            <p className="text-sm text-gray-600">
              {generatingReport === 'vendor_performance' ? 'Generating...' : 'Vendor performance and statistics'}
            </p>
          </button>
          
          <button 
            onClick={() => generateReport('booking_analytics', 'daily')}
            disabled={generatingReport === 'booking_analytics' || !reportData}
            className={`bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left ${
              generatingReport === 'booking_analytics' || !reportData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900">Booking Analytics</h3>
            <p className="text-sm text-gray-600">
              {generatingReport === 'booking_analytics' ? 'Generating...' : 'Booking and conversion analytics'}
            </p>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <input
              type="text"
              placeholder="Search reports..."
              className="form-input w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex space-x-4">
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="financial">Financial</option>
                <option value="user_activity">User Activity</option>
                <option value="vendor_performance">Vendor Performance</option>
                <option value="booking_analytics">Booking Analytics</option>
              </select>
              <select
                className="form-select"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
              >
                <option value="all">All Periods</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Generated
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{r.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="flex items-center">
                        <span className="mr-2">{getTypeIcon(r.type)}</span>
                        {r.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="flex items-center">
                        <span className="mr-2">{getPeriodIcon(r.period)}</span>
                        {r.period.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.lastGenerated}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {r.status === 'ready' && (
                        <>
                          <button 
                            onClick={() => downloadReport(r)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Download
                          </button>
                          <button 
                            onClick={() => viewReport(r)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </button>
                        </>
                      )}
                      {r.status === 'generating' && (
                        <span className="text-yellow-600">Generating...</span>
                      )}
                      {r.status === 'error' && (
                        <button 
                          onClick={() => generateReport(r.type, r.period)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Retry
                        </button>
                      )}
                      <button 
                        onClick={() => generateReport(r.type, r.period)}
                        className="text-gray-600 hover:text-gray-900 ml-4"
                      >
                        Regenerate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
