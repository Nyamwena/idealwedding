'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

/** Aligned with couple “Get Quotes” form categories */
const QUOTE_SERVICE_CATEGORIES = [
  'Photography',
  'Catering',
  'Flowers',
  'Entertainment',
  'Venue',
  'Transportation',
  'Hair & Makeup',
  'Dress & Attire',
  'Decorations',
  'Other',
] as const;

interface OpenCoupleQuoteRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  category: string;
  description: string;
  budget: number;
  location: string;
  eventDate: string;
  guestCount?: number;
  specialRequirements?: string;
  createdAt: string;
  status: 'open';
}

type MyOpenQuote = {
  id: string;
  amount: number;
  description: string;
  notes: string;
};

export default function VendorOpenQuotesPage() {
  const [openCoupleRequests, setOpenCoupleRequests] = useState<OpenCoupleQuoteRequest[]>([]);
  const [myQuoteByRequestId, setMyQuoteByRequestId] = useState<Record<string, MyOpenQuote>>({});
  const [openRequestsLoading, setOpenRequestsLoading] = useState(true);
  const [respondTo, setRespondTo] = useState<OpenCoupleQuoteRequest | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [openResponse, setOpenResponse] = useState({ amount: '', description: '', notes: '' });
  const [sendingOpen, setSendingOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const loadAll = useCallback(async () => {
    setOpenRequestsLoading(true);
    try {
      const [reqRes, qRes] = await Promise.all([
        fetch('/api/vendor/quote-requests', { credentials: 'include' }),
        fetch('/api/vendor/quotes', { credentials: 'include', cache: 'no-store' }),
      ]);
      const reqJson = await reqRes.json();
      const qJson = await qRes.json();

      if (reqRes.ok && reqJson?.success && Array.isArray(reqJson.data)) {
        setOpenCoupleRequests(
          reqJson.data.map((r: any) => ({
            id: String(r.id),
            customerName: String(r.customerName || ''),
            customerEmail: String(r.customerEmail || ''),
            category: String(r.category || ''),
            description: String(r.description || ''),
            budget: Number(r.budget) || 0,
            location: String(r.location || ''),
            eventDate: String(r.eventDate || ''),
            guestCount: r.guestCount != null ? Number(r.guestCount) : undefined,
            specialRequirements: r.specialRequirements != null ? String(r.specialRequirements) : undefined,
            createdAt: String(r.createdAt || ''),
            status: 'open' as const,
          })),
        );
      } else {
        setOpenCoupleRequests([]);
      }

      const byReq: Record<string, MyOpenQuote> = {};
      if (qRes.ok && qJson?.success && Array.isArray(qJson.data)) {
        const latestByRid: Record<string, { q: any; t: number }> = {};
        for (const q of qJson.data as any[]) {
          const rid = String(q.quoteRequestId || '').trim();
          if (!rid) continue;
          const t = new Date(String(q.createdAt || 0)).getTime();
          const prev = latestByRid[rid];
          if (!prev || t >= prev.t) {
            latestByRid[rid] = { q, t };
          }
        }
        for (const rid of Object.keys(latestByRid)) {
          const q = latestByRid[rid].q;
          byReq[rid] = {
            id: String(q.id),
            amount: Number(q.amount) || 0,
            description: String(q.description || ''),
            notes: String(q.notes || ''),
          };
        }
        setMyQuoteByRequestId(byReq);
      } else {
        setMyQuoteByRequestId({});
      }
    } catch {
      setOpenCoupleRequests([]);
      setMyQuoteByRequestId({});
    } finally {
      setOpenRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const categorySelectOptions = useMemo(() => {
    const fromData = openCoupleRequests
      .map((r) => r.category?.trim())
      .filter((c): c is string => Boolean(c));
    const merged = new Set<string>([...QUOTE_SERVICE_CATEGORIES, ...fromData]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [openCoupleRequests]);

  const filteredRequests = useMemo(() => {
    return openCoupleRequests.filter((r) => {
      if (categoryFilter && r.category !== categoryFilter) {
        return false;
      }
      const q = categorySearch.trim().toLowerCase();
      if (q && !r.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [openCoupleRequests, categoryFilter, categorySearch]);

  const hasActiveFilters = Boolean(categoryFilter || categorySearch.trim());

  const openSendModal = (req: OpenCoupleQuoteRequest) => {
    setEditingQuoteId(null);
    setRespondTo(req);
    setOpenResponse({
      amount: String(
        Math.min(req.budget, Math.max(100, Math.round(req.budget * 0.4))) || '',
      ),
      description: `Quote for ${req.category} — as discussed for your event on ${req.eventDate || 'your date'}.`,
      notes: '',
    });
  };

  const openUpdateModal = (req: OpenCoupleQuoteRequest, my: MyOpenQuote) => {
    setEditingQuoteId(my.id);
    setRespondTo(req);
    setOpenResponse({
      amount: String(my.amount),
      description: my.description,
      notes: my.notes,
    });
  };

  const sendOrUpdateQuote = async () => {
    if (!respondTo) return;
    const amount = Number(openResponse.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !openResponse.description.trim()) {
      toast.error('Enter a valid amount and description.');
      return;
    }
    setSendingOpen(true);
    try {
      if (editingQuoteId) {
        const response = await fetch(`/api/vendor/quotes/${encodeURIComponent(editingQuoteId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'update',
            amount,
            description: openResponse.description.trim(),
            notes: openResponse.notes.trim(),
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          toast.error(String(result.error || 'Failed to update quote'));
          return;
        }
        toast.success('Quote updated');
      } else {
        const response = await fetch('/api/vendor/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            quoteRequestId: respondTo.id,
            amount,
            description: openResponse.description.trim(),
            notes: openResponse.notes.trim(),
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          toast.error(String(result.error || 'Failed to send quote'));
          return;
        }
        toast.success('Quotation sent');
      }
      setRespondTo(null);
      setEditingQuoteId(null);
      setOpenResponse({ amount: '', description: '', notes: '' });
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error('Something went wrong');
    } finally {
      setSendingOpen(false);
    }
  };

  const removeMyQuote = async (quoteId: string) => {
    if (!confirm('Remove your quotation for this request? The couple will no longer see it.')) {
      return;
    }
    try {
      const response = await fetch(`/api/vendor/quotes/${encodeURIComponent(quoteId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(String(result.error || 'Could not remove quote'));
        return;
      }
      toast.success('Quote removed');
      await loadAll();
    } catch {
      toast.error('Could not remove quote');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />

      <main className="container-modern py-8">
        <AdminBreadcrumb
          items={[
            { label: 'Vendor Dashboard', href: '/vendor' },
            { label: 'Open Quotes', href: '/vendor/open-quotes' },
          ]}
        />

        <VendorTopMenu />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Open <span className="gradient-text">Quotes</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Couple requests from <strong>Get Quotes</strong> on the wedding dashboard. Send your quotation; the
              request closes for all vendors when the couple approves a quote under <strong>My Quotations</strong>.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/vendor/quotes">
              <button type="button" className="btn-outline btn-md hover-lift">
                Quote management
              </button>
            </Link>
            <Link href="/vendor">
              <button type="button" className="btn-outline btn-md hover-lift">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Open couple quote requests</h2>
              <p className="text-sm text-gray-600 mt-1 max-w-3xl">
                Your status shows <strong>Open</strong> until you send a quote, then <strong>Quote</strong>. You can
                update or remove your quotation; the list stays for everyone until the couple approves one quotation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadAll()}
              className="btn-outline btn-sm shrink-0"
            >
              Refresh
            </button>
          </div>

          {!openRequestsLoading && openCoupleRequests.length > 0 && (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 sm:w-56">
                <label htmlFor="open-quote-category" className="block text-xs font-semibold text-gray-600 mb-1">
                  Service category
                </label>
                <select
                  id="open-quote-category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input w-full text-sm"
                >
                  <option value="">All categories</option>
                  {categorySelectOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1 sm:max-w-md">
                <label htmlFor="open-quote-search" className="block text-xs font-semibold text-gray-600 mb-1">
                  Search in category
                </label>
                <input
                  id="open-quote-search"
                  type="search"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="e.g. Photo, Entertain…"
                  className="input w-full text-sm"
                  autoComplete="off"
                />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('');
                    setCategorySearch('');
                  }}
                  className="btn-outline btn-sm self-start sm:mb-0.5"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {openRequestsLoading ? (
            <p className="text-sm text-gray-500 py-4">Loading open requests…</p>
          ) : openCoupleRequests.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">
              No open requests right now. When couples post a new quote need, it will show here.
            </p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              No requests match your category filters. Try <strong>All categories</strong> or clear the search.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const my = myQuoteByRequestId[req.id];
                return (
                  <div
                    key={req.id}
                    className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 flex flex-wrap items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{req.category}</p>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            my ? 'bg-primary-100 text-primary-800' : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {my ? 'Quote' : 'Open'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{req.description}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span>Budget: ${req.budget.toLocaleString()}</span>
                        <span>· {req.location}</span>
                        <span>· {req.eventDate ? new Date(req.eventDate).toLocaleDateString() : '—'}</span>
                        {req.guestCount != null && <span>· {req.guestCount} guests</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {req.customerName} · {req.customerEmail}
                      </p>
                      {req.specialRequirements && (
                        <p className="text-xs text-amber-900 mt-1">Note: {req.specialRequirements}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      {!my ? (
                        <button
                          type="button"
                          onClick={() => openSendModal(req)}
                          className="btn-primary btn-sm"
                        >
                          Send quotation
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openUpdateModal(req, my)}
                            className="btn-primary btn-sm"
                          >
                            Update quote
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeMyQuote(my.id)}
                            className="btn-outline btn-sm text-red-700 border-red-200 hover:bg-red-50"
                          >
                            Remove quote
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {respondTo && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center pt-4 px-4 pb-20 text-center sm:items-center sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden
                onClick={() => {
                  setRespondTo(null);
                  setEditingQuoteId(null);
                }}
              />
              <div className="relative z-10 inline-block w-full max-w-lg transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {editingQuoteId ? 'Update quote' : 'Send quotation'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    To {respondTo.customerName} · {respondTo.category} @ {respondTo.location}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount ($) *</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        value={openResponse.amount}
                        onChange={(e) => setOpenResponse((p) => ({ ...p, amount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description *</label>
                      <textarea
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        value={openResponse.description}
                        onChange={(e) => setOpenResponse((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                      <textarea
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        value={openResponse.notes}
                        onChange={(e) => setOpenResponse((p) => ({ ...p, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                  <button
                    type="button"
                    disabled={sendingOpen}
                    onClick={() => void sendOrUpdateQuote()}
                    className="btn-primary btn-sm w-full sm:w-auto"
                  >
                    {sendingOpen
                      ? 'Saving…'
                      : editingQuoteId
                        ? 'Save changes'
                        : 'Send to couple'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline btn-sm w-full sm:w-auto"
                    onClick={() => {
                      setRespondTo(null);
                      setEditingQuoteId(null);
                    }}
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
