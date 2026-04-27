'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { postAdvertisementClick } from '@/lib/recordAdvertisementClick';
import { hasSponsoredClickPaid, markSponsoredClickPaid } from '@/lib/sponsoredSession';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useUserData';

type PublicAd = {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  category: string;
  advertiser: string;
  advertiserEmail: string;
  vendorId: string;
  vendorUserId?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  description: string;
  serving: boolean;
};

type VendorPublic = {
  id: string;
  businessName: string;
  description: string;
  logo: string;
  portfolio: Array<{
    id: string;
    title: string;
    imageUrl?: string;
    url?: string;
    description: string;
  }>;
  contactInfo: { email: string; phone: string; website: string };
};

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function SponsoredAdPage() {
  const params = useParams();
  const adId = params.adId as string;
  const { user } = useAuth();
  const { weddingDetails } = useUserData();

  const [ad, setAd] = useState<PublicAd | null>(null);
  const [vendor, setVendor] = useState<VendorPublic | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteBudget, setQuoteBudget] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteSpecialRequirements, setQuoteSpecialRequirements] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/advertisements/${encodeURIComponent(adId)}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Ad not found');
        }
        if (!cancelled) setAd(json.data as PublicAd);
      } catch (e) {
        if (!cancelled) {
          setAd(null);
          setLoadError(e instanceof Error ? e.message : 'Could not load this ad');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adId]);

  useEffect(() => {
    if (!ad?.vendorId) {
      setVendor(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/vendors/${encodeURIComponent(ad.vendorId)}`, { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          if (!cancelled) setVendor(json.data as VendorPublic);
        } else {
          if (!cancelled) setVendor(null);
        }
      } catch {
        if (!cancelled) setVendor(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ad?.vendorId]);

  const galleryUrls = useMemo(() => {
    if (!ad) return [];
    const out: string[] = [];
    const add = (u?: string) => {
      const t = (u || '').trim();
      if (t && !out.includes(t)) out.push(t);
    };
    add(ad.imageUrl);
    for (const item of vendor?.portfolio || []) {
      add(item.imageUrl || item.url);
    }
    return out;
  }, [ad, vendor?.portfolio]);

  const showPauseBanner = ad && !ad.serving && !hasSponsoredClickPaid(ad.id);
  const hasWeddingDetails =
    Boolean(weddingDetails?.weddingDate) &&
    Boolean(weddingDetails?.location?.trim()) &&
    Number.isFinite(Number(weddingDetails?.guestCount)) &&
    Number(weddingDetails?.guestCount) > 0;

  const openQuoteModal = () => {
    if (!hasWeddingDetails) {
      toast.error('Please complete Wedding details (wedding date, location, and guest count) before requesting a quotation.');
      return;
    }
    setQuoteModalOpen(true);
  };

  const submitQuoteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad) return;
    if (!hasWeddingDetails || !weddingDetails) {
      toast.error('Wedding details are required before sending a quotation request.');
      return;
    }
    const budget = Number(quoteBudget);
    if (!Number.isFinite(budget) || budget <= 0) {
      toast.error('Please enter a valid budget amount.');
      return;
    }
    if (!quoteDescription.trim()) {
      toast.error('Description is required.');
      return;
    }

    setQuoteLoading(true);
    try {
      if (!hasSponsoredClickPaid(ad.id)) {
        const r = await postAdvertisementClick(ad.id);
        if (r.ok === false) {
          toast.error(r.error);
          return;
        }
        markSponsoredClickPaid(ad.id);
      }

      const payload = {
        customerId: user?.id ? String(user.id) : undefined,
        customerName:
          [user?.firstName?.trim(), user?.lastName?.trim()].filter(Boolean).join(' ') || user?.email || 'Ideal Weddings User',
        customerEmail: user?.email || '',
        vendorName: vendor?.businessName || ad.advertiser || 'Sponsored Advertiser',
        advertiserEmail: ad.advertiserEmail || vendor?.contactInfo?.email || undefined,
        adTitle: ad.title,
        vendorId: ad.vendorId || undefined,
        vendorUserId: ad.vendorUserId || undefined,
        adId: ad.id,
        service: `${ad.category || 'Wedding Service'} (Sponsored Ad)`,
        serviceCategory: ad.category || 'General',
        status: 'pending',
        amount: budget,
        budget,
        message: quoteDescription.trim(),
        description: quoteDescription.trim(),
        specialRequirements: quoteSpecialRequirements.trim() || undefined,
        source: 'sponsored_ad',
        eventDate: weddingDetails.weddingDate,
        weddingDate: weddingDetails.weddingDate,
        location: weddingDetails.location?.trim(),
        guestCount: Number(weddingDetails.guestCount),
      };

      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to submit quotation request');
      }

      setQuoteModalOpen(false);
      setQuoteBudget('');
      setQuoteDescription('');
      setQuoteSpecialRequirements('');
      toast.success('Quotation request sent. Vendor can now see it in Leads.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit quotation request');
    } finally {
      setQuoteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-primary-50/30">
        <Header />
        <main className="container-modern py-12 text-center">
          <div className="inline-flex items-center">
            <div className="h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-600">Loading this sponsored listing…</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadError || !ad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-primary-50/30">
        <Header />
        <main className="container-modern py-12 text-center max-w-md mx-auto">
          <p className="text-4xl mb-3">🎪</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sponsored ad not found</h1>
          <p className="text-gray-600 mb-6">{loadError || 'This page may be outdated or the ad was removed.'}</p>
          <Link href="/vendors" className="btn-primary">
            Browse vendors
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-primary-50/30">
      <Header />

      <main className="container-modern py-8">
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-primary-600">
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link href="/vendors" className="hover:text-primary-600">
            Vendors
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Sponsored: {ad.title}</span>
        </nav>

        {showPauseBanner && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This campaign is not currently in rotation (budget or settings). You may still use the contact options
            if available.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-lg">
              <div className="relative aspect-[21/9] min-h-[200px] bg-gray-100">
                {ad.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ad.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">🏷️</div>
                )}
                <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Sponsored
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-medium text-purple-800">
                    {ad.category}
                  </span>
                  {vendor?.businessName && (
                    <span className="text-sm text-gray-500">{vendor.businessName}</span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{ad.title}</h1>
                <p className="mt-2 text-primary-800 font-medium">{ad.advertiser}</p>
                {ad.description ? (
                  <p className="mt-4 text-gray-700 leading-relaxed whitespace-pre-line">{ad.description}</p>
                ) : (
                  <p className="mt-4 text-gray-600">
                    {vendor?.description
                      ? vendor.description
                      : 'Request a detailed quotation to discuss packages and pricing for your wedding.'}
                  </p>
                )}
              </div>
            </div>

            {galleryUrls.length > 1 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">More images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galleryUrls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200 hover:ring-primary-300"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {vendor && galleryUrls.length <= 1 && vendor.portfolio && vendor.portfolio.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">From this vendor</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vendor.portfolio.slice(0, 4).map((item) => {
                    const src = item.imageUrl || item.url;
                    return (
                      <div key={item.id} className="overflow-hidden rounded-lg border border-gray-100">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" className="h-40 w-full object-cover" />
                        ) : (
                          <div className="flex h-40 items-center justify-center bg-gray-100 text-2xl">📷</div>
                        )}
                        <div className="p-3">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          {item.description && <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50 to-white p-6 shadow-md">
              <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900/80">Next step</h2>
              <p className="mt-2 text-sm text-gray-600">
                Request a quotation through Ideal Weddings. The form uses your Wedding details automatically.
              </p>
              {hasWeddingDetails && weddingDetails && (
                <div className="mt-3 rounded-lg bg-white/80 border border-amber-100 p-3 text-xs text-gray-700 space-y-1">
                  <p><span className="font-semibold">Event Date:</span> {weddingDetails.weddingDate}</p>
                  <p><span className="font-semibold">Location:</span> {weddingDetails.location}</p>
                  <p><span className="font-semibold">Guest Count:</span> {weddingDetails.guestCount}</p>
                </div>
              )}
              {!hasWeddingDetails && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  Complete your Wedding details (date, location, guest count) first to request a quotation.
                </div>
              )}
              <button
                type="button"
                onClick={openQuoteModal}
                disabled={quoteLoading}
                className="btn-primary w-full mt-4"
              >
                {quoteLoading ? 'Working…' : 'Request a quotation'}
              </button>
              {isValidHttpUrl(ad.targetUrl) && (
                <a
                  href={ad.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full mt-3 inline-flex justify-center"
                >
                  Visit website
                </a>
              )}
            </div>

            {(ad.advertiserEmail || vendor?.contactInfo?.email) && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
                <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                {vendor?.contactInfo?.phone && <p>📞 {vendor.contactInfo.phone}</p>}
                {(vendor?.contactInfo?.email || ad.advertiserEmail) && (
                  <p className="mt-1 break-all">📧 {vendor?.contactInfo?.email || ad.advertiserEmail}</p>
                )}
              </div>
            )}

            <div className="text-center">
              <Link href="/dashboard" className="text-sm text-primary-600 hover:underline">
                Back to your dashboard
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {quoteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close quotation request"
            onClick={() => setQuoteModalOpen(false)}
          />
          <form
            onSubmit={submitQuoteRequest}
            className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900">Request a quotation</h3>
            <p className="mt-2 text-sm text-gray-600">
              Send this request to <span className="font-semibold">{vendor?.businessName || ad.advertiser}</span>.
              Wedding details are pulled from your account.
            </p>

            {weddingDetails && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
                <p><span className="font-semibold">Event Date:</span> {weddingDetails.weddingDate}</p>
                <p><span className="font-semibold">Location:</span> {weddingDetails.location}</p>
                <p><span className="font-semibold">Guest Count:</span> {weddingDetails.guestCount}</p>
                <p><span className="font-semibold">Wedding date:</span> {weddingDetails.weddingDate}</p>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget *</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="input w-full"
                  value={quoteBudget}
                  onChange={(e) => setQuoteBudget(e.target.value)}
                  placeholder="Enter your budget"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  className="input w-full min-h-[110px]"
                  value={quoteDescription}
                  onChange={(e) => setQuoteDescription(e.target.value)}
                  placeholder="Describe what you need from this advertiser..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirement (optional)</label>
                <textarea
                  className="input w-full min-h-[90px]"
                  value={quoteSpecialRequirements}
                  onChange={(e) => setQuoteSpecialRequirements(e.target.value)}
                  placeholder="Any special requirements or notes"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setQuoteModalOpen(false)}
                disabled={quoteLoading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={quoteLoading}>
                {quoteLoading ? 'Submitting…' : 'Submit quotation'}
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
}
