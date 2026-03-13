'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

// User Data Interfaces
export interface WeddingDetails {
  id: string;
  weddingDate: string;
  venue: string;
  guestCount: number;
  budget: number;
  theme: string;
  location: string;
  notes?: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  vendor?: string;
  status: 'planned' | 'booked' | 'paid';
}

export interface SelectedVendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  price: number;
  status: 'quoted' | 'booked' | 'paid';
  notes?: string;
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  rsvpStatus: 'pending' | 'attending' | 'declined';
  dietaryNeeds?: string;
  plusOne: boolean;
  plusOneName?: string;
  tasks?: string[];
}

export interface QuoteRequest {
  id: string;
  category: string;
  description: string;
  budget: number;
  location: string;
  date: string;
  status: 'pending' | 'quoted' | 'booked';
  vendors: string[];
  createdAt: string;
}

interface UseUserDataReturn {
  // Wedding Details
  weddingDetails: WeddingDetails | null;
  updateWeddingDetails: (details: Partial<WeddingDetails>) => Promise<void>;
  
  // Budget Management
  budgetItems: BudgetItem[];
  addBudgetItem: (item: Omit<BudgetItem, 'id'>) => Promise<void>;
  updateBudgetItem: (id: string, item: Partial<BudgetItem>) => Promise<void>;
  deleteBudgetItem: (id: string) => Promise<void>;
  
  // Vendor Management
  selectedVendors: SelectedVendor[];
  addSelectedVendor: (vendor: Omit<SelectedVendor, 'id'>) => Promise<void>;
  updateSelectedVendor: (id: string, vendor: Partial<SelectedVendor>) => Promise<void>;
  removeSelectedVendor: (id: string) => Promise<void>;
  
  // Guest List Management
  guests: Guest[];
  addGuest: (guest: Omit<Guest, 'id'>) => Promise<void>;
  updateGuest: (id: string, guest: Partial<Guest>) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  updateRSVP: (id: string, status: Guest['rsvpStatus']) => Promise<void>;
  
  // Quote Requests
  quoteRequests: QuoteRequest[];
  createQuoteRequest: (request: Omit<QuoteRequest, 'id' | 'createdAt'>) => Promise<void>;
  updateQuoteRequest: (id: string, request: Partial<QuoteRequest>) => Promise<void>;
  
  // Loading and Error States
  isLoading: boolean;
  error: string | null;
}

