'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface BannerAd {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  position: 'top' | 'sidebar' | 'bottom' | 'popup';
  status: 'active' | 'inactive' | 'scheduled';
  startDate: string;
  endDate: string;
  clicks: number;
  impressions: number;
  ctr: number; // Click-through rate
  cost: number;
  advertiser: string;
  advertiserEmail?: string;
  category: string;
  vendorId?: string;
  vendorUserId?: string;
  bidPerClick?: number;
  totalSpent?: number;
  maxDailyBudget?: number;
}

interface AdSenseConfig {
  enabled: boolean;
  clientId: string;
  publisherId?: string;
  testMode?: boolean;
  adSlots: {
    header: string;
    sidebar: string;
    footer: string;
    content: string;
  };
  revenue: number;
  impressions: number;
  clicks: number;
  adsTxtSnippet?: string;
  scriptTag?: string;
}

interface FraudAuditData {
  totals: {
    blockedAllTime: number;
    blockedLast24h: number;
  };
  topFingerprints: Array<{ key: string; count: number }>;
  topIps: Array<{ key: string; count: number }>;
  byReason: Array<{ key: string; count: number }>;
  recentBlocked: Array<{
    id: string;
    adId: string;
    vendorId: string;
    ip: string;
    fingerprint: string;
    reason: string;
    timestamp: string;
  }>;
  activeBlocks: Array<{
    id: string;
    type: 'ip' | 'fingerprint';
    value: string;
    reason: string;
    createdAt: string;
    expiresAt: string;
  }>;
}

