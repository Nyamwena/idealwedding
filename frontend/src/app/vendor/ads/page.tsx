'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';
import { useAuth } from '@/hooks/useAuth';

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
};

export default function VendorAdsPage() {
  const { isVendor } = useAuth();
  const [ads, setAds] = useState<VendorAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    targetUrl: '',
    category: 'General',
    position: 'top',
    bidPerClick: 1,
    maxDailyBudget: 0,
  });

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/advertisements');
      const result = await response.json();
      if (response.ok) setAds(result.data || []);
      else setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVendor) load();
  }, [isVendor]);

  const createAd = async () => {
    const response = await fetch('/api/vendor/advertisements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      maxDailyBudget: 0,
    });
    await load();
  };

  if (!isVendor) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      <main className="container-modern py-8">
        <VendorTopMenu />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advertisement Bidding</h1>
            <p className="text-gray-600">Higher `bidPerClick` ranks your ad higher in top placements. Daily cap limits spend.</p>
          </div>
          <Link href="/vendor" className="btn-outline">Back</Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Ad title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <input className="border rounded px-3 py-2" placeholder="Target URL" value={form.targetUrl} onChange={(e) => setForm((p) => ({ ...p, targetUrl: e.target.value }))} />
          <input className="border rounded px-3 py-2" placeholder="Image URL (optional)" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
          <input className="border rounded px-3 py-2" placeholder="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
          <select className="border rounded px-3 py-2" value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}>
            <option value="top">top</option>
            <option value="sidebar">sidebar</option>
            <option value="bottom">bottom</option>
            <option value="popup">popup</option>
          </select>
          <input className="border rounded px-3 py-2" type="number" min={0.1} step={0.1} value={form.bidPerClick} onChange={(e) => setForm((p) => ({ ...p, bidPerClick: Number(e.target.value) || 0 }))} />
          <input className="border rounded px-3 py-2" type="number" min={0} step={1} placeholder="Max daily budget (0=unlimited)" value={form.maxDailyBudget} onChange={(e) => setForm((p) => ({ ...p, maxDailyBudget: Number(e.target.value) || 0 }))} />
          <button className="btn-primary md:col-span-4" onClick={createAd}>Create Ad Campaign</button>
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
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Daily Budget</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Spent</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">7-Day Click Trend</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td className="px-4 py-2">{ad.title}</td>
                    <td className="px-4 py-2">${Number(ad.bidPerClick || 0).toFixed(2)}</td>
                    <td className="px-4 py-2">{ad.clicks}</td>
                    <td className="px-4 py-2">
                      {Number(ad.maxDailyBudget || 0) > 0 ? (
                        <div>
                          <div>${Number(ad.maxDailyBudget).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            used ${Number(ad.dailySpent || 0).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        'Unlimited'
                      )}
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
                    <td className="px-4 py-2">{ad.status}</td>
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
