'use client';

import { useState, useEffect } from 'react';

// Vendor Favorites Interfaces
export interface VendorFavorite {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  priceRange: { min: number; max: number };
  description: string;
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  portfolio?: string[];
  addedAt: string;
  notes?: string;
  tags?: string[];
}

export interface VendorComparison {
  id: string;
  name: string;
  vendors: VendorFavorite[];
  createdAt: string;
  notes?: string;
}

interface UseVendorFavoritesReturn {
  // Favorites Management
  favorites: VendorFavorite[];
  addToFavorites: (vendor: Omit<VendorFavorite, 'id' | 'addedAt'>) => Promise<void>;
  removeFromFavorites: (vendorId: string) => Promise<void>;
  updateFavoriteNotes: (vendorId: string, notes: string) => Promise<void>;
  addTagToFavorite: (vendorId: string, tag: string) => Promise<void>;
  removeTagFromFavorite: (vendorId: string, tag: string) => Promise<void>;
  
  // Comparisons
  comparisons: VendorComparison[];
  createComparison: (name: string, vendorIds: string[]) => Promise<void>;
  addVendorToComparison: (comparisonId: string, vendorId: string) => Promise<void>;
  removeVendorFromComparison: (comparisonId: string, vendorId: string) => Promise<void>;
  deleteComparison: (comparisonId: string) => Promise<void>;
  
  // Filtering and Search
  getFavoritesByCategory: (category: string) => VendorFavorite[];
  getFavoritesByTag: (tag: string) => VendorFavorite[];
  searchFavorites: (query: string) => VendorFavorite[];
  
  // Statistics
  getFavoriteStatistics: () => {
    total: number;
    byCategory: { [key: string]: number };
    averageRating: number;
    priceRange: { min: number; max: number };
  };
  
  // Loading and Error States
  isLoading: boolean;
  error: string | null;
}

