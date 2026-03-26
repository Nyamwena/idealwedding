'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';

type CreditTx = {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'admin_add' | string;
  amount: number;
  description: string;
  timestamp: string;
  vendorId?: string;
  vendorName?: string | null;
  vendorEmail?: string | null;
  source?: string;
};

export default function AdminCreditLedgerPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CreditTx[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/credits/transactions');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to load ledger');
        setTransactions(result.data || []);
      } catch (error) {
        console.error('Failed to load credit ledger:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((tx) =>
      [tx.vendorName, tx.vendorEmail, tx.description, tx.type, tx.source, tx.vendorId]
        .map((v) => String(v || '').toLowerCase())
        .some((s) => s.includes(q)),
    );
  }, [transactions, query]);

  const totals = useMemo(() => {
    let added = 0;
    let used = 0;
    for (const tx of filtered) {
      if (Number(tx.amount) > 0) added += Number(tx.amount);
      if (Number(tx.amount) < 0) used += Math.abs(Number(tx.amount));
    }
    return { added, used };
  }, [filtered]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      <main className="container-modern py-16">
        <AdminBreadcrumb
          items={[
            { label: 'Admin Dashboard', href: '/admin' },
            { label: 'Credit Ledger', href: '/admin/credits' },
          ]}
        />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Credit Transaction Ledger</h1>
            <p className="text-gray-600">Audit all vendor credit additions, usage, and refunds.</p>
          </div>
          <Link href="/admin/vendors" className="btn-outline">
            Back to Vendors
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-gray-500 text-sm">Transactions</p>
            <p className="text-2xl font-semibold">{filtered.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-gray-500 text-sm">Credits Added</p>
            <p className="text-2xl font-semibold text-green-600">+{totals.added}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-gray-500 text-sm">Credits Used</p>
            <p className="text-2xl font-semibold text-red-600">-{totals.used}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by vendor, email, type, description..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading credit ledger...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No credit transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">When</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{tx.vendorName || tx.vendorId || 'Unknown'}</div>
                        <div className="text-gray-500">{tx.vendorEmail || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{tx.type}</td>
                      <td
                        className={`px-4 py-3 text-sm font-semibold ${
                          Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {Number(tx.amount) >= 0 ? '+' : ''}
                        {tx.amount}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{tx.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.source || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
