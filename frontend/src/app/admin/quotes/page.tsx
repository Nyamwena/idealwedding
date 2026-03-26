'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface MockQuote {
  id: string;
  customerName: string;
  customerEmail: string;
  vendorName: string;
  service: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  amount: number;
  requestDate: string;
  responseDate?: string;
  message: string;
}

export default function AdminQuotesPage() {
  const { user,  isAdmin, logout } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<MockQuote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<MockQuote | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);



  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const response = await fetch('/api/admin/quotes');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load quotes');
      }
      
      setQuotes(result.data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      // Fallback to empty array if API fails
      setQuotes([]);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleQuoteAction = async (quoteId: string, action: string) => {
    setActionLoading(quoteId);
    setSuccessMessage(null);

    try {
      let newStatus: string;
      switch (action) {
        case 'approve':
          newStatus = 'approved';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        default:
          return;
      }

      // Find the quote to get current data
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) return;

      // Make API call to update quote status
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...quote,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update quote status');
      }

      // Update local state with the response
      const updatedQuote = await response.json();
      setQuotes(prev => prev.map(q => 
        q.id === quoteId ? updatedQuote.data : q
      ));

      // Show success message
      setSuccessMessage(`Quote for ${quote.customerName} has been ${action}d successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error updating quote status:', error);
      alert(`Failed to ${action} quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewQuote = (quote: MockQuote) => {
    setSelectedQuote(quote);
    setShowQuoteModal(true);
  };

  const handleEditQuote = (quote: MockQuote) => {
    // Navigate to edit page (we'll create this later)
    router.push(`/admin/quotes/${quote.id}/edit`);
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    setActionLoading(quoteId);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete quote');
      }

      // Remove from local state
      setQuotes(prev => prev.filter(q => q.id !== quoteId));

      // Show success message
      setSuccessMessage('Quote deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error deleting quote:', error);
      alert(`Failed to delete quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getServiceIcon = (service: string) => {
    const icons = {
      'Wedding Flowers': '🌸',
      'Wedding Photography': '📸',
      'Wedding Catering': '🍽️',
      'Wedding Venue': '🏛️',
      'Wedding Entertainment': '🎵'
    };
    return icons[service as keyof typeof icons] || '💼';
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Management</h1>
            <p className="text-gray-600">Monitor and manage quote requests</p>
          </div>
          <Link href="/admin" className="btn-outline">
            ← Back to Admin Dashboard
          </Link>
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

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Quotes</label>
              <input
                type="text"
                placeholder="Search by customer, vendor, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quotes Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-primary-600 font-medium">
                            {quote.customerName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {quote.customerName}
                          </div>
                          <div className="text-sm text-gray-500">{quote.customerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quote.vendorName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getServiceIcon(quote.service)}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {quote.service}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${quote.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quote.requestDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewQuote(quote)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                        {quote.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleQuoteAction(quote.id, 'approve')}
                              disabled={actionLoading === quote.id}
                              className={`text-green-600 hover:text-green-900 ${actionLoading === quote.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {actionLoading === quote.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => handleQuoteAction(quote.id, 'reject')}
                              disabled={actionLoading === quote.id}
                              className={`text-red-600 hover:text-red-900 ${actionLoading === quote.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {actionLoading === quote.id ? 'Processing...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {quote.status === 'approved' && (
                          <button 
                            onClick={() => handleQuoteAction(quote.id, 'complete')}
                            disabled={actionLoading === quote.id}
                            className={`text-blue-600 hover:text-blue-900 ${actionLoading === quote.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === quote.id ? 'Processing...' : 'Complete'}
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditQuote(quote)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteQuote(quote.id)}
                          disabled={actionLoading === quote.id}
                          className={`text-red-600 hover:text-red-900 ${actionLoading === quote.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {actionLoading === quote.id ? 'Processing...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {quotes.filter(q => q.status === 'pending').length}
            </div>
            <div className="text-gray-600">Pending Quotes</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {quotes.filter(q => q.status === 'approved').length}
            </div>
            <div className="text-gray-600">Approved Quotes</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {quotes.filter(q => q.status === 'completed').length}
            </div>
            <div className="text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              ${quotes.reduce((sum, q) => sum + q.amount, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">Total Value</div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Quote Details Modal */}
      {showQuoteModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Quote Details</h3>
              <button 
                onClick={() => setShowQuoteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Customer:</label>
                <p className="text-sm text-gray-900">{selectedQuote.customerName}</p>
                <p className="text-xs text-gray-500">{selectedQuote.customerEmail}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Vendor:</label>
                <p className="text-sm text-gray-900">{selectedQuote.vendorName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Service:</label>
                <p className="text-sm text-gray-900">{selectedQuote.service}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Amount:</label>
                <p className="text-sm text-gray-900">${selectedQuote.amount.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedQuote.status)}`}>
                  {selectedQuote.status}
                </span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Request Date:</label>
                <p className="text-sm text-gray-900">{selectedQuote.requestDate}</p>
              </div>
              
              {selectedQuote.responseDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Response Date:</label>
                  <p className="text-sm text-gray-900">{selectedQuote.responseDate}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-700">Message:</label>
                <p className="text-sm text-gray-900">{selectedQuote.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowQuoteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowQuoteModal(false);
                  handleEditQuote(selectedQuote);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