export default function AdminAdsPage() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [bannerAds, setBannerAds] = useState<BannerAd[]>([]);
  const [adSenseConfig, setAdSenseConfig] = useState<AdSenseConfig>({
    enabled: false,
    clientId: '',
    adSlots: {
      header: '',
      sidebar: '',
      footer: '',
      content: ''
    },
    publisherId: '',
    testMode: true,
    adsTxtSnippet: '',
    scriptTag: '',
    revenue: 0,
    impressions: 0,
    clicks: 0
  });
  const [fraudAudit, setFraudAudit] = useState<FraudAuditData>({
    totals: { blockedAllTime: 0, blockedLast24h: 0 },
    topFingerprints: [],
    topIps: [],
    byReason: [],
    recentBlocked: [],
    activeBlocks: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdModal, setShowAdModal] = useState(false);
  const [showAdSenseModal, setShowAdSenseModal] = useState(false);
  const [showAddAdModal, setShowAddAdModal] = useState(false);
  const [showEditAdModal, setShowEditAdModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<BannerAd | null>(null);
  const [editingAd, setEditingAd] = useState<BannerAd | null>(null);
  const [newAd, setNewAd] = useState({
    title: '',
    imageUrl: '',
    targetUrl: '',
    position: 'top' as 'top' | 'sidebar' | 'bottom' | 'popup',
    status: 'active' as 'active' | 'inactive' | 'scheduled',
    startDate: '',
    endDate: '',
    cost: 0,
    maxDailyBudget: 0,
    advertiser: '',
    category: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if ( !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin,  router]);

  useEffect(() => {
    if (isAdmin) {
      loadAdvertisementData();
    }
  }, [isAdmin]);

  const loadAdvertisementData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load banner ads
      const adsResponse = await fetch('/api/admin/advertisements?type=bannerAds');
      const adsResult = await adsResponse.json();
      
      if (!adsResponse.ok) {
        throw new Error(adsResult.error || 'Failed to load banner ads');
      }
      
      setBannerAds(adsResult.data || []);
      
      // Load AdSense config
      const configResponse = await fetch('/api/admin/advertisements?type=adSenseConfig');
      const configResult = await configResponse.json();
      
      if (!configResponse.ok) {
        throw new Error(configResult.error || 'Failed to load AdSense config');
      }
      
      setAdSenseConfig(configResult.data || {
        enabled: false,
        clientId: '',
        adSlots: { header: '', sidebar: '', footer: '', content: '' },
        revenue: 0,
        impressions: 0,
        clicks: 0
      });

      const fraudResponse = await fetch('/api/admin/advertisements?type=fraudAudit');
      const fraudResult = await fraudResponse.json();
      if (!fraudResponse.ok) {
        throw new Error(fraudResult.error || 'Failed to load fraud audit');
      }
      setFraudAudit(fraudResult.data || {
        totals: { blockedAllTime: 0, blockedLast24h: 0 },
        topFingerprints: [],
        topIps: [],
        byReason: [],
        recentBlocked: [],
        activeBlocks: [],
      });
      
    } catch (error) {
      console.error('Error loading advertisement data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load advertisement data');
      // Set default values to prevent crashes
      setBannerAds([]);
      setAdSenseConfig({
        enabled: false,
        clientId: '',
        adSlots: { header: '', sidebar: '', footer: '', content: '' },
        revenue: 0,
        impressions: 0,
        clicks: 0
      });
      setFraudAudit({
        totals: { blockedAllTime: 0, blockedLast24h: 0 },
        topFingerprints: [],
        topIps: [],
        byReason: [],
        recentBlocked: [],
        activeBlocks: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const filteredAds = bannerAds.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.advertiser.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      scheduled: 'bg-yellow-100 text-yellow-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getPositionBadge = (position: string) => {
    const styles = {
      top: 'bg-blue-100 text-blue-800',
      sidebar: 'bg-purple-100 text-purple-800',
      bottom: 'bg-orange-100 text-orange-800',
      popup: 'bg-pink-100 text-pink-800'
    };
    return styles[position as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const handleAdAction = async (adId: string, action: string) => {
    try {
      setActionLoading(`${adId}-${action}`);
      
      let newStatus = '';
      switch (action) {
        case 'activate':
          newStatus = 'active';
          break;
        case 'deactivate':
          newStatus = 'inactive';
          break;
        case 'schedule':
          newStatus = 'scheduled';
          break;
        default:
          return;
      }
      
      const response = await fetch(`/api/admin/advertisements/${adId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'update_status',
          status: newStatus
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update ad');
      }
      
      // Reload ads to get updated data
      await loadAdvertisementData();
      
    } catch (error) {
      console.error('Error updating ad:', error);
      setError(error instanceof Error ? error.message : 'Failed to update ad');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewAd = (ad: BannerAd) => {
    setSelectedAd(ad);
    setShowAdModal(true);
  };

  const handleEditAd = (ad: BannerAd) => {
    setEditingAd(ad);
    setShowEditAdModal(true);
  };

  const handleUpdateAd = async () => {
    if (!editingAd) return;
    
    try {
      setActionLoading(`edit-${editingAd.id}`);
      setError(null);
      setSuccessMessage(null);
      
      const response = await fetch(`/api/admin/advertisements/${editingAd.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_details',
          ...editingAd
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update banner ad');
      }
      
      // Reload ads to get updated data
      await loadAdvertisementData();
      
      // Show success message
      setSuccessMessage('Banner ad updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Close modal
      setShowEditAdModal(false);
      setEditingAd(null);
      
    } catch (error) {
      console.error('Error updating ad:', error);
      setError(error instanceof Error ? error.message : 'Failed to update banner ad');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAd = async () => {
    try {
      setActionLoading('create-ad');
      setError(null);
      setSuccessMessage(null);
      
      const response = await fetch('/api/admin/advertisements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'bannerAd',
          bidPerClick: newAd.cost,
          ...newAd
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create banner ad');
      }
      
      // Reload ads to get updated data
      await loadAdvertisementData();
      
      // Show success message
      setSuccessMessage('Banner ad created successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Reset form and close modal
      setNewAd({
        title: '',
        imageUrl: '',
        targetUrl: '',
        position: 'top',
        status: 'active',
        startDate: '',
        endDate: '',
        cost: 0,
        maxDailyBudget: 0,
        advertiser: '',
        category: ''
      });
      setShowAddAdModal(false);
      
    } catch (error) {
      console.error('Error creating ad:', error);
      setError(error instanceof Error ? error.message : 'Failed to create banner ad');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveAdSenseConfig = async () => {
    try {
      setActionLoading('save-adsense');
      const response = await fetch('/api/admin/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'adSenseConfig',
          ...adSenseConfig,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save AdSense config');
      }
      setAdSenseConfig(result.data);
      setSuccessMessage('AdSense configuration saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
      setShowAdSenseModal(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save AdSense config');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualBlock = async (sourceType: 'ip' | 'fingerprint', value: string) => {
    if (!value || value === 'unknown') return;
    try {
      setActionLoading(`block-${sourceType}-${value}`);
      setError(null);
      const response = await fetch('/api/admin/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blockClickSource',
          sourceType,
          value,
          durationHours: 24,
          reason: 'manual_admin_block',
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to block source');
      }
      setSuccessMessage(`${sourceType === 'ip' ? 'IP' : 'Fingerprint'} blocked for 24 hours.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadAdvertisementData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to block click source');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualUnblock = async (blockId: string) => {
    if (!blockId) return;
    try {
      setActionLoading(`unblock-${blockId}`);
      setError(null);
      const response = await fetch('/api/admin/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'unblockClickSource',
          blockId,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to unblock source');
      }
      setSuccessMessage('Click source unblocked successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadAdvertisementData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unblock click source');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advertisements...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advertisement Management</h1>
            <p className="text-gray-600">Manage banner ads and Google AdSense integration</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowAddAdModal(true)}
              className="btn-primary"
            >
              + Add Banner Ad
            </button>
            <button 
              onClick={() => setShowAdSenseModal(true)}
              className="btn-secondary"
            >
              Configure AdSense
            </button>
            <button
              onClick={loadAdvertisementData}
              disabled={loading}
              className={`btn-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <Link href="/admin" className="btn-outline">
              ← Back to Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">❌</div>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">✅</div>
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              ${adSenseConfig.revenue.toLocaleString()}
            </div>
            <div className="text-gray-600">AdSense Revenue</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {bannerAds.reduce((sum, ad) => sum + ad.cost, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">Banner Ad Revenue</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {adSenseConfig.impressions.toLocaleString()}
            </div>
            <div className="text-gray-600">Total Impressions</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {adSenseConfig.clicks.toLocaleString()}
            </div>
            <div className="text-gray-600">Total Clicks</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Ads</label>
              <input
                type="text"
                placeholder="Search by title, advertiser, or category..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fraud Click Audit */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Fraud Click Audit</h2>
            <span className="text-sm text-gray-500">Last 24h + recent history</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="text-xs uppercase text-red-700">Blocked (24h)</div>
              <div className="text-2xl font-bold text-red-800">{fraudAudit.totals.blockedLast24h}</div>
            </div>
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
              <div className="text-xs uppercase text-orange-700">Blocked (All Time)</div>
              <div className="text-2xl font-bold text-orange-800">{fraudAudit.totals.blockedAllTime}</div>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <div className="text-xs uppercase text-gray-700">Top Reason</div>
              <div className="text-lg font-semibold text-gray-900">
                {fraudAudit.byReason[0] ? `${fraudAudit.byReason[0].key} (${fraudAudit.byReason[0].count})` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Top IPs (24h)</h3>
              <div className="space-y-1">
                {fraudAudit.topIps.slice(0, 5).map((item) => (
                  <div key={item.key} className="text-sm text-gray-700 flex justify-between">
                    <span className="truncate mr-3">{item.key || 'unknown'}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
                {fraudAudit.topIps.length === 0 && <div className="text-sm text-gray-500">No blocked clicks.</div>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Top Fingerprints (24h)</h3>
              <div className="space-y-1">
                {fraudAudit.topFingerprints.slice(0, 5).map((item) => (
                  <div key={item.key} className="text-sm text-gray-700 flex justify-between">
                    <span className="truncate mr-3">{item.key || 'unknown'}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
                {fraudAudit.topFingerprints.length === 0 && <div className="text-sm text-gray-500">No blocked clicks.</div>}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Active Manual Blocks</h3>
            <div className="space-y-1">
              {fraudAudit.activeBlocks.slice(0, 10).map((b) => (
                <div key={b.id} className="text-sm text-gray-700 flex items-center justify-between gap-3">
                  <span className="truncate">{b.type}: {b.value}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-500">until {new Date(b.expiresAt).toLocaleString()}</span>
                    <button
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      disabled={actionLoading === `unblock-${b.id}`}
                      onClick={() => handleManualUnblock(b.id)}
                    >
                      {actionLoading === `unblock-${b.id}` ? 'Unblocking...' : 'Unblock Now'}
                    </button>
                  </div>
                </div>
              ))}
              {fraudAudit.activeBlocks.length === 0 && <div className="text-sm text-gray-500">No active manual blocks.</div>}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent Blocked Attempts</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Time</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Ad</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">IP</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Reason</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fraudAudit.recentBlocked.slice(0, 10).map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 text-xs text-gray-700">{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{row.adId}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{row.ip || 'unknown'}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{row.reason}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            disabled={!row.ip || row.ip === 'unknown' || Boolean(actionLoading)}
                            onClick={() => handleManualBlock('ip', row.ip)}
                          >
                            Block IP 24h
                          </button>
                          <button
                            className="text-purple-600 hover:text-purple-800 disabled:opacity-50"
                            disabled={!row.fingerprint || Boolean(actionLoading)}
                            onClick={() => handleManualBlock('fingerprint', row.fingerprint)}
                          >
                            Block Fingerprint 24h
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fraudAudit.recentBlocked.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-500" colSpan={5}>
                        No blocked click attempts recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Banner Ads Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Banner Advertisements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bid / Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advertiser
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                          <span className="text-gray-500 text-sm">📢</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ad.title}
                          </div>
                          <div className="text-sm text-gray-500">{ad.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionBadge(ad.position)}`}>
                        {ad.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(ad.status)}`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ad.clicks} clicks
                      </div>
                      <div className="text-xs text-gray-500">
                        {ad.impressions} impressions ({ad.ctr}% CTR)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${Number(ad.bidPerClick || ad.cost || 0).toFixed(2)}/click
                      <div className="text-xs text-gray-500">
                        Spent: ${Number(ad.totalSpent || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ad.advertiser}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewAd(ad)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                        {ad.status === 'inactive' && (
                          <button 
                            onClick={() => handleAdAction(ad.id, 'activate')}
                            disabled={actionLoading === `${ad.id}-activate`}
                            className={`text-green-600 hover:text-green-900 ${actionLoading === `${ad.id}-activate` ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === `${ad.id}-activate` ? 'Activating...' : 'Activate'}
                          </button>
                        )}
                        {ad.status === 'active' && (
                          <button 
                            onClick={() => handleAdAction(ad.id, 'deactivate')}
                            disabled={actionLoading === `${ad.id}-deactivate`}
                            className={`text-red-600 hover:text-red-900 ${actionLoading === `${ad.id}-deactivate` ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === `${ad.id}-deactivate` ? 'Deactivating...' : 'Deactivate'}
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditAd(ad)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Google AdSense Configuration */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Google AdSense Configuration</h2>
            <div className="flex items-center">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                adSenseConfig.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {adSenseConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Ad Slots Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Header Ad Slot</label>
                  <input 
                    type="text" 
                    value={adSenseConfig.adSlots.header}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sidebar Ad Slot</label>
                  <input 
                    type="text" 
                    value={adSenseConfig.adSlots.sidebar}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Footer Ad Slot</label>
                  <input 
                    type="text" 
                    value={adSenseConfig.adSlots.footer}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content Ad Slot</label>
                  <input 
                    type="text" 
                    value={adSenseConfig.adSlots.content}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    readOnly
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Revenue:</span>
                  <span className="text-sm font-medium text-gray-900">${adSenseConfig.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Impressions:</span>
                  <span className="text-sm font-medium text-gray-900">{adSenseConfig.impressions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Clicks:</span>
                  <span className="text-sm font-medium text-gray-900">{adSenseConfig.clicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Click-through Rate:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {adSenseConfig.impressions > 0 ? ((adSenseConfig.clicks / adSenseConfig.impressions) * 100).toFixed(2) : '0.00'}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Banner Ad Modal */}
        {showAddAdModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6" id="modal-title">
                        Add New Banner Advertisement
                      </h3>
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Title *</label>
                            <input 
                              type="text" 
                              value={newAd.title}
                              onChange={(e) => setNewAd(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter ad title"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser *</label>
                            <input 
                              type="text" 
                              value={newAd.advertiser}
                              onChange={(e) => setNewAd(prev => ({ ...prev, advertiser: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter advertiser name"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <input 
                              type="text" 
                              value={newAd.category}
                              onChange={(e) => setNewAd(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="e.g., Photography, Floral, Venues"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($) *</label>
                            <input 
                              type="number" 
                              value={newAd.cost}
                              onChange={(e) => setNewAd(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Used as bid per click for ranking and charges.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Daily Budget ($)</label>
                            <input
                              type="number"
                              value={newAd.maxDailyBudget}
                              onChange={(e) => setNewAd(prev => ({ ...prev, maxDailyBudget: parseFloat(e.target.value) || 0 }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="0 = unlimited"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                          <input 
                            type="url" 
                            value={newAd.imageUrl}
                            onChange={(e) => setNewAd(prev => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="https://example.com/image.jpg"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Target URL *</label>
                          <input 
                            type="url" 
                            value={newAd.targetUrl}
                            onChange={(e) => setNewAd(prev => ({ ...prev, targetUrl: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="https://example.com/landing-page"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                            <select 
                              value={newAd.position}
                              onChange={(e) => setNewAd(prev => ({ ...prev, position: e.target.value as any }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            >
                              <option value="top">Top</option>
                              <option value="sidebar">Sidebar</option>
                              <option value="bottom">Bottom</option>
                              <option value="popup">Popup</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                            <select 
                              value={newAd.status}
                              onChange={(e) => setNewAd(prev => ({ ...prev, status: e.target.value as any }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="scheduled">Scheduled</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                            <input 
                              type="date" 
                              value={newAd.startDate}
                              onChange={(e) => setNewAd(prev => ({ ...prev, startDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                          <input 
                            type="date" 
                            value={newAd.endDate}
                            onChange={(e) => setNewAd(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleCreateAd}
                    disabled={actionLoading === 'create-ad'}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm ${actionLoading === 'create-ad' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {actionLoading === 'create-ad' ? 'Creating...' : 'Create Banner Ad'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setShowAddAdModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Banner Ad Modal */}
        {showEditAdModal && editingAd && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6" id="modal-title">
                        Edit Banner Advertisement - {editingAd.title}
                      </h3>
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Title *</label>
                            <input 
                              type="text" 
                              value={editingAd.title}
                              onChange={(e) => setEditingAd(prev => prev ? { ...prev, title: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter ad title"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser *</label>
                            <input 
                              type="text" 
                              value={editingAd.advertiser}
                              onChange={(e) => setEditingAd(prev => prev ? { ...prev, advertiser: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter advertiser name"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <input 
                              type="text" 
                              value={editingAd.category}
                              onChange={(e) => setEditingAd(prev => prev ? { ...prev, category: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="e.g., Photography, Floral, Venues"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($) *</label>
                            <input 
                              type="number" 
                              value={editingAd.cost}
                              onChange={(e) => setEditingAd(prev => prev ? { ...prev, cost: parseFloat(e.target.value) || 0 } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Used as bid per click for ranking and charges.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Daily Budget ($)</label>
                            <input
                              type="number"
                              value={Number(editingAd.maxDailyBudget || 0)}
                              onChange={(e) => setEditingAd(prev => prev ? ({ ...prev, maxDailyBudget: parseFloat(e.target.value) || 0 }) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="0 = unlimited"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                          <input 
                            type="url" 
                            value={editingAd.imageUrl}
                            onChange={(e) => setEditingAd(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="https://example.com/image.jpg"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Target URL *</label>
                          <input 
                            type="url" 
                            value={editingAd.targetUrl}
                            onChange={(e) => setEditingAd(prev => prev ? { ...prev, targetUrl: e.target.value } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="https://example.com/landing-page"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                            <select 
                              value={editingAd.position}
                              onChange={(e) => setEditingAd(prev => prev ? { ...prev, position: e.target.value as any } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            >
                              <option value="top">Top</option>
                              <option value="sidebar">Sidebar</option>
                              <option value="bottom">Bottom</option>
                              <option value="popup">Popup</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                            <select 
                              value={editingAd.status}
                              onChange={(e) => setEditingAd(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="scheduled">Scheduled</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                            <input 
                              type="date" 
                              value={editingAd.startDate}
                              onChange={(e) => setEditingAd(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                          <input 
                            type="date" 
                            value={editingAd.endDate}
                            onChange={(e) => setEditingAd(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Clicks</label>
                            <input 
                              type="number" 
                              value={editingAd.clicks}
                              onChange={(e) => setEditingAd(prev => prev ? { ...prev, clicks: parseInt(e.target.value) || 0 } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Impressions</label>
                            <input 
                              type="number" 
                              value={editingAd.impressions}
                              onChange={(e) => setEditingAd(prev => prev ? { ...prev, impressions: parseInt(e.target.value) || 0 } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CTR (%)</label>
                            <input 
                              type="number" 
                              value={editingAd.ctr}
                              onChange={(e) => setEditingAd(prev => prev ? { ...prev, ctr: parseFloat(e.target.value) || 0 } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleUpdateAd}
                    disabled={actionLoading === `edit-${editingAd.id}`}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm ${actionLoading === `edit-${editingAd.id}` ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {actionLoading === `edit-${editingAd.id}` ? 'Updating...' : 'Update Banner Ad'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setShowEditAdModal(false);
                      setEditingAd(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ad Detail Modal */}
        {showAdModal && selectedAd && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6" id="modal-title">
                        Ad Details - {selectedAd.title}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Ad Information</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Title:</span> {selectedAd.title}</p>
                            <p><span className="font-medium">Advertiser:</span> {selectedAd.advertiser}</p>
                            <p><span className="font-medium">Category:</span> {selectedAd.category}</p>
                            <p><span className="font-medium">Position:</span> {selectedAd.position}</p>
                            <p><span className="font-medium">Status:</span> {selectedAd.status}</p>
                            <p><span className="font-medium">Target URL:</span> {selectedAd.targetUrl}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Performance & Dates</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Clicks:</span> {selectedAd.clicks}</p>
                            <p><span className="font-medium">Impressions:</span> {selectedAd.impressions}</p>
                            <p><span className="font-medium">CTR:</span> {selectedAd.ctr}%</p>
                            <p><span className="font-medium">Cost:</span> ${selectedAd.cost}</p>
                            <p><span className="font-medium">Start Date:</span> {selectedAd.startDate}</p>
                            <p><span className="font-medium">End Date:</span> {selectedAd.endDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowAdModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AdSense Configuration Modal */}
        {showAdSenseModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6" id="modal-title">
                        Google AdSense Configuration
                      </h3>
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Publisher ID</label>
                          <input 
                            type="text" 
                            value={adSenseConfig.publisherId || ''}
                            onChange={(e) => setAdSenseConfig(prev => ({ ...prev, publisherId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., 1234567890123456"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                          <input 
                            type="text" 
                            value={adSenseConfig.clientId}
                            onChange={(e) => setAdSenseConfig(prev => ({ ...prev, clientId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Header Ad Slot</label>
                            <input 
                              type="text" 
                              value={adSenseConfig.adSlots.header}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sidebar Ad Slot</label>
                            <input 
                              type="text" 
                              value={adSenseConfig.adSlots.sidebar}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Ad Slot</label>
                            <input 
                              type="text" 
                              value={adSenseConfig.adSlots.footer}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content Ad Slot</label>
                            <input 
                              type="text" 
                              value={adSenseConfig.adSlots.content}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={adSenseConfig.enabled}
                            onChange={(e) => setAdSenseConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Enable Google AdSense
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={Boolean(adSenseConfig.testMode)}
                            onChange={(e) => setAdSenseConfig(prev => ({ ...prev, testMode: e.target.checked }))}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Test mode (safe while integrating)
                          </label>
                        </div>
                        {adSenseConfig.scriptTag && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Script Tag</label>
                            <textarea
                              value={adSenseConfig.scriptTag}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs h-20"
                            />
                          </div>
                        )}
                        {adSenseConfig.adsTxtSnippet && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ads.txt snippet</label>
                            <textarea
                              value={adSenseConfig.adsTxtSnippet}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs h-16"
                            />
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleSaveAdSenseConfig}
                    disabled={actionLoading === 'save-adsense'}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {actionLoading === 'save-adsense' ? 'Saving...' : 'Save Configuration'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setShowAdSenseModal(false)}
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
