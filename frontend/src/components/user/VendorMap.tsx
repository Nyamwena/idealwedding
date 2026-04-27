'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { postAdvertisementClick } from '@/lib/recordAdvertisementClick';
import { markSponsoredClickPaid } from '@/lib/sponsoredSession';

export interface MapVendorRow {
  id: string;
  name: string;
  displayTitle?: string;
  category: string;
  location: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  priceRange: { min: number; max: number };
  contact: { email: string; phone: string };
  description: string;
  isSponsored?: boolean;
  adId?: string;
  targetUrl?: string;
  imageUrl?: string;
  website?: string;
  vendorMissing?: boolean;
}

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function VendorMap() {
  const router = useRouter();
  const [sponsored, setSponsored] = useState<MapVendorRow[]>([]);
  const [vendors, setVendors] = useState<MapVendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<MapVendorRow | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const categories = [
    'all',
    'Photography',
    'Catering',
    'Flowers',
    'Entertainment',
    'Venue',
    'Transportation',
    'Hair & Makeup',
    'Dress & Attire',
    'Decorations',
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cat =
        selectedCategory === 'all' ? 'all' : selectedCategory.toLowerCase();
      const res = await fetch(`/api/vendor-map?category=${encodeURIComponent(cat)}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load vendors');
      }
      const d = json.data;
      setSponsored(Array.isArray(d.sponsored) ? d.sponsored : []);
      setVendors(Array.isArray(d.vendors) ? d.vendors : []);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Could not load vendor map');
      setSponsored([]);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: 38.2975, lng: -122.2869 });
        },
      );
    } else {
      setUserLocation({ lat: 38.2975, lng: -122.2869 });
    }
  }, []);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      Photography: '📸',
      Catering: '🍽️',
      Flowers: '🌸',
      Entertainment: '🎵',
      Venue: '🏛️',
      Venues: '🏛️',
      Transportation: '🚗',
      'Hair & Makeup': '💄',
      'Dress & Attire': '👗',
      Decorations: '🎨',
      Floral: '🌸',
    };
    return icons[category] || '🏢';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Photography: 'bg-blue-100 text-blue-800',
      Catering: 'bg-green-100 text-green-800',
      Flowers: 'bg-pink-100 text-pink-800',
      Floral: 'bg-pink-100 text-pink-800',
      Entertainment: 'bg-purple-100 text-purple-800',
      Venue: 'bg-yellow-100 text-yellow-800',
      Venues: 'bg-yellow-100 text-yellow-800',
      Transportation: 'bg-gray-100 text-gray-800',
      'Hair & Makeup': 'bg-red-100 text-red-800',
      'Dress & Attire': 'bg-indigo-100 text-indigo-800',
      Decorations: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  /** One billed click, then the full sponsored landing page (details, images, “Request a quotation”). */
  const openSponsoredAdPage = async (row: MapVendorRow) => {
    if (!row.adId) return;
    const billed = await postAdvertisementClick(row.adId);
    if (billed.ok === false) {
      toast.error(billed.error || 'This sponsored link is unavailable (no active ad budget).');
      return;
    }
    markSponsoredClickPaid(row.adId);
    router.push(`/sponsored/${encodeURIComponent(row.adId)}`);
  };

  /**
   * List rows (non-sponsored): open vendor profile for quote, external URL, or vendors directory.
   */
  const goToVendorProfileForQuote = (row: MapVendorRow) => {
    const hasVendorPage =
      !row.vendorMissing &&
      Boolean(row.id) &&
      !String(row.id).startsWith('ad_');

    if (hasVendorPage) {
      const q = new URLSearchParams();
      q.set('from', 'vendor-map');
      q.set('quote', '1');
      if (row.adId) q.set('ad', row.adId);
      router.push(`/vendors/${encodeURIComponent(row.id)}?${q.toString()}#vendor-services`);
      return;
    }

    const external = row.targetUrl || row.website || '';
    if (external && isValidHttpUrl(external)) {
      window.open(external, '_blank', 'noopener,noreferrer');
      return;
    }

    router.push('/vendors');
  };

  const displayName = (v: MapVendorRow) => v.displayTitle || v.name;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Map</h2>
            <p className="text-gray-600">
              Discover wedding vendors in your area. Filter by category and explore their locations. The sponsored
              strip shows ads with placement <strong>Vendor map</strong> or <strong>Top</strong> (active, in date) from
              Admin → Ads.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>📍</span>
            <span>{userLocation ? 'Location detected' : 'Location not available'}</span>
          </div>
        </div>
      </div>

      {/* Sponsored — from database-backed banner ads (position vendor_map) */}
      {!loading && sponsored.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sponsored</h3>
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-800 bg-amber-200/80 px-2 py-1 rounded-md">
              Sponsored
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {sponsored.map((row) => (
              <div
                key={row.adId || row.id}
                className="min-w-[260px] max-w-[280px] flex-shrink-0 bg-white rounded-xl border border-amber-200/80 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="relative h-28 bg-gray-100">
                  {row.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-100">
                      {getCategoryIcon(row.category)}
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-black/70 text-white px-2 py-0.5 rounded">
                    Sponsored
                  </span>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{displayName(row)}</h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{row.description}</p>
                  <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getCategoryColor(row.category)}`}>
                      {row.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => void openSponsoredAdPage(row)}
                      className="btn-primary btn-sm text-xs whitespace-nowrap"
                    >
                      View ad
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading vendors…</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{error}</div>
      )}

      {/* Category Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Categories' : `${getCategoryIcon(category)} ${category}`}
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendors ({vendors.length})</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {vendors.length === 0 ? (
                  <p className="text-sm text-gray-500">No vendors match this category.</p>
                ) : (
                  vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedVendor(vendor)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedVendor(vendor);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedVendor?.id === vendor.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                        <span
                          className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(vendor.category)}`}
                        >
                          {vendor.category}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{vendor.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">⭐</span>
                          <span className="font-medium">{vendor.rating}</span>
                        </div>
                        <div className="text-gray-600">
                          ${vendor.priceRange.min} - ${vendor.priceRange.max}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">📍 {vendor.location}</div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className="btn-primary btn-sm text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            void goToVendorProfileForQuote(vendor);
                          }}
                        >
                          Request Quote
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Locations</h3>
              <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="text-4xl mb-4">🗺️</div>
                  <p className="text-gray-600 mb-2">Interactive Map</p>
                  <p className="text-sm text-gray-500">
                    Google Maps integration can be enabled with an API key in environment variables.
                  </p>
                  <div className="mt-4 text-xs text-gray-400">
                    <p>
                      📍 {vendors.length} vendors
                      {selectedCategory === 'all' ? ' (all categories)' : ` in ${selectedCategory}`}
                    </p>
                    {userLocation && (
                      <p>
                        📍 Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedVendor && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Details</h3>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{selectedVendor.name}</h4>
                      <p className="text-gray-600">{selectedVendor.description}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedVendor.category)}`}
                    >
                      {getCategoryIcon(selectedVendor.category)} {selectedVendor.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Contact Information</h5>
                      <div className="space-y-1 text-sm">
                        {selectedVendor.contact.email && (
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">📧</span>
                            <a
                              href={`mailto:${selectedVendor.contact.email}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {selectedVendor.contact.email}
                            </a>
                          </div>
                        )}
                        {selectedVendor.contact.phone && (
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">📞</span>
                            <a
                              href={`tel:${selectedVendor.contact.phone}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {selectedVendor.contact.phone}
                            </a>
                          </div>
                        )}
                        {selectedVendor.website && (
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">🌐</span>
                            <a
                              href={selectedVendor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700"
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Details</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">⭐</span>
                          <span>Rating: {selectedVendor.rating}/5.0</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">💰</span>
                          <span>
                            Price: ${selectedVendor.priceRange.min} - ${selectedVendor.priceRange.max}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">📍</span>
                          <span>{selectedVendor.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                    <button
                      type="button"
                      className="btn-primary btn-md"
                      onClick={() => void goToVendorProfileForQuote(selectedVendor)}
                    >
                      Request Quote
                    </button>
                    <a href="/vendors" className="btn-outline btn-md inline-flex items-center justify-center">
                      Browse vendors
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
              <div className="flex items-start">
                <div className="text-blue-500 mr-3 mt-1">ℹ️</div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Sponsored listings</h4>
                  <p className="text-blue-800 text-sm">
                    Sponsored cards use the same banner ads as the dashboard (Top) and optional Vendor map placements.
                    <strong> View ad</strong> opens a full page with details and images, then you can request a
                    quotation. Link a vendor ID in the ad when possible for the best experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
