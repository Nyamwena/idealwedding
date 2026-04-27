'use client';

import { useEffect, useMemo, useState } from 'react';

interface UserQuote {
  id: string;
  vendorName?: string;
  service?: string;
  serviceType?: string;
  serviceCategory?: string;
  amount?: number;
  status:
    | 'draft'
    | 'sent'
    | 'accepted'
    | 'rejected'
    | 'expired'
    | 'requote_requested'
    | string;
  eventDate?: string;
  weddingDate?: string;
  location?: string;
  description?: string;
  notes?: string;
  sentAt?: string;
  createdAt?: string;
}

type QuoteFilter =
  | 'all'
  | 'received'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'requote_requested'
  | 'draft';

export function UserQuotesManager() {
  const [quotes, setQuotes] = useState<UserQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<QuoteFilter>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/quotes', { credentials: 'include' });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to fetch quotations');
      }
      setQuotes(Array.isArray(result.data) ? (result.data as UserQuote[]) : []);
    } catch (err) {
      console.error('Failed to fetch user quotations:', err);
      setQuotes([]);
      setError(err instanceof Error ? err.message : 'Failed to load quotations.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteAction = async (
    quoteId: string,
    action: 'approve' | 'requote' | 'reject',
  ) => {
    setActionLoading(quoteId);
    setSuccessMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/user/quotes/${encodeURIComponent(quoteId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to update quote');
      }
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId
            ? {
                ...q,
                status:
                  action === 'approve'
                    ? 'accepted'
                    : action === 'requote'
                    ? 'requote_requested'
                    : 'rejected',
              }
            : q,
        ),
      );
      setSuccessMessage(
        action === 'approve'
          ? 'Quotation approved. Booking created under My Bookings.'
          : action === 'requote'
          ? 'Requote requested. Vendor can revise and resend.'
          : 'Quotation rejected.',
      );
    } catch (err) {
      console.error('Failed to update quotation:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quotation.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return quotes;
    if (statusFilter === 'received') {
      return quotes.filter((q) => String(q.status || '').toLowerCase() === 'sent');
    }
    return quotes.filter((q) => String(q.status || '').toLowerCase() === statusFilter);
  }, [quotes, statusFilter]);

  const countBy = (status: QuoteFilter) =>
    status === 'received'
      ? quotes.filter((q) => String(q.status || '').toLowerCase() === 'sent').length
      : quotes.filter((q) => String(q.status || '').toLowerCase() === status).length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <span className="ml-3 text-gray-600">Loading your quotations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900">My Quotations</h2>
        <p className="text-gray-600">Review, approve, or reject quotations sent by vendors.</p>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All ({quotes.length})
          </button>
          <button
            onClick={() => setStatusFilter('received')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === 'received' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Received ({countBy('received')})
          </button>
          <button
            onClick={() => setStatusFilter('accepted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === 'accepted' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Accepted ({countBy('accepted')})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Rejected ({countBy('rejected')})
          </button>
          <button
            onClick={() => setStatusFilter('requote_requested')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === 'requote_requested'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Requote ({countBy('requote_requested')})
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === 'expired' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Expired ({countBy('expired')})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filtered.map((quote) => {
              const rawStatus = String(quote.status || '').toLowerCase();
              const status = rawStatus === 'sent' ? 'received' : rawStatus;
              const displayDate = quote.eventDate || quote.weddingDate || quote.createdAt || '';
              return (
                <div key={quote.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-gray-900">
                          {quote.vendorName || 'Vendor'} -{' '}
                          {quote.serviceType || quote.service || 'Wedding Service'}
                        </p>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {status || 'unknown'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{quote.description || 'No description provided.'}</p>
                      <div className="mt-3 text-sm text-gray-600 flex flex-wrap gap-4">
                        <span>Amount: ${Number(quote.amount || 0).toLocaleString()}</span>
                        <span>Date: {displayDate ? new Date(displayDate).toLocaleDateString() : 'Not set'}</span>
                        <span>Location: {quote.location || 'Not set'}</span>
                      </div>
                    </div>
                    {rawStatus === 'sent' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleQuoteAction(quote.id, 'approve')}
                          disabled={actionLoading === quote.id}
                          className="btn-primary btn-sm"
                        >
                          {actionLoading === quote.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleQuoteAction(quote.id, 'requote')}
                          disabled={actionLoading === quote.id}
                          className="btn-outline btn-sm text-purple-700 border-purple-300 hover:bg-purple-50"
                        >
                          Requote Another
                        </button>
                        <button
                          onClick={() => handleQuoteAction(quote.id, 'reject')}
                          disabled={actionLoading === quote.id}
                          className="btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-600">No quotations found for this filter.</div>
        )}
      </div>
    </div>
  );
}
