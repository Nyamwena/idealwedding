'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface VendorProfile {
  id: string;
  businessName: string;
  logo?: string;
  description: string;
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
  serviceCategories: string[];
  locationsServed: {
    city: string;
    state: string;
    radius: number; // in miles
  }[];
  portfolio: {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    description: string;
    category: string;
    isPublic: boolean;
  }[];
  testimonials: {
    id: string;
    clientName: string;
    clientEmail: string;
    rating: number;
    review: string;
    date: string;
    isVerified: boolean;
    isPublic: boolean;
  }[];
  availability: {
    date: string;
    status: 'available' | 'booked' | 'unavailable';
    eventType?: string;
    notes?: string;
  }[];
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  businessInfo: {
    yearsInBusiness: number;
    teamSize: number;
    languages: string[];
    certifications: string[];
    insurance: boolean;
    licenseNumber?: string;
  };
  settings: {
    autoAcceptLeads: boolean;
    leadNotificationEmail: boolean;
    leadNotificationSMS: boolean;
    profileVisibility: 'public' | 'private' | 'unlisted';
    showPricing: boolean;
    allowDirectBooking: boolean;
  };
  stats: {
    profileViews: number;
    portfolioViews: number;
    inquiryCount: number;
    responseRate: number;
    averageResponseTime: number; // in hours
  };
  isApproved: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  lastUpdated: string;
}

export function useVendorProfile() {
  const { user, isVendor } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isVendor && user) {
      fetchProfile();
    }
  }, [isVendor, user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/profile');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch vendor profile');
      }
      
      setProfile(result.data);
    } catch (error) {
      console.error('Failed to fetch vendor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<VendorProfile>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update vendor profile');
      }

      setProfile(result.data);
      return { success: true };
    } catch (error) {
      console.error('Failed to update profile:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  const addService = async (service: Omit<VendorProfile['services'][0], 'id'>) => {
    try {
      const newService = {
        ...service,
        id: `service_${Date.now()}`,
      };

      // Update local state first
      const updatedProfile = profile ? {
        ...profile,
        services: [...profile.services, newService],
        lastUpdated: new Date().toISOString(),
      } : null;

      setProfile(updatedProfile);

      // Save to API
      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          services: updatedProfile?.services,
          lastUpdated: updatedProfile?.lastUpdated,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save service to API');
      }

      return { success: true, service: newService };
    } catch (error) {
      console.error('Failed to add service:', error);
      // Revert local state on error
      await fetchProfile();
      return { success: false, error: error.message };
    }
  };

  const updateService = async (serviceId: string, updates: Partial<VendorProfile['services'][0]>) => {
    try {
      // Update local state first
      const updatedProfile = profile ? {
        ...profile,
        services: profile.services.map(service => 
          service.id === serviceId ? { ...service, ...updates } : service
        ),
        lastUpdated: new Date().toISOString(),
      } : null;

      setProfile(updatedProfile);

      // Save to API
      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          services: updatedProfile?.services,
          lastUpdated: updatedProfile?.lastUpdated,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update service in API');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update service:', error);
      // Revert local state on error
      await fetchProfile();
      return { success: false, error: error.message };
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      // Update local state first
      const updatedProfile = profile ? {
        ...profile,
        services: profile.services.filter(service => service.id !== serviceId),
        lastUpdated: new Date().toISOString(),
      } : null;

      setProfile(updatedProfile);

      // Save to API
      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          services: updatedProfile?.services,
          lastUpdated: updatedProfile?.lastUpdated,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete service from API');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to delete service:', error);
      // Revert local state on error
      await fetchProfile();
      return { success: false, error: error.message };
    }
  };

  const addPortfolioItem = async (item: Omit<VendorProfile['portfolio'][0], 'id'>) => {
    try {
      const newItem = {
        ...item,
        id: `portfolio_${Date.now()}`,
      };

      // Update local state first
      const updatedProfile = profile ? {
        ...profile,
        portfolio: [...profile.portfolio, newItem],
        lastUpdated: new Date().toISOString(),
      } : null;

      setProfile(updatedProfile);

      // Save to API
      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolio: updatedProfile?.portfolio,
          lastUpdated: updatedProfile?.lastUpdated,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save portfolio item to API');
      }

      return { success: true, item: newItem };
    } catch (error) {
      console.error('Failed to add portfolio item:', error);
      // Revert local state on error
      await fetchProfile();
      return { success: false, error: error.message };
    }
  };

  const updateAvailability = async (date: string, status: VendorProfile['availability'][0]['status'], eventType?: string, notes?: string) => {
    try {
      setProfile(prev => {
        if (!prev) return null;

        const existingIndex = prev.availability.findIndex(a => a.date === date);
        const newAvailability = {
          date,
          status,
          eventType,
          notes,
        };

        let updatedAvailability;
        if (existingIndex >= 0) {
          updatedAvailability = prev.availability.map((item, index) => 
            index === existingIndex ? newAvailability : item
          );
        } else {
          updatedAvailability = [...prev.availability, newAvailability];
        }

        return {
          ...prev,
          availability: updatedAvailability,
          lastUpdated: new Date().toISOString(),
        };
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to update availability:', error);
      return { success: false, error: error.message };
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const logoUrl = `/uploads/logos/${Date.now()}-${file.name}`;
      
      setProfile(prev => prev ? {
        ...prev,
        logo: logoUrl,
        lastUpdated: new Date().toISOString(),
      } : null);

      return { success: true, logoUrl };
    } catch (error) {
      console.error('Failed to upload logo:', error);
      return { success: false, error: error.message };
    }
  };

  const getProfileCompletion = () => {
    if (!profile) return 0;

    const fields = [
      profile.businessName,
      profile.description,
      profile.logo,
      profile.services.length > 0,
      profile.portfolio.length > 0,
      profile.contactInfo.email,
      profile.contactInfo.phone,
      profile.businessInfo.yearsInBusiness > 0,
    ];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getPublicProfile = () => {
    if (!profile) return null;

    return {
      id: profile.id,
      businessName: profile.businessName,
      logo: profile.logo,
      description: profile.description,
      services: profile.services.filter(s => s.isPremium || !s.isPremium), // Show all services
      serviceCategories: profile.serviceCategories,
      locationsServed: profile.locationsServed,
      portfolio: profile.portfolio.filter(p => p.isPublic),
      testimonials: profile.testimonials.filter(t => t.isPublic),
      contactInfo: {
        email: profile.contactInfo.email,
        phone: profile.contactInfo.phone,
        website: profile.contactInfo.website,
        socialMedia: profile.contactInfo.socialMedia,
      },
      businessInfo: {
        yearsInBusiness: profile.businessInfo.yearsInBusiness,
        teamSize: profile.businessInfo.teamSize,
        languages: profile.businessInfo.languages,
        certifications: profile.businessInfo.certifications,
        insurance: profile.businessInfo.insurance,
      },
      stats: {
        profileViews: profile.stats.profileViews,
        portfolioViews: profile.stats.portfolioViews,
        responseRate: profile.stats.responseRate,
        averageResponseTime: profile.stats.averageResponseTime,
      },
      isApproved: profile.isApproved,
    };
  };

  return {
    profile,
    loading,
    saving,
    updateProfile,
    addService,
    updateService,
    deleteService,
    addPortfolioItem,
    updateAvailability,
    uploadLogo,
    getProfileCompletion,
    getPublicProfile,
    refetch: fetchProfile,
  };
}
