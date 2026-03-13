'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminExportSimple } from '@/components/admin/AdminExportSimple';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  bookingId: string;
  customerName: string;
  serviceName: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe';
  transactionId: string;
  paymentDate: string;
  dueDate: string;
  description: string;
  createdAt: string;
}

interface PaymentStats {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayments: number;
  completedPayments: number;
  platformFees: number;
  netEarnings: number;
}

export default function VendorPaymentsPage() {
  const { user,  isVendor, logout } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingPayments: 0,
    completedPayments: 0,
    platformFees: 0,
    netEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);



  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock payments data
        const mockPayments: Payment[] = [
          {
            id: '1',
            bookingId: 'BK001',
            customerName: 'Sarah & John Smith',
            serviceName: 'Wedding Photography Package',
            amount: 2500,
            platformFee: 125,
            netAmount: 2375,
            status: 'completed',
            paymentMethod: 'credit_card',
            transactionId: 'TXN_123456789',
            paymentDate: '2024-09-24',
            dueDate: '2024-09-24',
            description: 'Wedding photography services - Dec 15, 2024',
            createdAt: '2024-09-20',
          },
          {
            id: '2',
            bookingId: 'BK002',
            customerName: 'Emily & Michael Johnson',
            serviceName: 'Engagement Session',
            amount: 400,
            platformFee: 20,
            netAmount: 380,
            status: 'pending',
            paymentMethod: 'bank_transfer',
            transactionId: 'TXN_987654321',
            paymentDate: '',
            dueDate: '2024-10-20',
            description: 'Engagement photo session - Oct 20, 2024',
            createdAt: '2024-09-22',
          },
          {
            id: '3',
            bookingId: 'BK003',
            customerName: 'Jessica & David Wilson',
            serviceName: 'Event Videography',
            amount: 1800,
            platformFee: 90,
            netAmount: 1710,
            status: 'processing',
            paymentMethod: 'stripe',
            transactionId: 'TXN_456789123',
            paymentDate: '2024-09-25',
            dueDate: '2024-09-25',
            description: 'Event videography services - Nov 10, 2024',
            createdAt: '2024-09-18',
          },
          {
            id: '4',
            bookingId: 'BK004',
            customerName: 'Amanda & Robert Brown',
            serviceName: 'Wedding Photography Package',
            amount: 2500,
            platformFee: 125,
            netAmount: 2375,
            status: 'completed',
            paymentMethod: 'paypal',
            transactionId: 'TXN_789123456',
            paymentDate: '2024-09-30',
            dueDate: '2024-09-30',
            description: 'Wedding photography services - Sep 30, 2024',
            createdAt: '2024-08-15',
          },
          {
            id: '5',
            bookingId: 'BK005',
            customerName: 'Lisa & Mark Davis',
            serviceName: 'Portrait Photography',
            amount: 300,
            platformFee: 15,
            netAmount: 285,
            status: 'refunded',
            paymentMethod: 'credit_card',
            transactionId: 'TXN_321654987',
            paymentDate: '2024-09-28',
            dueDate: '2024-09-28',
            description: 'Portrait session - cancelled due to emergency',
            createdAt: '2024-09-10',
          },
        ];

        // Calculate stats
        const totalEarnings = mockPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const monthlyEarnings = mockPayments
          .filter(payment => {
            const paymentDate = new Date(payment.paymentDate);
            const currentDate = new Date();
            return paymentDate.getMonth() === currentDate.getMonth() && 
                   paymentDate.getFullYear() === currentDate.getFullYear();
          })
          .reduce((sum, payment) => sum + payment.amount, 0);
        const pendingPayments = mockPayments.filter(payment => payment.status === 'pending').length;
        const completedPayments = mockPayments.filter(payment => payment.status === 'completed').length;
        const platformFees = mockPayments.reduce((sum, payment) => sum + payment.platformFee, 0);
        const netEarnings = mockPayments.reduce((sum, payment) => sum + payment.netAmount, 0);

        setPayments(mockPayments);
        setStats({
          totalEarnings,
          monthlyEarnings,
          pendingPayments,
          completedPayments,
          platformFees,
          netEarnings,
        });
      } catch (error) {
        console.error('Failed to fetch payments:', error);
        toast.error('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    if (isVendor) {
      fetchPayments();
    }
  }, [isVendor]);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const today = new Date();
      const paymentDate = new Date(payment.paymentDate);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = paymentDate.toDateString() === today.toDateString();
          break;
        case 'this_week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          matchesDate = paymentDate >= weekStart;
          break;
        case 'this_month':
          matchesDate = paymentDate.getMonth() === today.getMonth() && 
                       paymentDate.getFullYear() === today.getFullYear();
          break;
        case 'last_month':
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          matchesDate = paymentDate.getMonth() === lastMonth.getMonth() && 
                       paymentDate.getFullYear() === lastMonth.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return '💳';
      case 'bank_transfer': return '🏦';
      case 'paypal': return '🅿️';
      case 'stripe': return '💳';
      default: return '💰';
    }
  };



  if (!isVendor) {
    return null; // Will redirect if not vendor
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[
          { label: 'Vendor Dashboard', href: '/vendor' },
          { label: 'Payments & Earnings', href: '/vendor/payments' }
        ]} />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Payments & <span className="gradient-text">Earnings</span></h1>
          <div className="flex items-center space-x-4">
            <AdminExportSimple data={paginatedPayments} filename="vendor_payments" />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
              <span className="text-sm text-green-600">All time earnings</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                <p className="text-3xl font-bold text-gray-900">${stats.monthlyEarnings.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-blue-600 text-xl">📅</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-blue-600">This month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Earnings</p>
                <p className="text-3xl font-bold text-gray-900">${stats.netEarnings.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-purple-600 text-xl">💎</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-purple-600">After platform fees</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
            <input
              type="text"
              placeholder="Search payments..."
              className="form-input w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            <div className="flex space-x-4 w-full md:w-auto">
              <select
                className="form-select flex-1"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                className="form-select flex-1"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.transactionId}</div>
                        <div className="text-sm text-gray-500">{payment.bookingId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.serviceName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${payment.platformFee.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${payment.netAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                        </span>
                        <div>
                          <div className="text-sm text-gray-900">
                            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'Pending'}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {payment.paymentMethod.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPayments.length}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(itemsPerPage) => {
              setItemsPerPage(itemsPerPage);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Payment Summary */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.completedPayments}</div>
              <div className="text-sm text-gray-600">Completed Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</div>
              <div className="text-sm text-gray-600">Pending Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">${stats.platformFees.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Platform Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">5%</div>
              <div className="text-sm text-gray-600">Platform Fee Rate</div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
