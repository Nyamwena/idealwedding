'use client';

import Link from 'next/link';
import { useVendorCredits } from '@/hooks/useVendorCredits';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

export default function VendorBillingHistoryPage() {
  const { transactions, loading } = useVendorCredits();

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      <main className="container-modern py-8">
        <VendorTopMenu />
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-gray-900">Credit & billing activity</h1>
            <Link href="/vendor/billing" className="btn-outline text-sm">
              ← Back to billing
            </Link>
          </div>
          <p className="mt-1 text-gray-600">
            All credit purchases and usage for your vendor account ({sorted.length} events).
          </p>
          {loading ? (
            <div className="mt-8 flex items-center text-gray-600">
              <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
              Loading…
            </div>
          ) : sorted.length === 0 ? (
            <div className="mt-6 rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-700">
              No transactions yet. Purchase credits from the billing page to get started.
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              {sorted.map((tx) => (
                <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                  <p className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount} credits
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
