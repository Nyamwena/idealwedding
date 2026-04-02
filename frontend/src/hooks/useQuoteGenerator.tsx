'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loadUserJsonArray, saveUserJsonArray, PLANNING_PARTS } from '@/lib/userPlanningStorage';

// Quote Generator Interfaces
export interface QuoteRequest {
  id: string;
  category: string;
  description: string;
  budget: number;
  location: string;
  date: string;
  guestCount?: number;
  specialRequirements?: string;
  status: 'pending' | 'quoted' | 'booked';
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
  // Quote Requests
  quoteRequests: QuoteRequest[];
  createQuoteRequest: (request: Omit<QuoteRequest, 'id' | 'createdAt' | 'status' | 'vendors'>) => Promise<void>;
  updateQuoteRequest: (id: string, request: Partial<QuoteRequest>) => Promise<void>;
  deleteQuoteRequest: (id: string) => Promise<void>;
  
  // Vendor Matching
  matchedVendors: VendorMatch[];
  searchVendors: (category: string, location: string, budget: number) => Promise<void>;
  
  // Quote Responses
  quoteResponses: QuoteResponse[];
  acceptQuote: (quoteId: string) => Promise<void>;
  declineQuote: (quoteId: string) => Promise<void>;
  
  // Loading and Error States
  isLoading: boolean;
  error: string | null;
  isSearching: boolean;
}

