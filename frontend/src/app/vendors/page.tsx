'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface Vendor {
  id: string;
  name: string;
  businessName: string;
  email: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  description: string;
  isApproved: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  phone: string;
  website: string;
  languages: string[];
  specialties: string[];
  availability: string[];
  portfolio: {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    description?: string;
    category: string;
    isPublic: boolean;
  }[];
  services: {
    id: string;
    name: string;
    category: string;
    priceRange: {
      min: number;
      max: number;
    };
    description: string;
    isPremium: boolean;
    isFeatured: boolean;
  }[];
  contactInfo: {
    email: string;
    phone: string;
    website: string;
    socialMedia?: any;
  };
  businessInfo: {
    yearsInBusiness: number;
    teamSize: number;
    languages: string[];
    certifications: string[];
    insurance: boolean;
  };
  stats: {
    profileViews: number;
    portfolioViews: number;
    inquiryCount: number;
    responseRate: number;
    averageResponseTime: number;
  };
}

interface RankedAd {
  id: string;
  title: string;
  imageUrl?: string;
  targetUrl: string;
  advertiser: string;
  category: string;
  bidPerClick: number;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [topAds, setTopAds] = useState<RankedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

  useEffect(() => {
    fetchVendors();
  }, [selectedCategory, selectedLocation, searchTerm, priceRange]);

  useEffect(() => {
    const loadTopAds = async () => {
      try {
        const response = await fetch('/api/advertisements?position=top&limit=3');
        const result = await response.json();
        if (response.ok) {
          setTopAds(result.data || []);
        } else {
          setTopAds([]);
        }
      } catch {
        setTopAds([]);
      }
    };
    loadTopAds();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLocation) params.append('location', selectedLocation);
      if (searchTerm) params.append('search', searchTerm);
      if (priceRange.min > 0) params.append('minPrice', priceRange.min.toString());
      if (priceRange.max < 10000) params.append('maxPrice', priceRange.max.toString());

      const response = await fetch(`/api/vendors?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch vendors');
      }

      setVendors(result.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  // No need for client-side filtering since API handles it
  const filteredVendors = vendors;

  const categories = Array.from(new Set(vendors.map(v => v.category)));
  const locations = Array.from(new Set(vendors.map(v => v.location.split(',')[1]?.trim()).filter(Boolean)));

  const handleAdClick = async (ad: RankedAd) => {
    try {
      const response = await fetch(`/api/advertisements/${ad.id}/click`, { method: 'POST' });
      const result = await response.json();
      if (response.ok && result.data?.targetUrl) {
        window.open(result.data.targetUrl, '_blank', 'noopener,noreferrer');
      } else if (ad.targetUrl) {
        window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      if (ad.targetUrl) {
        window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Header />
        <main className="container-modern py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading vendors...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect <span className="gradient-text">Wedding Vendors</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover top-rated wedding vendors in your area. All vendors are verified and have active credits.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {topAds.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Sponsored Ads</h2>
            <p className="text-sm text-gray-500 mb-4">
              Ranked by bid-per-click. Higher bidder appears first.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topAds.map((ad, index) => (
                <button
                  key={ad.id}
                  onClick={() => handleAdClick(ad)}
                  className="text-left bg-white rounded-xl shadow hover:shadow-lg transition p-4 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Sponsored #{index + 1}
                    </span>
                    <span className="text-xs text-gray-500">Bid ${Number(ad.bidPerClick || 0).toFixed(2)}/click</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{ad.title}</h3>
                  <p className="text-xs text-gray-500">{ad.advertiser} • {ad.category}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredVendors.length} of {vendors.length} vendors
          </p>
        </div>

        {/* Featured Vendors */}
        {filteredVendors.filter(v => v.isFeatured).length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Vendors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.filter(v => v.isFeatured).map((vendor) => (
                <div key={vendor.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Portfolio Image */}
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center relative">
                    {vendor.portfolio && vendor.portfolio.length > 0 ? (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">📸 Portfolio Image</span>
                      </div>
                    ) : (
                      <span className="text-4xl">📸</span>
                    )}
                    {vendor.isFeatured && (
                      <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{vendor.businessName || vendor.name}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{vendor.category}</span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{vendor.description}</p>
                    
                    {/* Services Preview */}
                    {vendor.services && vendor.services.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {vendor.services.slice(0, 2).map((service, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {service.name}
                            </span>
                          ))}
                          {vendor.services.length > 2 && (
                            <span className="text-xs text-gray-500">+{vendor.services.length - 2} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>📍 {vendor.location}</span>
                      <span>⭐ {vendor.rating} ({vendor.reviewCount} reviews)</span>
                    </div>
                    
                    {/* Price Range from Services */}
                    {vendor.services && vendor.services.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">
                          From ${Math.min(...vendor.services.map(s => s.priceRange.min))} - ${Math.max(...vendor.services.map(s => s.priceRange.max))}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {vendor.businessInfo?.yearsInBusiness}+ years
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {vendor.businessInfo?.languages?.join(', ')}
                        </span>
                      </div>
                      <Link href={`/vendors/${vendor.id}`}>
                        <button className="btn-primary btn-sm">
                          View Profile
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Vendors */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Vendors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <div key={vendor.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Portfolio Image */}
                <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center relative">
                  {vendor.portfolio && vendor.portfolio.length > 0 ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">
                        {vendor.category === 'Photography' ? '📸' : 
                         vendor.category === 'Wedding Planning' ? '📋' : 
                         vendor.category === 'Catering' ? '🍽️' : 
                         vendor.category === 'Floral' ? '🌸' :
                         vendor.category === 'Entertainment' ? '🎵' : '💒'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-4xl">
                      {vendor.category === 'Photography' ? '📸' : 
                       vendor.category === 'Wedding Planning' ? '📋' : 
                       vendor.category === 'Catering' ? '🍽️' : 
                       vendor.category === 'Floral' ? '🌸' :
                       vendor.category === 'Entertainment' ? '🎵' : '💒'}
                    </span>
                  )}
                  <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {vendor.category}
                  </span>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{vendor.businessName || vendor.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{vendor.description}</p>
                  
                  {/* Services Preview */}
                  {vendor.services && vendor.services.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {vendor.services.slice(0, 2).map((service, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {service.name}
                          </span>
                        ))}
                        {vendor.services.length > 2 && (
                          <span className="text-xs text-gray-500">+{vendor.services.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>📍 {vendor.location}</span>
                    <span>⭐ {vendor.rating} ({vendor.reviewCount} reviews)</span>
                  </div>
                  
                  {/* Price Range from Services */}
                  {vendor.services && vendor.services.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">
                        From ${Math.min(...vendor.services.map(s => s.priceRange.min))} - ${Math.max(...vendor.services.map(s => s.priceRange.max))}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {vendor.businessInfo?.yearsInBusiness || Math.floor(Math.random() * 15) + 1}+ years
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {vendor.businessInfo?.languages?.join(', ') || 'English'}
                      </span>
                    </div>
                    <Link href={`/vendors/${vendor.id}`}>
                      <button className="btn-primary btn-sm">
                        View Profile
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}