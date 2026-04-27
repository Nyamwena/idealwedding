'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlanningHydration } from '@/hooks/PlanningHydrationContext';

// Quote Generator Interfaces
export interface QuoteRequest {
  id: string;
  category: string;
  description: string;
  budget: number;
  location: string;
  /** Event date (YYYY-MM-DD) — alias for `eventDate` for legacy UI */
  date: string;
  eventDate?: string;
  guestCount?: number;
  specialRequirements?: string;
  /** `open` = visible to all vendors; `awarded` = user approved a quote */
  status: 'open' | 'awarded' | 'pending' | 'quoted' | 'booked';
  vendors: string[];
  createdAt: string;
}

export interface VendorMatch {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  priceRange: { min: number; max: number };
  availability: boolean;
  responseTime: string;
  description: string;
  contact: {
    email: string;
    phone: string;
  };
  portfolio?: string[];
}

export interface QuoteResponse {
  id: string;
  vendorId: string;
  vendorName: string;
  quoteRequestId: string;
  price: number;
  description: string;
  inclusions: string[];
  exclusions: string[];
  validUntil: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

interface UseQuoteGeneratorReturn {
  quoteRequests: QuoteRequest[];
  createQuoteRequest: (
    request: Omit<QuoteRequest, 'id' | 'createdAt' | 'status' | 'vendors' | 'date'> & { date: string },
  ) => Promise<void>;
  updateQuoteRequest: (id: string, request: Partial<QuoteRequest>) => Promise<void>;
  deleteQuoteRequest: (id: string) => Promise<void>;
  matchedVendors: VendorMatch[];
  searchVendors: (category: string, location: string, budget: number) => Promise<void>;
  quoteResponses: QuoteResponse[];
  acceptQuote: (quoteId: string) => Promise<void>;
  declineQuote: (quoteId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSearching: boolean;
  refreshQuoteRequests: () => Promise<void>;
}

function mapApiToQuoteRequest(r: any): QuoteRequest {
  const eventDate = String(r.eventDate || r.date || '').trim();
  return {
    id: String(r.id),
    category: String(r.category || ''),
    description: String(r.description || ''),
    budget: Number(r.budget) || 0,
    location: String(r.location || ''),
    date: eventDate,
    eventDate,
    guestCount: r.guestCount != null ? Number(r.guestCount) : undefined,
    specialRequirements: r.specialRequirements != null ? String(r.specialRequirements) : undefined,
    status: (r.status === 'awarded' ? 'awarded' : 'open') as QuoteRequest['status'],
    vendors: Array.isArray(r.vendors) ? r.vendors : [],
    createdAt: String(r.createdAt || ''),
  };
}

export function useQuoteGenerator(): UseQuoteGeneratorReturn {
  const { user } = useAuth();
  const planningHydration = usePlanningHydration();
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [matchedVendors, setMatchedVendors] = useState<VendorMatch[]>([]);
  const [quoteResponses] = useState<QuoteResponse[]>([]);

  const refreshQuoteRequests = useCallback(async () => {
    if (!user) {
      setQuoteRequests([]);
      return;
    }
    try {
      const res = await fetch('/api/user/quote-requests', { credentials: 'include', cache: 'no-store' });
      const j = await res.json();
      if (!res.ok || !j?.success) {
        setQuoteRequests([]);
        return;
      }
      const rows = Array.isArray(j.data) ? j.data : [];
      setQuoteRequests(rows.map(mapApiToQuoteRequest));
    } catch {
      setQuoteRequests([]);
    }
  }, [user?.id, planningHydration]);

  useEffect(() => {
    void refreshQuoteRequests();
  }, [refreshQuoteRequests]);

  const createQuoteRequest = async (
    request: Omit<QuoteRequest, 'id' | 'createdAt' | 'status' | 'vendors' | 'date'> & { date: string },
  ) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/quote-requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: request.category,
          description: request.description,
          budget: request.budget,
          location: request.location,
          date: request.date,
          guestCount: request.guestCount,
          specialRequirements: request.specialRequirements,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.success) {
        setError(String(j?.error || 'Failed to create quote request'));
        return;
      }
      if (j.data) {
        setQuoteRequests((prev) => [mapApiToQuoteRequest(j.data), ...prev]);
      } else {
        await refreshQuoteRequests();
      }
      void searchVendors(request.category, request.location, request.budget);
    } catch (err) {
      setError('Failed to create quote request');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchVendors = async (category: string, location: string, budget: number) => {
    setIsSearching(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.set('search', category);
      const res = await fetch(`/api/vendors?${params.toString()}`, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok || !j?.success || !Array.isArray(j.data)) {
        setMatchedVendors([]);
        return;
      }
      const list: VendorMatch[] = j.data.slice(0, 12).map((v: any) => {
        const services = Array.isArray(v.services) ? v.services : [];
        const first = services[0];
        const min = first ? Number(first.price) || 0 : 0;
        return {
          id: String(v.id),
          name: String(v.businessName || v.name || 'Vendor'),
          category: String(v.category || category),
          location: String(v.location || location),
          rating: Number(v.rating) || 0,
          priceRange: { min: min || 0, max: Math.max(min, budget) || min + 1000 },
          availability: true,
          responseTime: '—',
          description: String(v.description || '').slice(0, 200),
          contact: {
            email: String(v.email || v.contactInfo?.email || ''),
            phone: String(v.phone || v.contactInfo?.phone || ''),
          },
        };
      });
      setMatchedVendors(list);
    } catch (err) {
      setError('Failed to search vendors');
      setMatchedVendors([]);
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const updateQuoteRequest = async (id: string, request: Partial<QuoteRequest>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      setQuoteRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...request } : r)));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuoteRequest = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      setQuoteRequests((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setIsLoading(false);
    }
  };

  const acceptQuote = async (_quoteId: string) => {
    /* Real approvals use /api/user/quotes — UserQuotesManager */
  };

  const declineQuote = async (_quoteId: string) => {
    /* No-op: legacy local mock */
  };

  return {
    quoteRequests,
    createQuoteRequest,
    updateQuoteRequest,
    deleteQuoteRequest,
    matchedVendors,
    searchVendors,
    quoteResponses,
    acceptQuote,
    declineQuote,
    isLoading,
    error,
    isSearching,
    refreshQuoteRequests,
  };
}