export function useVendorFavorites(): UseVendorFavoritesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<VendorFavorite[]>([]);
  const [comparisons, setComparisons] = useState<VendorComparison[]>([]);

  // Load favorites data on mount
  useEffect(() => {
    loadFavoritesData();
  }, []);

  const loadFavoritesData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock favorite vendors
      const mockFavorites: VendorFavorite[] = [
        {
          id: '1',
          vendorId: 'vendor1',
          name: 'Elite Wedding Photography',
          category: 'Photography',
          location: 'Napa Valley, CA',
          rating: 4.8,
          priceRange: { min: 2000, max: 3500 },
          description: 'Professional wedding photography with 10+ years of experience.',
          contact: {
            email: 'contact@elitephoto.com',
            phone: '+1 (555) 123-4567',
            website: 'https://elitephoto.com'
          },
          portfolio: ['/images/portfolio/1.jpg', '/images/portfolio/2.jpg'],
          addedAt: '2024-01-15T10:00:00Z',
          notes: 'Great portfolio, responsive communication',
          tags: ['professional', 'experienced', 'responsive']
        },
        {
          id: '2',
          vendorId: 'vendor2',
          name: 'Garden Catering Co.',
          category: 'Catering',
          location: 'Napa Valley, CA',
          rating: 4.6,
          priceRange: { min: 45, max: 85 },
          description: 'Farm-to-table catering with locally sourced ingredients.',
          contact: {
            email: 'info@gardencatering.com',
            phone: '+1 (555) 234-5678',
            website: 'https://gardencatering.com'
          },
          addedAt: '2024-01-20T10:00:00Z',
          notes: 'Excellent food quality, flexible menu options',
          tags: ['farm-to-table', 'flexible', 'quality']
        },
        {
          id: '3',
          vendorId: 'vendor3',
          name: 'Blossom Floral Design',
          category: 'Flowers',
          location: 'Napa Valley, CA',
          rating: 4.9,
          priceRange: { min: 1500, max: 3000 },
          description: 'Custom floral arrangements for your special day.',
          contact: {
            email: 'hello@blossomfloral.com',
            phone: '+1 (555) 345-6789',
            website: 'https://blossomfloral.com'
          },
          addedAt: '2024-01-25T10:00:00Z',
          notes: 'Beautiful designs, reasonable pricing',
          tags: ['custom', 'beautiful', 'affordable']
        }
      ];
      
      // Mock comparisons
      const mockComparisons: VendorComparison[] = [
        {
          id: '1',
          name: 'Photography Comparison',
          vendors: [mockFavorites[0]],
          createdAt: '2024-01-15T10:00:00Z',
          notes: 'Comparing top photography options'
        }
      ];
      
      setFavorites(mockFavorites);
      setComparisons(mockComparisons);
      
    } catch (err) {
      setError('Failed to load favorites data');
      console.error('Error loading favorites data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Favorites Management Functions
  const addToFavorites = async (vendor: Omit<VendorFavorite, 'id' | 'addedAt'>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newFavorite: VendorFavorite = {
        ...vendor,
        id: Date.now().toString(),
        addedAt: new Date().toISOString()
      };
      setFavorites(prev => [...prev, newFavorite]);
    } catch (err) {
      setError('Failed to add to favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromFavorites = async (vendorId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setFavorites(prev => prev.filter(f => f.vendorId !== vendorId));
      
      // Remove from all comparisons
      setComparisons(prev => prev.map(comp => ({
        ...comp,
        vendors: comp.vendors.filter(v => v.vendorId !== vendorId)
      })));
    } catch (err) {
      setError('Failed to remove from favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFavoriteNotes = async (vendorId: string, notes: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setFavorites(prev => prev.map(f => 
        f.vendorId === vendorId ? { ...f, notes } : f
      ));
    } catch (err) {
      setError('Failed to update notes');
    } finally {
      setIsLoading(false);
    }
  };

  const addTagToFavorite = async (vendorId: string, tag: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setFavorites(prev => prev.map(f => 
        f.vendorId === vendorId 
          ? { ...f, tags: [...(f.tags || []), tag] }
          : f
      ));
    } catch (err) {
      setError('Failed to add tag');
    } finally {
      setIsLoading(false);
    }
  };

  const removeTagFromFavorite = async (vendorId: string, tag: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setFavorites(prev => prev.map(f => 
        f.vendorId === vendorId 
          ? { ...f, tags: (f.tags || []).filter(t => t !== tag) }
          : f
      ));
    } catch (err) {
      setError('Failed to remove tag');
    } finally {
      setIsLoading(false);
    }
  };

  // Comparison Management Functions
  const createComparison = async (name: string, vendorIds: string[]) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const vendors = favorites.filter(f => vendorIds.includes(f.vendorId));
      const newComparison: VendorComparison = {
        id: Date.now().toString(),
        name,
        vendors,
        createdAt: new Date().toISOString()
      };
      setComparisons(prev => [...prev, newComparison]);
    } catch (err) {
      setError('Failed to create comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const addVendorToComparison = async (comparisonId: string, vendorId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const vendor = favorites.find(f => f.vendorId === vendorId);
      if (vendor) {
        setComparisons(prev => prev.map(comp => 
          comp.id === comparisonId 
            ? { ...comp, vendors: [...comp.vendors, vendor] }
            : comp
        ));
      }
    } catch (err) {
      setError('Failed to add vendor to comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const removeVendorFromComparison = async (comparisonId: string, vendorId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setComparisons(prev => prev.map(comp => 
        comp.id === comparisonId 
          ? { ...comp, vendors: comp.vendors.filter(v => v.vendorId !== vendorId) }
          : comp
      ));
    } catch (err) {
      setError('Failed to remove vendor from comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComparison = async (comparisonId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setComparisons(prev => prev.filter(comp => comp.id !== comparisonId));
    } catch (err) {
      setError('Failed to delete comparison');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering and Search Functions
  const getFavoritesByCategory = (category: string) => {
    return favorites.filter(favorite => favorite.category === category);
  };

  const getFavoritesByTag = (tag: string) => {
    return favorites.filter(favorite => favorite.tags?.includes(tag));
  };

  const searchFavorites = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return favorites.filter(favorite => 
      favorite.name.toLowerCase().includes(lowercaseQuery) ||
      favorite.description.toLowerCase().includes(lowercaseQuery) ||
      favorite.category.toLowerCase().includes(lowercaseQuery) ||
      favorite.location.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getFavoriteStatistics = () => {
    const total = favorites.length;
    const byCategory: { [key: string]: number } = {};
    let totalRating = 0;
    let minPrice = Infinity;
    let maxPrice = 0;

    favorites.forEach(favorite => {
      // Count by category
      byCategory[favorite.category] = (byCategory[favorite.category] || 0) + 1;
      
      // Calculate rating
      totalRating += favorite.rating;
      
      // Calculate price range
      minPrice = Math.min(minPrice, favorite.priceRange.min);
      maxPrice = Math.max(maxPrice, favorite.priceRange.max);
    });

    return {
      total,
      byCategory,
      averageRating: total > 0 ? totalRating / total : 0,
      priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice }
    };
  };

  return {
    // Favorites Management
    favorites,
    addToFavorites,
    removeFromFavorites,
    updateFavoriteNotes,
    addTagToFavorite,
    removeTagFromFavorite,
    
    // Comparisons
    comparisons,
    createComparison,
    addVendorToComparison,
    removeVendorFromComparison,
    deleteComparison,
    
    // Filtering and Search
    getFavoritesByCategory,
    getFavoritesByTag,
    searchFavorites,
    
    // Statistics
    getFavoriteStatistics,
    
    // Loading and Error States
    isLoading,
    error
  };
}
