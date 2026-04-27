'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
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
  status:
    | 'draft'
    | 'sent'
    | 'accepted'
    | 'rejected'
    | 'expired'
    | 'requote_requested';
  amount: number;
  description: string;
  notes?: string;
  createdAt: string;
  sentAt?: string;
  expiresAt: string;
  quoteRequestId?: string;
}

export default function VendorQuotesPage() {
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
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [reviseTarget, setReviseTarget] = useState<VendorQuote | null>(null);
  const [reviseForm, setReviseForm] = useState({ amount: '', description: '', notes: '' });
  const [reviseSubmitting, setReviseSubmitting] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/quotes', { credentials: 'include' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch quotes');
      }
      const rows = (result.data || []) as any[];
      const normalized: VendorQuote[] = rows.map((q) => ({
        id: String(q.id),
        leadId: String(q.leadId || ''),
        coupleName: String(q.coupleName || ''),
        coupleEmail: String(q.coupleEmail || ''),
        serviceType: String(q.serviceType || ''),
        eventDate: String(q.eventDate || ''),
        location: String(q.location || ''),
        status: (q.status || 'draft') as VendorQuote['status'],
        amount: Number(q.amount || 0),
        description: String(q.description || ''),
        notes: q.notes ? String(q.notes) : undefined,
        createdAt: String(q.createdAt || new Date().toISOString()),
        sentAt: q.sentAt ? String(q.sentAt) : undefined,
        expiresAt: String(q.expiresAt || ''),
        quoteRequestId: q.quoteRequestId ? String(q.quoteRequestId) : undefined,
      }));
      setQuotes(normalized);
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      setQuotes([]);
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
      const amount = Number(newQuote.amount);
      if (!newQuote.leadId || !newQuote.description || !Number.isFinite(amount) || amount <= 0) {
        return;
      }
      const response = await fetch('/api/vendor/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          leadId: newQuote.leadId,
          amount,
          description: newQuote.description,
          notes: newQuote.notes || '',
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        console.error(result.error || 'Failed to create quote');
        return;
      }
      const q = result.data;
      const created: VendorQuote = {
        id: String(q.id),
        leadId: String(q.leadId || ''),
        coupleName: String(q.coupleName || ''),
        coupleEmail: String(q.coupleEmail || ''),
        serviceType: String(q.serviceType || ''),
        eventDate: String(q.eventDate || ''),
        location: String(q.location || ''),
        status: (q.status || 'draft') as VendorQuote['status'],
        amount: Number(q.amount || 0),
        description: String(q.description || ''),
        notes: q.notes ? String(q.notes) : undefined,
        createdAt: String(q.createdAt || new Date().toISOString()),
        sentAt: q.sentAt ? String(q.sentAt) : undefined,
        expiresAt: String(q.expiresAt || ''),
      };
      setQuotes((prev) => [created, ...prev]);
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

  const handleSendQuote = async (quote: VendorQuote) => {
    try {
      const action = quote.status === 'sent' ? 'resend' : 'send';
      const response = await fetch(`/api/vendor/quotes/${encodeURIComponent(quote.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to send quote');
      }
      setQuotes((prev) =>
        prev.map((row) =>
          row.id === quote.id
            ? {
                ...row,
                status: 'sent',
                sentAt: String(result?.data?.sentAt || new Date().toISOString()),
              }
            : row,
        ),
      );
    } catch (error) {
      console.error('Failed to send quote:', error);
    }
  };

  const openReviseModal = (quote: VendorQuote) => {
    setReviseTarget(quote);
    setReviseForm({
      amount: String(quote.amount),
      description: quote.description,
      notes: quote.notes || '',
    });
    setShowReviseModal(true);
  };

  const submitReviseAndResend = async () => {
    if (!reviseTarget) return;
    const amount = Number(reviseForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!reviseForm.description.trim()) {
      toast.error('Description is required');
      return;
    }
    setReviseSubmitting(true);
    try {
      const upRes = await fetch(`/api/vendor/quotes/${encodeURIComponent(reviseTarget.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'update',
          amount,
          description: reviseForm.description.trim(),
          notes: reviseForm.notes.trim(),
        }),
      });
      const upJson = await upRes.json().catch(() => ({}));
      if (!upRes.ok || !upJson?.success) {
        throw new Error(String(upJson?.error || 'Failed to save changes'));
      }
      const sendAction = reviseTarget.status === 'sent' ? 'resend' : 'send';
      const sendRes = await fetch(`/api/vendor/quotes/${encodeURIComponent(reviseTarget.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: sendAction }),
      });
      const sendJson = await sendRes.json().catch(() => ({}));
      if (!sendRes.ok || !sendJson?.success) {
        throw new Error(String(sendJson?.error || 'Failed to send to couple'));
      }
      toast.success('Revised quote sent to the couple');
      setShowReviseModal(false);
      setReviseTarget(null);
      await fetchQuotes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not revise quote');
    } finally {
      setReviseSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'requote_requested': return 'bg-purple-100 text-purple-800';
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
      case 'requote_requested': return '🔁';
      default: return '📋';
    }
  };


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
                  onClick={() => setSelectedStatus('requote_requested')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStatus === 'requote_requested'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Requote ({quotes.filter(q => q.status === 'requote_requested').length})
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
                            <button
                              onClick={() => handleSendQuote(quote)}
                              className="btn-outline btn-sm"
                            >
                              Send Quote
                            </button>
                          )}
                          {quote.status === 'sent' && (
                            <button
                              onClick={() => handleSendQuote(quote)}
                              className="btn-outline btn-sm"
                            >
                              Resend
                            </button>
                          )}
                          {quote.status === 'requote_requested' && (
                            <button
                              type="button"
                              onClick={() => openReviseModal(quote)}
                              className="btn-outline btn-sm text-purple-700 border-purple-300 hover:bg-purple-50"
                            >
                              Revise &amp; Resend
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
                
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 sm:justify-between sm:items-center">
                  {selectedQuote.status === 'requote_requested' && (
                    <button
                      type="button"
                      className="btn-primary btn-sm order-last sm:order-first"
                      onClick={() => {
                        openReviseModal(selectedQuote);
                        setShowQuoteModal(false);
                      }}
                    >
                      Revise &amp; Resend
                    </button>
                  )}
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

        {showReviseModal && reviseTarget && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-full items-end justify-center pt-4 px-4 pb-20 text-center sm:items-center sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden
                onClick={() => !reviseSubmitting && setShowReviseModal(false)}
              />
              <div className="relative z-10 inline-block w-full max-w-lg transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Revise quotation</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Update the details below, then we&apos;ll send the revised quote to {reviseTarget.coupleName}.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount ($) *</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        value={reviseForm.amount}
                        onChange={(e) => setReviseForm((f) => ({ ...f, amount: e.target.value }))}
                        disabled={reviseSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description *</label>
                      <textarea
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        value={reviseForm.description}
                        onChange={(e) => setReviseForm((f) => ({ ...f, description: e.target.value }))}
                        disabled={reviseSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                      <textarea
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        value={reviseForm.notes}
                        onChange={(e) => setReviseForm((f) => ({ ...f, notes: e.target.value }))}
                        disabled={reviseSubmitting}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Service: {reviseTarget.serviceType} · {reviseTarget.location} · event{' '}
                      {new Date(reviseTarget.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                  <button
                    type="button"
                    disabled={reviseSubmitting}
                    onClick={() => void submitReviseAndResend()}
                    className="btn-primary btn-sm w-full sm:w-auto"
                  >
                    {reviseSubmitting ? 'Sending…' : 'Save and send to couple'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline btn-sm w-full sm:w-auto"
                    disabled={reviseSubmitting}
                    onClick={() => setShowReviseModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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