export function useUserData(): UseUserDataReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for user data
  const [weddingDetails, setWeddingDetails] = useState<WeddingDetails | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<SelectedVendor[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API calls with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock wedding details
      setWeddingDetails({
        id: '1',
        weddingDate: '2024-06-15',
        venue: 'Garden Venue',
        guestCount: 150,
        budget: 25000,
        theme: 'Rustic Garden',
        location: 'Napa Valley, CA',
        notes: 'Outdoor ceremony with garden reception'
      });
      
      // Mock budget items
      setBudgetItems([
        {
          id: '1',
          category: 'Venue',
          allocated: 8000,
          spent: 8000,
          vendor: 'Garden Venue',
          status: 'paid'
        },
        {
          id: '2',
          category: 'Photography',
          allocated: 3000,
          spent: 1500,
          vendor: 'Elite Photography',
          status: 'booked'
        },
        {
          id: '3',
          category: 'Catering',
          allocated: 6000,
          spent: 0,
          status: 'planned'
        },
        {
          id: '4',
          category: 'Flowers',
          allocated: 2000,
          spent: 0,
          status: 'planned'
        }
      ]);
      
      // Mock selected vendors
      setSelectedVendors([
        {
          id: '1',
          name: 'Garden Venue',
          category: 'Venue',
          contact: 'contact@gardenvenue.com',
          price: 8000,
          status: 'paid',
          notes: 'Includes ceremony and reception space'
        },
        {
          id: '2',
          name: 'Elite Photography',
          category: 'Photography',
          contact: 'info@elitephoto.com',
          price: 3000,
          status: 'booked',
          notes: '8-hour coverage with 2 photographers'
        }
      ]);
      
      // Mock guests
      setGuests([
        {
          id: '1',
          name: 'John Smith',
          email: 'john@example.com',
          relationship: 'Groom\'s Father',
          rsvpStatus: 'attending',
          dietaryNeeds: 'Vegetarian',
          plusOne: false
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          relationship: 'Bride\'s Sister',
          rsvpStatus: 'attending',
          dietaryNeeds: 'Gluten-free',
          plusOne: true,
          plusOneName: 'Mike Johnson'
        },
        {
          id: '3',
          name: 'David Wilson',
          email: 'david@example.com',
          relationship: 'Friend',
          rsvpStatus: 'pending',
          plusOne: false
        }
      ]);
      
      // Mock quote requests
      setQuoteRequests([
        {
          id: '1',
          category: 'Catering',
          description: 'Buffet style dinner for 150 guests',
          budget: 6000,
          location: 'Napa Valley, CA',
          date: '2024-06-15',
          status: 'pending',
          vendors: ['vendor1', 'vendor2'],
          createdAt: '2024-01-15T10:00:00Z'
        }
      ]);
      
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Wedding Details Functions
  const updateWeddingDetails = async (details: Partial<WeddingDetails>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setWeddingDetails(prev => prev ? { ...prev, ...details } : null);
    } catch (err) {
      setError('Failed to update wedding details');
    } finally {
      setIsLoading(false);
    }
  };

  // Budget Functions
  const addBudgetItem = async (item: Omit<BudgetItem, 'id'>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newItem: BudgetItem = {
        ...item,
        id: Date.now().toString()
      };
      setBudgetItems(prev => [...prev, newItem]);
    } catch (err) {
      setError('Failed to add budget item');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBudgetItem = async (id: string, item: Partial<BudgetItem>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setBudgetItems(prev => prev.map(budgetItem => 
        budgetItem.id === id ? { ...budgetItem, ...item } : budgetItem
      ));
    } catch (err) {
      setError('Failed to update budget item');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBudgetItem = async (id: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setBudgetItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError('Failed to delete budget item');
    } finally {
      setIsLoading(false);
    }
  };

  // Vendor Functions
  const addSelectedVendor = async (vendor: Omit<SelectedVendor, 'id'>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newVendor: SelectedVendor = {
        ...vendor,
        id: Date.now().toString()
      };
      setSelectedVendors(prev => [...prev, newVendor]);
    } catch (err) {
      setError('Failed to add vendor');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSelectedVendor = async (id: string, vendor: Partial<SelectedVendor>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSelectedVendors(prev => prev.map(v => 
        v.id === id ? { ...v, ...vendor } : v
      ));
    } catch (err) {
      setError('Failed to update vendor');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSelectedVendor = async (id: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSelectedVendors(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setError('Failed to remove vendor');
    } finally {
      setIsLoading(false);
    }
  };

  // Guest Functions
  const addGuest = async (guest: Omit<Guest, 'id'>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newGuest: Guest = {
        ...guest,
        id: Date.now().toString()
      };
      setGuests(prev => [...prev, newGuest]);
    } catch (err) {
      setError('Failed to add guest');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGuest = async (id: string, guest: Partial<Guest>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setGuests(prev => prev.map(g => 
        g.id === id ? { ...g, ...guest } : g
      ));
    } catch (err) {
      setError('Failed to update guest');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGuest = async (id: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setGuests(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      setError('Failed to delete guest');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRSVP = async (id: string, status: Guest['rsvpStatus']) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setGuests(prev => prev.map(g => 
        g.id === id ? { ...g, rsvpStatus: status } : g
      ));
    } catch (err) {
      setError('Failed to update RSVP');
    } finally {
      setIsLoading(false);
    }
  };

  // Quote Request Functions
  const createQuoteRequest = async (request: Omit<QuoteRequest, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newRequest: QuoteRequest = {
        ...request,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setQuoteRequests(prev => [...prev, newRequest]);
    } catch (err) {
      setError('Failed to create quote request');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuoteRequest = async (id: string, request: Partial<QuoteRequest>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setQuoteRequests(prev => prev.map(r => 
        r.id === id ? { ...r, ...request } : r
      ));
    } catch (err) {
      setError('Failed to update quote request');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Wedding Details
    weddingDetails,
    updateWeddingDetails,
    
    // Budget Management
    budgetItems,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    
    // Vendor Management
    selectedVendors,
    addSelectedVendor,
    updateSelectedVendor,
    removeSelectedVendor,
    
    // Guest List Management
    guests,
    addGuest,
    updateGuest,
    deleteGuest,
    updateRSVP,
    
    // Quote Requests
    quoteRequests,
    createQuoteRequest,
    updateQuoteRequest,
    
    // Loading and Error States
    isLoading,
    error
  };
}
