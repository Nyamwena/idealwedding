'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Vendor = {
  id: string;
  name: string;
  businessName?: string;
  category?: string;
  location?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
};

export function UserAllVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationSearch, setLocationSearch] = useState('');

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (locationSearch.trim()) params.set('location', locationSearch.trim());
        const response = await fetch(`/api/vendors?${params.toString()}`, {
          cache: 'no-store',
        });
        const result = await response.json();
        if (!response.ok || !result?.success || !Array.isArray(result.data)) {
          setVendors([]);
          return;
        }
        setVendors(
          result.data.map((v: any) => ({
            id: String(v.id),
            name: String(v.name || ''),
            businessName: v.businessName ? String(v.businessName) : undefined,
            category: v.category ? String(v.category) : undefined,
            location: v.location ? String(v.location) : undefined,
            description: v.description ? String(v.description) : undefined,
            rating: Number(v.rating || 0),
            reviewCount: Number(v.reviewCount || 0),
          })),
        );
      } catch {
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchVendors();
  }, [selectedCategory, locationSearch]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          vendors
            .map((v) => String(v.category || '').trim())
            .filter((c) => c.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [vendors],
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900">All Vendors</h2>
        <p className="text-gray-600 mt-1">Search all vendors by service category and location.</p>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="user-vendor-category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="user-vendor-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-full"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="user-vendor-location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              id="user-vendor-location"
              type="text"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="input w-full"
              placeholder="Search by city, area, or country"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-600">
          Loading vendors...
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-600">No vendors found for this category/location filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {vendor.businessName || vendor.name}
                </h3>
                {vendor.category && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {vendor.category}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {vendor.description || 'No description yet.'}
              </p>
              <div className="text-sm text-gray-500 mb-4">
                <div>📍 {vendor.location || 'Location not set'}</div>
                <div>
                  ⭐ {Number(vendor.rating || 0).toFixed(1)} ({vendor.reviewCount || 0} reviews)
                </div>
              </div>
              <Link href={`/vendors/${vendor.id}`}>
                <button type="button" className="btn-primary btn-sm">
                  View profile
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
