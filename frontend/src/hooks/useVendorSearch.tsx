'use client';

import { useState, useEffect } from 'react';

interface Vendor {
  id: string;
  name: string;
  email: string;
  category: string;
  location: string;
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  reviewCount: number;
  description: string;
  isApproved: boolean;
  credits: number;
  isVisible: boolean;
  profileImage?: string;
  portfolio: string[];
  availability: string[];
  responseTime: string;
  experience: number;
  languages: string[];
  specialties: string[];
}

interface SearchFilters {
  category: string;
  location: string;
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  availability: string;
  languages: string[];
  specialties: string[];
}

interface SearchResults {
  vendors: Vendor[];
  totalCount: number;
  hasMore: boolean;
  searchTime: number;
}

export function useVendorSearch() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    vendors: [],
    totalCount: 0,
    hasMore: false,
    searchTime: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    location: '',
    priceRange: { min: 0, max: 10000 },
    rating: 0,
    availability: '',
    languages: [],
    specialties: [],
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock vendor data with credit-based visibility
      const mockVendors: Vendor[] = [
        {
          id: 'vendor_001',
          name: 'Elite Wedding Photography',
          email: 'contact@elitephoto.com',
          category: 'Photography',
          location: 'New York, NY',
          priceRange: { min: 1500, max: 3500 },
          rating: 4.9,
          reviewCount: 127,
          description: 'Professional wedding photography with 10+ years of experience. Specializing in candid and artistic shots.',
          isApproved: true,
          credits: 45,
          isVisible: true,
          profileImage: '/images/vendor1.jpg',
          portfolio: ['/images/portfolio1.jpg', '/images/portfolio2.jpg'],
          availability: ['Weekends', 'Evenings'],
          responseTime: 'Within 2 hours',
          experience: 10,
          languages: ['English', 'Spanish'],
          specialties: ['Candid Photography', 'Artistic Shots', 'Destination Weddings'],
        },
        {
          id: 'vendor_002',
          name: 'Dream Wedding Planning',
          email: 'info@dreamwedding.com',
          category: 'Wedding Planning',
          location: 'Los Angeles, CA',
          priceRange: { min: 2000, max: 8000 },
          rating: 4.8,
          reviewCount: 89,
          description: 'Full-service wedding planning with attention to every detail. Making your dream wedding a reality.',
          isApproved: true,
          credits: 0, // No credits - should be hidden
          isVisible: false,
          profileImage: '/images/vendor2.jpg',
          portfolio: ['/images/portfolio3.jpg', '/images/portfolio4.jpg'],
          availability: ['Weekdays', 'Weekends'],
          responseTime: 'Within 1 hour',
          experience: 8,
          languages: ['English', 'French'],
          specialties: ['Full Planning', 'Day-of Coordination', 'Destination Weddings'],
        },
        {
          id: 'vendor_003',
          name: 'Garden Fresh Florals',
          email: 'hello@gardenfresh.com',
          category: 'Florist',
          location: 'Chicago, IL',
          priceRange: { min: 800, max: 2500 },
          rating: 4.7,
          reviewCount: 156,
          description: 'Beautiful floral arrangements using fresh, seasonal flowers. Creating stunning centerpieces and bouquets.',
          isApproved: true,
          credits: 12,
          isVisible: true,
          profileImage: '/images/vendor3.jpg',
          portfolio: ['/images/portfolio5.jpg', '/images/portfolio6.jpg'],
          availability: ['Weekdays', 'Weekends'],
          responseTime: 'Within 4 hours',
          experience: 6,
          languages: ['English'],
          specialties: ['Seasonal Flowers', 'Custom Arrangements', 'Wedding Arches'],
        },
        {
          id: 'vendor_004',
          name: 'Gourmet Wedding Catering',
          email: 'catering@gourmetweddings.com',
          category: 'Catering',
          location: 'Miami, FL',
          priceRange: { min: 2500, max: 6000 },
          rating: 4.9,
          reviewCount: 203,
          description: 'Exquisite wedding catering with custom menus. From intimate gatherings to grand celebrations.',
          isApproved: true,
          credits: 78,
          isVisible: true,
          profileImage: '/images/vendor4.jpg',
          portfolio: ['/images/portfolio7.jpg', '/images/portfolio8.jpg'],
          availability: ['Weekends', 'Evenings'],
          responseTime: 'Within 3 hours',
          experience: 12,
          languages: ['English', 'Spanish', 'Portuguese'],
          specialties: ['Custom Menus', 'International Cuisine', 'Dietary Restrictions'],
        },
        {
          id: 'vendor_005',
          name: 'Melody Wedding Music',
          email: 'music@melodyweddings.com',
          category: 'Music & Entertainment',
          location: 'Austin, TX',
          priceRange: { min: 1200, max: 3000 },
          rating: 4.6,
          reviewCount: 94,
          description: 'Live music and DJ services for your special day. Creating the perfect atmosphere for your celebration.',
          isApproved: true,
          credits: 3, // Low credits - should be visible but with warning
          isVisible: true,
          profileImage: '/images/vendor5.jpg',
          portfolio: ['/images/portfolio9.jpg', '/images/portfolio10.jpg'],
          availability: ['Weekends', 'Evenings'],
          responseTime: 'Within 6 hours',
          experience: 7,
          languages: ['English'],
          specialties: ['Live Bands', 'DJ Services', 'String Quartets'],
        },
        {
          id: 'vendor_006',
          name: 'Luxury Wedding Cars',
          email: 'info@luxurycars.com',
          category: 'Transportation',
          location: 'San Francisco, CA',
          priceRange: { min: 500, max: 1500 },
          rating: 4.8,
          reviewCount: 67,
          description: 'Premium transportation services with luxury vehicles. Making your arrival unforgettable.',
          isApproved: false, // Not approved - should be hidden
          credits: 25,
          isVisible: false,
          profileImage: '/images/vendor6.jpg',
          portfolio: ['/images/portfolio11.jpg', '/images/portfolio12.jpg'],
          availability: ['Weekdays', 'Weekends'],
          responseTime: 'Within 2 hours',
          experience: 5,
          languages: ['English'],
          specialties: ['Luxury Cars', 'Limousines', 'Vintage Cars'],
        },
      ];

      // Filter vendors based on approval and credit visibility
      const visibleVendors = mockVendors.filter(vendor => 
        vendor.isApproved && vendor.isVisible && vendor.credits >= 5
      );

      setVendors(visibleVendors);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchVendors = async (searchFilters: Partial<SearchFilters> = {}) => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mergedFilters = { ...filters, ...searchFilters };
      setFilters(mergedFilters);
      
      // Advanced querying with multiple filters
      let filteredVendors = vendors.filter(vendor => {
        // Category filter
        if (mergedFilters.category && vendor.category !== mergedFilters.category) {
          return false;
        }
        
        // Location filter (case-insensitive partial match)
        if (mergedFilters.location && !vendor.location.toLowerCase().includes(mergedFilters.location.toLowerCase())) {
          return false;
        }
        
        // Price range filter
        if (mergedFilters.priceRange.min > 0 && vendor.priceRange.min < mergedFilters.priceRange.min) {
          return false;
        }
        if (mergedFilters.priceRange.max < 10000 && vendor.priceRange.max > mergedFilters.priceRange.max) {
          return false;
        }
        
        // Rating filter
        if (mergedFilters.rating > 0 && vendor.rating < mergedFilters.rating) {
          return false;
        }
        
        // Availability filter
        if (mergedFilters.availability && !vendor.availability.includes(mergedFilters.availability)) {
          return false;
        }
        
        // Languages filter
        if (mergedFilters.languages.length > 0 && !mergedFilters.languages.some(lang => vendor.languages.includes(lang))) {
          return false;
        }
        
        // Specialties filter
        if (mergedFilters.specialties.length > 0 && !mergedFilters.specialties.some(spec => vendor.specialties.includes(spec))) {
          return false;
        }
        
        return true;
      });
      
      // Sort by rating and review count (most relevant first)
      filteredVendors.sort((a, b) => {
        const scoreA = (a.rating * 0.7) + (a.reviewCount / 100 * 0.3);
        const scoreB = (b.rating * 0.7) + (b.reviewCount / 100 * 0.3);
        return scoreB - scoreA;
      });
      
      const searchTime = Date.now() - startTime;
      
      setSearchResults({
        vendors: filteredVendors,
        totalCount: filteredVendors.length,
        hasMore: false, // For pagination in the future
        searchTime,
      });
      
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVendorById = (id: string) => {
    return vendors.find(vendor => vendor.id === id);
  };

  const getVendorsByCategory = (category: string) => {
    return vendors.filter(vendor => vendor.category === category);
  };

  const getVendorsByLocation = (location: string) => {
    return vendors.filter(vendor => 
      vendor.location.toLowerCase().includes(location.toLowerCase())
    );
  };

  const getFeaturedVendors = (limit: number = 6) => {
    return vendors
      .filter(vendor => vendor.rating >= 4.5 && vendor.reviewCount >= 50)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  };

  const getLowCreditVendors = () => {
    return vendors.filter(vendor => vendor.credits < 10 && vendor.credits >= 5);
  };

  const getVendorCategories = () => {
    const categories = Array.from(new Set(vendors.map(vendor => vendor.category)));
    return categories.sort();
  };

  const getVendorLocations = () => {
    const locations = Array.from(new Set(vendors.map(vendor => vendor.location)));
    return locations.sort();
  };

  const getVendorLanguages = () => {
    const languages = Array.from(new Set(vendors.flatMap(vendor => vendor.languages)));
    return languages.sort();
  };

  const getVendorSpecialties = () => {
    const specialties = Array.from(new Set(vendors.flatMap(vendor => vendor.specialties)));
    return specialties.sort();
  };

  return {
    vendors,
    searchResults,
    loading,
    filters,
    searchVendors,
    getVendorById,
    getVendorsByCategory,
    getVendorsByLocation,
    getFeaturedVendors,
    getLowCreditVendors,
    getVendorCategories,
    getVendorLocations,
    getVendorLanguages,
    getVendorSpecialties,
    refetch: fetchVendors,
  };
}
