'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { usePlanningHydration } from './PlanningHydrationContext';
import {
  loadUserJsonArray,
  loadUserJsonObject,
  saveUserJsonArray,
  saveUserJsonObject,
  PLANNING_PARTS,
} from '@/lib/userPlanningStorage';

// User Data Interfaces
export interface WeddingDetails {
  id: string;
  weddingDate?: string;
  /** Local ceremony time `HH:mm` (24h from time input); optional — countdown defaults to 16:00 if omitted */
  ceremonyTime?: string;
  /** First names (or preferred names) for personalized dashboard copy */
  brideName?: string;
  groomName?: string;
  venue?: string;
  guestCount?: number;
  budget?: number;
  theme?: string;
  location?: string;
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
  const planningHydration = usePlanningHydration();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for user data
  const [weddingDetails, setWeddingDetails] = useState<WeddingDetails | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<SelectedVendor[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);

  // Load user data when the signed-in account changes (stable id string for storage keys)
  useEffect(() => {
    if (!user) {
      setWeddingDetails(null);
      setBudgetItems([]);
      setSelectedVendors([]);
      setGuests([]);
      setQuoteRequests([]);
      setIsLoading(false);
      return;
    }
    loadUserData();
  }, [user?.id, planningHydration]);

  const loadUserData = async () => {
    if (!user) return;
    const uid = String(user.id);
    setIsLoading(true);
    setError(null);
    
    try {
      const wd = loadUserJsonObject<WeddingDetails>(uid, PLANNING_PARTS.weddingDetails);
      if (wd && typeof wd.id === 'string') {
        setWeddingDetails(wd);
      } else {
        setWeddingDetails(null);
      }

      setBudgetItems(loadUserJsonArray<BudgetItem>(uid, PLANNING_PARTS.budgetItems));
      setSelectedVendors(loadUserJsonArray<SelectedVendor>(uid, PLANNING_PARTS.selectedVendors));
      setGuests(loadUserJsonArray<Guest>(uid, PLANNING_PARTS.guests));
      setQuoteRequests(loadUserJsonArray<QuoteRequest>(uid, PLANNING_PARTS.quoteRequestsLegacy));
      
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Wedding Details Functions
  const updateWeddingDetails = async (details: Partial<WeddingDetails>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setWeddingDetails(prev => {
        const next: WeddingDetails = {
          id: prev?.id || `wd_${Date.now()}`,
          ...prev,
          ...details,
        };
        saveUserJsonObject(String(user.id), PLANNING_PARTS.weddingDetails, next);
        return next;
      });
    } catch (err) {
      setError('Failed to update wedding details');
    } finally {
      setIsLoading(false);
    }
  };

  // Budget Functions
  const addBudgetItem = async (item: Omit<BudgetItem, 'id'>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newItem: BudgetItem = {
        ...item,
        id: Date.now().toString()
      };
      setBudgetItems(prev => {
        const next = [...prev, newItem];
        saveUserJsonArray(String(user.id), PLANNING_PARTS.budgetItems, next);
        return next;
      });
    } catch (err) {
      setError('Failed to add budget item');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBudgetItem = async (id: string, item: Partial<BudgetItem>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setBudgetItems(prev => {
        const next = prev.map(budgetItem =>
          budgetItem.id === id ? { ...budgetItem, ...item } : budgetItem
        );
        saveUserJsonArray(String(user.id), PLANNING_PARTS.budgetItems, next);
        return next;
      });
    } catch (err) {
      setError('Failed to update budget item');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBudgetItem = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setBudgetItems(prev => {
        const next = prev.filter(bi => bi.id !== id);
        saveUserJsonArray(String(user.id), PLANNING_PARTS.budgetItems, next);
        return next;
      });
    } catch (err) {
      setError('Failed to delete budget item');
    } finally {
      setIsLoading(false);
    }
  };

  // Vendor Functions
  const addSelectedVendor = async (vendor: Omit<SelectedVendor, 'id'>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newVendor: SelectedVendor = {
        ...vendor,
        id: Date.now().toString()
      };
      setSelectedVendors(prev => {
        const next = [...prev, newVendor];
        saveUserJsonArray(String(user.id), PLANNING_PARTS.selectedVendors, next);
        return next;
      });
    } catch (err) {
      setError('Failed to add vendor');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSelectedVendor = async (id: string, vendor: Partial<SelectedVendor>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setSelectedVendors(prev => {
        const next = prev.map(v => (v.id === id ? { ...v, ...vendor } : v));
        saveUserJsonArray(String(user.id), PLANNING_PARTS.selectedVendors, next);
        return next;
      });
    } catch (err) {
      setError('Failed to update vendor');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSelectedVendor = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setSelectedVendors(prev => {
        const next = prev.filter(v => v.id !== id);
        saveUserJsonArray(String(user.id), PLANNING_PARTS.selectedVendors, next);
        return next;
      });
    } catch (err) {
      setError('Failed to remove vendor');
    } finally {
      setIsLoading(false);
    }
  };

  // Guest Functions
  const addGuest = async (guest: Omit<Guest, 'id'>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newGuest: Guest = {
        ...guest,
        id: Date.now().toString()
      };
      setGuests(prev => {
        const next = [...prev, newGuest];
        saveUserJsonArray(String(user.id), PLANNING_PARTS.guests, next);
        return next;
      });
    } catch (err) {
      setError('Failed to add guest');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGuest = async (id: string, guest: Partial<Guest>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setGuests(prev => {
        const next = prev.map(g => (g.id === id ? { ...g, ...guest } : g));
        saveUserJsonArray(String(user.id), PLANNING_PARTS.guests, next);
        return next;
      });
    } catch (err) {
      setError('Failed to update guest');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGuest = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setGuests(prev => {
        const next = prev.filter(g => g.id !== id);
        saveUserJsonArray(String(user.id), PLANNING_PARTS.guests, next);
        return next;
      });
    } catch (err) {
      setError('Failed to delete guest');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRSVP = async (id: string, status: Guest['rsvpStatus']) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setGuests(prev => {
        const next = prev.map(g => (g.id === id ? { ...g, rsvpStatus: status } : g));
        saveUserJsonArray(String(user.id), PLANNING_PARTS.guests, next);
        return next;
      });
    } catch (err) {
      setError('Failed to update RSVP');
    } finally {
      setIsLoading(false);
    }
  };

  // Quote Request Functions
  const createQuoteRequest = async (request: Omit<QuoteRequest, 'id' | 'createdAt'>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newRequest: QuoteRequest = {
        ...request,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setQuoteRequests(prev => {
        const next = [...prev, newRequest];
        saveUserJsonArray(String(user.id), PLANNING_PARTS.quoteRequestsLegacy, next);
        return next;
      });
    } catch (err) {
      setError('Failed to create quote request');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuoteRequest = async (id: string, request: Partial<QuoteRequest>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setQuoteRequests(prev => {
        const next = prev.map(r => (r.id === id ? { ...r, ...request } : r));
        saveUserJsonArray(String(user.id), PLANNING_PARTS.quoteRequestsLegacy, next);
        return next;
      });
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
