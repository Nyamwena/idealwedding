'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

type VendorAd = {
  id: string;
  title: string;
  position: string;
  status: string;
  bidPerClick: number;
  clicks: number;
  impressions: number;
  totalSpent: number;
  maxDailyBudget?: number;
  dailySpent?: number;
  remainingDailyBudget?: number | null;
  targetUrl: string;
  category: string;
  performance?: Array<{ day: string; clicks: number; spend: number }>;
  canServePaidClick?: boolean;
  availableAdFunds?: number;
};

type AdFundsSummary = {
  balance: number;
  pendingBalance: number;
  totalAdded: number;
  totalSpent: number;
};

export default function VendorAdsPage() {
  const [ads, setAds] = useState<VendorAd[]>([]);
  const [adFunds, setAdFunds] = useState<AdFundsSummary>({
    balance: 0,
    pendingBalance: 0,
    totalAdded: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    targetUrl: '',
    category: 'General',
    position: 'top',
    bidPerClick: 1,
    maxDailyBudget: 10,
  });

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/advertisements', { credentials: 'include' });
      const result = await response.json();
      if (response.ok) {
        setAds(result.data || []);
        if (result.adFunds) {
          setAdFunds({
            balance: Number(result.adFunds.balance || 0),
            pendingBalance: Number(result.adFunds.pendingBalance || 0),
            totalAdded: Number(result.adFunds.totalAdded || 0),
            totalSpent: Number(result.adFunds.totalSpent || 0),
          });
        }
      } else {
        setAds([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createAd = async () => {
    const response = await fetch('/api/vendor/advertisements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      const result = await response.json();
      alert(result.error || 'Failed to create ad');
      return;
    }
    setForm({
      title: '',
      imageUrl: '',
      targetUrl: '',
      category: 'General',
      position: 'top',
      bidPerClick: 1,
      maxDailyBudget: 10,
    });
    await load();
    alert('Campaign submitted. An administrator must activate it before it runs. You will need ad funds for clicks.');
  };

  const servingLabel = (ad: VendorAd) => {
    const st = String(ad.status || '').toLowerCase();
    if (st === 'pending_review') {
      return <span className="font-medium text-amber-700">Pending admin approval</span>;
    }
    if (st !== 'active') {
      return <span className="text-gray-600">{ad.status}</span>;
    }
    if (ad.canServePaidClick) {
      return <span className="font-medium text-green-700">Live (funded)</span>;
    }
    if (adFunds.pendingBalance > 0) {
      return (
        <span className="font-medium text-amber-700">
          Not spending — some ad funds are still pending admin release
        </span>
      );
    }
    return (
      <span className="font-medium text-red-700">
        Not shown — approved ad balance too low or raise daily cap (contact admin to add funds)
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      <main className="container-modern py-8">
        <VendorTopMenu />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advertisement Bidding</h1>
            <p className="text-gray-600 mt-1">
              <strong>Advertising funds</strong> are separate from lead credits and are <strong>added by your
              administrator</strong>. Sponsored spots only run when an admin has activated your campaign, your bid and
              daily budget are set, and your ad wallet has enough approved balance for clicks.
            </p>
          </div>
          <Link href="/vendor" className="btn-outline">
            Back
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 rounded-xl border border-primary-200 bg-white p-4 shadow">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Ad wallet</h2>
            <p className="text-sm text-gray-600 mt-1">
              Clicks charge your <strong>approved</strong> balance only. Request top-ups from your administrator.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <div className="text-xs text-gray-500">Approved balance</div>
                <div className="text-2xl font-bold text-primary-700">${adFunds.balance.toFixed(2)}</div>
              </div>
              {adFunds.pendingBalance > 0 && (
                <div>
                  <div className="text-xs text-amber-700">Pending approval</div>
                  <div className="text-xl font-semibold text-amber-800">${adFunds.pendingBalance.toFixed(2)}</div>
                </div>
              )}
              <div className="text-sm text-gray-500">
                Lifetime approved top-ups ${adFunds.totalAdded.toFixed(2)} · Spent ${adFunds.totalSpent.toFixed(2)}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-4 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
              Need more budget? Contact your Ideal Weddings administrator — vendors cannot add ad funds from this
              dashboard.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <strong>Admin review:</strong> New and edited campaigns stay in <em>pending review</em> until an admin
            activates them. <strong>Ad wallet credits</strong> are issued by an administrator. Lead credits are not
            used for ads.
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Ad title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Target URL"
            value={form.targetUrl}
            onChange={(e) => setForm((p) => ({ ...p, targetUrl: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Image URL (optional)"
            value={form.imageUrl}
            onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          />
          <select
            className="border rounded px-3 py-2"
            value={form.position}
            onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
          >
            <option value="top">top</option>
            <option value="sidebar">sidebar</option>
            <option value="bottom">bottom</option>
            <option value="popup">popup</option>
          </select>
          <input
            className="border rounded px-3 py-2"
            type="number"
            min={0.1}
            step={0.1}
            value={form.bidPerClick}
            onChange={(e) => setForm((p) => ({ ...p, bidPerClick: Number(e.target.value) || 0 }))}
          />
          <input
            className="border rounded px-3 py-2"
            type="number"
            min={1}
            step={1}
            placeholder="Daily budget (min = bid)"
            value={form.maxDailyBudget}
            onChange={(e) => setForm((p) => ({ ...p, maxDailyBudget: Number(e.target.value) || 0 }))}
          />
          <button className="btn-primary md:col-span-4" onClick={createAd}>
            Submit campaign for review
          </button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6">Loading ads...</div>
          ) : ads.length === 0 ? (
            <div className="p-6 text-gray-600">No ad campaigns yet.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Title</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Bid/Click</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Clicks</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Daily budget</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Spent</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">7d trend</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Sponsored</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td className="px-4 py-2">{ad.title}</td>
                    <td className="px-4 py-2">${Number(ad.bidPerClick || 0).toFixed(2)}</td>
                    <td className="px-4 py-2">{ad.clicks}</td>
                    <td className="px-4 py-2">
                      <div>${Number(ad.maxDailyBudget || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        used ${Number(ad.dailySpent || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-2">${Number(ad.totalSpent || 0).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-end gap-1 h-10">
                        {(ad.performance || []).map((p) => (
                          <div
                            key={p.day}
                            title={`${p.day}: ${p.clicks} clicks`}
                            className="w-2 bg-blue-400 rounded-sm"
                            style={{ height: `${Math.max(4, Math.min(36, p.clicks * 6))}px` }}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">{ad.status}</td>
                    <td className="px-4 py-2 text-sm">{servingLabel(ad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