export function useQuoteGenerator(): UseQuoteGeneratorReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for quote data
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [matchedVendors, setMatchedVendors] = useState<VendorMatch[]>([]);
  const [quoteResponses, setQuoteResponses] = useState<QuoteResponse[]>([]);

  useEffect(() => {
    if (!user) {
      setQuoteRequests([]);
      setQuoteResponses([]);
      return;
    }
    setQuoteRequests(loadUserJsonArray<QuoteRequest>(user.id, PLANNING_PARTS.quoteGenRequests));
    setQuoteResponses(loadUserJsonArray<QuoteResponse>(user.id, PLANNING_PARTS.quoteGenResponses));
  }, [user]);

  // Mock vendor data for matching
  const mockVendors: VendorMatch[] = [
    {
      id: 'vendor1',
      name: 'Elite Wedding Photography',
      category: 'Photography',
      location: 'Napa Valley, CA',
      rating: 4.8,
      priceRange: { min: 2000, max: 3500 },
      availability: true,
      responseTime: '2 hours',
      description: 'Professional wedding photography with 10+ years of experience.',
      contact: {
        email: 'contact@elitephoto.com',
        phone: '+1 (555) 123-4567'
      },
      portfolio: ['/images/portfolio/1.jpg', '/images/portfolio/2.jpg']
    },
    {
      id: 'vendor2',
      name: 'Garden Catering Co.',
      category: 'Catering',
      location: 'Napa Valley, CA',
      rating: 4.6,
      priceRange: { min: 45, max: 85 },
      availability: true,
      responseTime: '4 hours',
      description: 'Farm-to-table catering with locally sourced ingredients.',
      contact: {
        email: 'info@gardencatering.com',
        phone: '+1 (555) 234-5678'
      }
    },
    {
      id: 'vendor3',
      name: 'Blossom Floral Design',
      category: 'Flowers',
      location: 'Napa Valley, CA',
      rating: 4.9,
      priceRange: { min: 1500, max: 3000 },
      availability: true,
      responseTime: '1 hour',
      description: 'Custom floral arrangements for your special day.',
      contact: {
        email: 'hello@blossomfloral.com',
        phone: '+1 (555) 345-6789'
      }
    },
    {
      id: 'vendor4',
      name: 'Harmony Music',
      category: 'Entertainment',
      location: 'Napa Valley, CA',
      rating: 4.7,
      priceRange: { min: 800, max: 1500 },
      availability: true,
      responseTime: '3 hours',
      description: 'Live music and DJ services for your wedding celebration.',
      contact: {
        email: 'bookings@harmonymusic.com',
        phone: '+1 (555) 456-7890'
      }
    }
  ];

  // Create Quote Request
  const createQuoteRequest = async (request: Omit<QuoteRequest, 'id' | 'createdAt' | 'status' | 'vendors'>) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRequest: QuoteRequest = {
        ...request,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        vendors: []
      };
      
      setQuoteRequests(prev => {
        const next = [...prev, newRequest];
        if (user) saveUserJsonArray(user.id, PLANNING_PARTS.quoteGenRequests, next);
        return next;
      });
      
      // Automatically search for matching vendors
      await searchVendors(request.category, request.location, request.budget);
      
      // Simulate sending emails to vendors
      await sendVendorEmails(newRequest);
      
    } catch (err) {
      setError('Failed to create quote request');
      console.error('Error creating quote request:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Search Vendors
  const searchVendors = async (category: string, location: string, budget: number) => {
    setIsSearching(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Filter vendors based on criteria
      const filteredVendors = mockVendors.filter(vendor => {
        const matchesCategory = vendor.category.toLowerCase() === category.toLowerCase();
        const matchesLocation = vendor.location.toLowerCase().includes(location.toLowerCase());
        const matchesBudget = budget >= vendor.priceRange.min && budget <= vendor.priceRange.max * 1.5;
        
        return matchesCategory && matchesLocation && matchesBudget && vendor.availability;
      });
      
      // Sort by rating and response time
      const sortedVendors = filteredVendors.sort((a, b) => {
        if (a.rating !== b.rating) return b.rating - a.rating;
        return a.responseTime.localeCompare(b.responseTime);
      });
      
      setMatchedVendors(sortedVendors);
      
    } catch (err) {
      setError('Failed to search vendors');
      console.error('Error searching vendors:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Send Vendor Emails (Simulation)
  const sendVendorEmails = async (request: QuoteRequest) => {
    try {
      // Simulate email sending to matched vendors
      const emailsToSend = matchedVendors.map(vendor => ({
        to: vendor.contact.email,
        subject: `New Quote Request - ${request.category}`,
        body: `
          Hello ${vendor.name},
          
          You have received a new quote request for your ${vendor.category} services:
          
          Event Details:
          - Date: ${request.date}
          - Location: ${request.location}
          - Budget: $${request.budget}
          - Description: ${request.description}
          ${request.guestCount ? `- Guest Count: ${request.guestCount}` : ''}
          ${request.specialRequirements ? `- Special Requirements: ${request.specialRequirements}` : ''}
          
          Please respond with your quote within 24 hours.
          
          Best regards,
          Ideal Weddings Team
        `
      }));
      
      console.log('Sending emails to vendors:', emailsToSend);
      
      // Simulate vendor responses after some time
      setTimeout(() => {
        generateVendorResponses(request.id);
      }, 5000);
      
    } catch (err) {
      console.error('Error sending vendor emails:', err);
    }
  };

  // Generate Vendor Responses (Simulation)
  const generateVendorResponses = async (requestId: string) => {
    try {
      const responses = matchedVendors.slice(0, 2).map((vendor, index) => ({
        id: `response_${Date.now()}_${index}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        quoteRequestId: requestId,
        price: Math.floor(vendor.priceRange.min + Math.random() * (vendor.priceRange.max - vendor.priceRange.min)),
        description: `Professional ${vendor.category} services for your special day`,
        inclusions: [
          'Full day coverage',
          'High-resolution photos',
          'Online gallery',
          'Basic editing'
        ],
        exclusions: [
          'Additional hours',
          'Premium editing',
          'Physical prints'
        ],
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      }));
      
      setQuoteResponses(prev => {
        const next = [...prev, ...responses];
        try {
          const uid = user?.id;
          if (uid != null) saveUserJsonArray(uid, PLANNING_PARTS.quoteGenResponses, next);
        } catch {
          /* ignore */
        }
        return next;
      });
      
    } catch (err) {
      console.error('Error generating vendor responses:', err);
    }
  };

  // Update Quote Request
  const updateQuoteRequest = async (id: string, request: Partial<QuoteRequest>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setQuoteRequests(prev => {
        const next = prev.map(r => (r.id === id ? { ...r, ...request } : r));
        saveUserJsonArray(user.id, PLANNING_PARTS.quoteGenRequests, next);
        return next;
      });
    } catch (err) {
      setError('Failed to update quote request');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Quote Request
  const deleteQuoteRequest = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setQuoteRequests(prev => {
        const next = prev.filter(r => r.id !== id);
        saveUserJsonArray(user.id, PLANNING_PARTS.quoteGenRequests, next);
        return next;
      });
      setQuoteResponses(prev => {
        const next = prev.filter(r => r.quoteRequestId !== id);
        saveUserJsonArray(user.id, PLANNING_PARTS.quoteGenResponses, next);
        return next;
      });
    } catch (err) {
      setError('Failed to delete quote request');
    } finally {
      setIsLoading(false);
    }
  };

  // Accept Quote
  const acceptQuote = async (quoteId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setQuoteResponses(prevResp => {
        const nextResp = prevResp.map(r =>
          r.id === quoteId ? { ...r, status: 'accepted' as const } : r
        );
        const match = prevResp.find(r => r.id === quoteId);
        if (match) {
          setQuoteRequests(prevReq => {
            const nextReq = prevReq.map(r =>
              r.id === match.quoteRequestId ? { ...r, status: 'booked' as const } : r
            );
            saveUserJsonArray(user.id, PLANNING_PARTS.quoteGenRequests, nextReq);
            return nextReq;
          });
        }
        saveUserJsonArray(user.id, PLANNING_PARTS.quoteGenResponses, nextResp);
        return nextResp;
      });
    } catch (err) {
      setError('Failed to accept quote');
    } finally {
      setIsLoading(false);
    }
  };

  // Decline Quote
  const declineQuote = async (quoteId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setQuoteResponses(prev => {
        const next = prev.map(r =>
          r.id === quoteId ? { ...r, status: 'declined' as const } : r
        );
        saveUserJsonArray(user.id, PLANNING_PARTS.quoteGenResponses, next);
        return next;
      });
    } catch (err) {
      setError('Failed to decline quote');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Quote Requests
    quoteRequests,
    createQuoteRequest,
    updateQuoteRequest,
    deleteQuoteRequest,
    
    // Vendor Matching
    matchedVendors,
    searchVendors,
    
    // Quote Responses
    quoteResponses,
    acceptQuote,
    declineQuote,
    
    // Loading and Error States
    isLoading,
    error,
    isSearching
  };
}
