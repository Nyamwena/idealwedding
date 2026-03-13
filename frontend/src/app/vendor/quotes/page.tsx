'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

interface VendorQuote {
  id: string;
  leadId: string;
  coupleName: string;
  coupleEmail: string;
  serviceType: string;
  eventDate: string;
  location: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  amount: number;
  description: string;
  notes?: string;
  createdAt: string;
  sentAt?: string;
  expiresAt: string;
}

export default function VendorQuotesPage() {
  const { user,  isVendor } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<VendorQuote | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuote, setNewQuote] = useState({
    leadId: '',
    amount: '',
    description: '',
    notes: '',
  });



  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock quotes data
      const mockQuotes: VendorQuote[] = [
        {
          id: 'quote_001',
          leadId: 'lead_001',
          coupleName: 'Sarah & John',
          coupleEmail: 'sarah.john@email.com',
          serviceType: 'Wedding Photography',
          eventDate: '2024-12-15',
          location: 'New York, NY',
          status: 'sent',
          amount: 2500,
          description: 'Full day wedding photography package including ceremony and reception coverage, edited photos delivered within 4 weeks.',
          notes: 'Outdoor ceremony, indoor reception. Special request for sunset photos.',
          createdAt: '2024-09-20T10:30:00Z',
          sentAt: '2024-09-20T14:20:00Z',
          expiresAt: '2024-09-27T14:20:00Z',
        },
        {
          id: 'quote_002',
          leadId: 'lead_002',
          coupleName: 'Emily & Michael',
          coupleEmail: 'emily.michael@email.com',
          serviceType: 'Wedding Planning',
          eventDate: '2025-03-20',
          location: 'Los Angeles, CA',
          status: 'draft',
          amount: 5000,
          description: 'Full-service wedding planning package including venue coordination, vendor management, and day-of coordination.',
          notes: 'Full service planning package. Bride has specific vision for spring garden theme.',
          createdAt: '2024-09-24T09:15:00Z',
          expiresAt: '2024-10-01T09:15:00Z',
        },
        {
          id: 'quote_003',
          leadId: 'lead_003',
          coupleName: 'Jessica & David',
          coupleEmail: 'jessica.david@email.com',
          serviceType: 'Catering Services',
          eventDate: '2025-01-10',
          location: 'Chicago, IL',
          status: 'accepted',
          amount: 3000,
          description: 'Catering for 150 guests including appetizers, main course, dessert, and beverages.',
          notes: '150 guests, mix of traditional and modern cuisine. Some dietary restrictions noted.',
          createdAt: '2024-09-18T11:45:00Z',
          sentAt: '2024-09-18T16:30:00Z',
          expiresAt: '2024-09-25T16:30:00Z',
        },
        {
          id: 'quote_004',
          leadId: 'lead_004',
          coupleName: 'Amanda & Robert',
          coupleEmail: 'amanda.robert@email.com',
          serviceType: 'Floral Arrangements',
          eventDate: '2024-11-30',
          location: 'Miami, FL',
          status: 'rejected',
          amount: 1800,
          description: 'Beach wedding floral arrangements including bridal bouquet, centerpieces, and ceremony arch.',
          notes: 'Beach wedding, tropical theme preferred. Budget constraints mentioned.',
          createdAt: '2024-09-15T14:20:00Z',
          sentAt: '2024-09-15T18:45:00Z',
          expiresAt: '2024-09-22T18:45:00Z',
        },
      ];

      setQuotes(mockQuotes);
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = selectedStatus === 'all' 
    ? quotes 
    : quotes.filter(quote => quote.status === selectedStatus);

  const handleViewQuote = (quote: VendorQuote) => {
    setSelectedQuote(quote);
    setShowQuoteModal(true);
  };

  const handleCreateQuote = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newQuoteData: VendorQuote = {
        id: `quote_${Date.now()}`,
        leadId: newQuote.leadId,
        coupleName: 'New Couple',
        coupleEmail: 'new.couple@email.com',
        serviceType: 'Wedding Photography',
        eventDate: '2025-06-15',
        location: 'San Francisco, CA',
        status: 'draft',
        amount: parseInt(newQuote.amount),
        description: newQuote.description,
        notes: newQuote.notes,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      setQuotes(prev => [newQuoteData, ...prev]);
      setShowCreateModal(false);
      setNewQuote({
        leadId: '',
        amount: '',
        description: '',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to create quote:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '📤';
      case 'draft': return '📝';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      case 'expired': return '⏰';
      default: return '📋';
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
          { label: 'Quote Management', href: '/vendor/quotes' }
        ]} />
        
        <VendorTopMenu />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Quote <span className="gradient-text">Management</span></h1>
            <p className="text-gray-600 mt-2">Create and manage quotes for your potential clients</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary btn-md"
            >
              + Create Quote
            </button>
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
            <span className="ml-3 text-gray-600">Loading quotes...</span>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                    <p className="text-3xl font-bold text-gray-900">{quotes.length}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <span className="text-blue-600 text-xl">💬</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sent</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {quotes.filter(q => q.status === 'sent').length}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <span className="text-blue-600 text-xl">📤</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Accepted</p>
                    <p className="text-3xl font-bold text-green-600">
                      {quotes.filter(q => q.status === 'accepted').length}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <span className="text-green-600 text-xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-3xl font-bold text-purple-600">
                      ${quotes.reduce((sum, q) => sum + q.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <span className="text-purple-600 text-xl">💰</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStatus === 'all' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Quotes ({quotes.length})
                </button>
                <button
                  onClick={() => setSelectedStatus('draft')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStatus === 'draft' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Draft ({quotes.filter(q => q.status === 'draft').length})
                </button>
                <button
                  onClick={() => setSelectedStatus('sent')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStatus === 'sent' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sent ({quotes.filter(q => q.status === 'sent').length})
                </button>
                <button
                  onClick={() => setSelectedStatus('accepted')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStatus === 'accepted' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Accepted ({quotes.filter(q => q.status === 'accepted').length})
                </button>
              </div>
            </div>

            {/* Quotes List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedStatus === 'all' ? 'All Quotes' : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Quotes`}
                </h2>
              </div>
              
              {filteredQuotes.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredQuotes.map((quote) => (
                    <div key={quote.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{quote.coupleName}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                              {getStatusIcon(quote.status)} {quote.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Service Type</p>
                              <p className="font-medium text-gray-900">{quote.serviceType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Event Date</p>
                              <p className="font-medium text-gray-900">{new Date(quote.eventDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Amount</p>
                              <p className="font-medium text-gray-900">${quote.amount.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">Description</p>
                            <p className="text-gray-900">{quote.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>📧 {quote.coupleEmail}</span>
                              <span>📍 {quote.location}</span>
                              <span>⏰ Expires: {new Date(quote.expiresAt).toLocaleDateString()}</span>
                            </div>
                            <span>Created: {new Date(quote.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="ml-6 flex flex-col space-y-2">
                          <button
                            onClick={() => handleViewQuote(quote)}
                            className="btn-primary btn-sm"
                          >
                            View Details
                          </button>
                          {quote.status === 'draft' && (
                            <button className="btn-outline btn-sm">
                              Send Quote
                            </button>
                          )}
                          {quote.status === 'sent' && (
                            <button className="btn-outline btn-sm">
                              Resend
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">💬</span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
                  <p className="text-gray-600">
                    {selectedStatus === 'all' 
                      ? "You haven't created any quotes yet." 
                      : `No ${selectedStatus} quotes found.`}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Quote Detail Modal */}
        {showQuoteModal && selectedQuote && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Quote Details - {selectedQuote.coupleName}
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Service Type</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedQuote.serviceType}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Amount</label>
                            <p className="mt-1 text-sm text-gray-900">${selectedQuote.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Event Date</label>
                            <p className="mt-1 text-sm text-gray-900">{new Date(selectedQuote.eventDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedQuote.location}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-900">📧 {selectedQuote.coupleEmail}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedQuote.description}</p>
                        </div>
                        
                        {selectedQuote.notes && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedQuote.notes}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Current Status</label>
                            <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedQuote.status)}`}>
                              {getStatusIcon(selectedQuote.status)} {selectedQuote.status}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Expires</label>
                            <p className="mt-1 text-sm text-gray-900">{new Date(selectedQuote.expiresAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => setShowQuoteModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Quote Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Create New Quote
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Lead ID</label>
                          <input
                            type="text"
                            value={newQuote.leadId}
                            onChange={(e) => setNewQuote({...newQuote, leadId: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Enter lead ID"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Quote Amount ($)</label>
                          <input
                            type="number"
                            value={newQuote.amount}
                            onChange={(e) => setNewQuote({...newQuote, amount: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Enter quote amount"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea
                            value={newQuote.description}
                            onChange={(e) => setNewQuote({...newQuote, description: e.target.value})}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Describe the services included in this quote"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                          <textarea
                            value={newQuote.notes}
                            onChange={(e) => setNewQuote({...newQuote, notes: e.target.value})}
                            rows={2}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Additional notes or terms"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateQuote}
                      className="btn-primary btn-sm"
                    >
                      Create Quote
                    </button>
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => setShowCreateModal(false)}
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