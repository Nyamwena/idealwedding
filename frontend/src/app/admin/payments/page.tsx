'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { AdminPagination } from '@/components/admin/AdminPagination';

interface MockPayment {
  id: string;
  customerName: string;
  vendorName: string;
  serviceType: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe';
  transactionDate: string;
  bookingId: string;
  commission: number;
}

export default function AdminPaymentsPage() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<MockPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<MockPayment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);



  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load payments');
      }
      
      setPayments(result.data);
    } catch (error) {
      console.error('Error loading payments:', error);
      // Fallback to empty array if API fails
      setPayments([]);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handlePaymentAction = async (paymentId: string, action: string) => {
    setActionLoading(paymentId);
    setSuccessMessage(null);

    try {
      let newStatus: string;
      switch (action) {
        case 'retry':
          newStatus = 'pending';
          break;
        case 'refund':
          newStatus = 'refunded';
          break;
        case 'approve':
          newStatus = 'completed';
          break;
        default:
          return;
      }

      // Find the payment to get current data
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;

      // Make API call to update payment status
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payment,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update payment status');
      }

      // Update local state with the response
      const updatedPayment = await response.json();
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? updatedPayment.data : p
      ));

      // Show success message
      setSuccessMessage(`Payment ${paymentId} has been ${action}ed successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(`Failed to ${action} payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewPayment = (payment: MockPayment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleEditPayment = (payment: MockPayment) => {
    // Navigate to edit page (we'll create this later)
    router.push(`/admin/payments/${payment.id}/edit`);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return;
    }

    setActionLoading(paymentId);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete payment');
      }

      // Remove from local state
      setPayments(prev => prev.filter(p => p.id !== paymentId));

      // Show success message
      setSuccessMessage('Payment deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error deleting payment:', error);
      alert(`Failed to delete payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      (p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.bookingId.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || p.status === statusFilter) &&
      (methodFilter === 'all' || p.paymentMethod === methodFilter)
  );

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, methodFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return '💳';
      case 'bank_transfer': return '🏦';
      case 'paypal': return '🅿️';
      case 'stripe': return '💳';
      default: return '💰';
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCommission = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.commission, 0);



  if (!isAdmin) {
    return null; // Will redirect if not admin
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 lg:text-5xl">
            Payment <span className="gradient-text">Management</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Monitor transactions, payments, and platform revenue.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">✅</div>
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">${totalRevenue.toLocaleString()}</h3>
            <p className="text-gray-600">Total Revenue</p>
            <div className="text-sm text-green-600 mt-2">+12% this month</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">${totalCommission.toLocaleString()}</h3>
            <p className="text-gray-600">Platform Commission</p>
            <div className="text-sm text-blue-600 mt-2">10% average</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{payments.filter(p => p.status === 'completed').length}</h3>
            <p className="text-gray-600">Successful Payments</p>
            <div className="text-sm text-green-600 mt-2">95% success rate</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <input
              type="text"
              placeholder="Search payments..."
              className="form-input w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex space-x-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                className="form-select"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {p.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.vendorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${p.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="flex items-center">
                        <span className="mr-2">{getMethodIcon(p.paymentMethod)}</span>
                        {p.paymentMethod.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.transactionDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleViewPayment(p)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                        {p.status === 'failed' && (
                          <button 
                            onClick={() => handlePaymentAction(p.id, 'retry')}
                            disabled={actionLoading === p.id}
                            className={`text-green-600 hover:text-green-900 ${actionLoading === p.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === p.id ? 'Processing...' : 'Retry'}
                          </button>
                        )}
                        {p.status === 'pending' && (
                          <button 
                            onClick={() => handlePaymentAction(p.id, 'approve')}
                            disabled={actionLoading === p.id}
                            className={`text-blue-600 hover:text-blue-900 ${actionLoading === p.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === p.id ? 'Processing...' : 'Approve'}
                          </button>
                        )}
                        {p.status === 'completed' && (
                          <button 
                            onClick={() => handlePaymentAction(p.id, 'refund')}
                            disabled={actionLoading === p.id}
                            className={`text-red-600 hover:text-red-900 ${actionLoading === p.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === p.id ? 'Processing...' : 'Refund'}
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditPayment(p)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePayment(p.id)}
                          disabled={actionLoading === p.id}
                          className={`text-red-600 hover:text-red-900 ${actionLoading === p.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {actionLoading === p.id ? 'Processing...' : 'Delete'}
                        </button>
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
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              if (page < 1 || page > totalPages) return;
              setCurrentPage(page);
            }}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(1);
            }}
          />
        </div>
      </main>
      <Footer />

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Transaction ID:</label>
                <p className="text-sm text-gray-900">{selectedPayment.id}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Customer:</label>
                <p className="text-sm text-gray-900">{selectedPayment.customerName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Vendor:</label>
                <p className="text-sm text-gray-900">{selectedPayment.vendorName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Service:</label>
                <p className="text-sm text-gray-900">{selectedPayment.serviceType}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Amount:</label>
                <p className="text-sm text-gray-900">${selectedPayment.amount.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Commission:</label>
                <p className="text-sm text-gray-900">${selectedPayment.commission.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Payment Method:</label>
                <p className="text-sm text-gray-900">
                  <span className="mr-2">{getMethodIcon(selectedPayment.paymentMethod)}</span>
                  {selectedPayment.paymentMethod.replace('_', ' ').toUpperCase()}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                  {selectedPayment.status}
                </span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Transaction Date:</label>
                <p className="text-sm text-gray-900">{selectedPayment.transactionDate}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Booking ID:</label>
                <p className="text-sm text-gray-900">{selectedPayment.bookingId}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  handleEditPayment(selectedPayment);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
