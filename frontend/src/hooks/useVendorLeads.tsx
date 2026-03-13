'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useVendorCredits } from './useVendorCredits';

interface VendorLead {
  id: string;
  coupleName: string;
  coupleEmail: string;
  couplePhone: string;
  weddingDate: string;
  location: string;
  serviceCategory: string;
  budget: number;
  description: string;
  timestamp: string;
  status: 'new' | 'contacted' | 'quoted' | 'booked' | 'declined';
  referralTag?: string;
  creditsUsed: number;
  responseDeadline: string;
}

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  quotedLeads: number;
  bookedLeads: number;
  conversionRate: number;
  averageResponseTime: number;
}

export function useVendorLeads() {
  const { user, isVendor } = useAuth();
  const { deductCredits, canReceiveLead } = useVendorCredits();
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    quotedLeads: 0,
    bookedLeads: 0,
    conversionRate: 0,
    averageResponseTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVendor && user) {
      fetchLeads();
    }
  }, [isVendor, user]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/leads');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch vendor leads');
      }
      
      setLeads(result.data);

      // Calculate stats
      const totalLeads = result.data.length;
      const newLeads = result.data.filter((lead: VendorLead) => lead.status === 'new').length;
      const contactedLeads = result.data.filter((lead: VendorLead) => lead.status === 'contacted').length;
      const quotedLeads = result.data.filter((lead: VendorLead) => lead.status === 'quoted').length;
      const bookedLeads = result.data.filter((lead: VendorLead) => lead.status === 'booked').length;
      const conversionRate = totalLeads > 0 ? (bookedLeads / totalLeads) * 100 : 0;

      setStats({
        totalLeads,
        newLeads,
        contactedLeads,
        quotedLeads,
        bookedLeads,
        conversionRate,
        averageResponseTime: 2.5, // hours
      });
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: VendorLead['status']) => {
    try {
      const response = await fetch('/api/vendor/leads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          status: newStatus,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update lead status');
      }

      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

      // Recalculate stats
      const updatedLeads = leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      );
      
      const totalLeads = updatedLeads.length;
      const bookedLeads = updatedLeads.filter(lead => lead.status === 'booked').length;
      const conversionRate = totalLeads > 0 ? (bookedLeads / totalLeads) * 100 : 0;

      setStats(prev => ({
        ...prev,
        conversionRate,
      }));

      return true;
    } catch (error) {
      console.error('Failed to update lead status:', error);
      return false;
    }
  };

  const simulateNewLead = async () => {
    if (!canReceiveLead()) {
      return false;
    }

    try {
      // Simulate receiving a new lead
      const newLead: VendorLead = {
        id: `lead_${Date.now()}`,
        coupleName: 'New Couple',
        coupleEmail: 'new.couple@email.com',
        couplePhone: '+1 (555) 999-0000',
        weddingDate: '2025-06-15',
        location: 'San Francisco, CA',
        serviceCategory: 'Photography',
        budget: 2000,
        description: 'Looking for a wedding photographer for our summer wedding.',
        timestamp: new Date().toISOString(),
        status: 'new',
        referralTag: `REF-2024-${Date.now()}`,
        creditsUsed: 5,
        responseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
      };

      // Deduct credits
      const creditDeducted = await deductCredits(
        5,
        `Lead received from ${newLead.coupleName} - ${newLead.serviceCategory}`,
        newLead.id,
        newLead.coupleName
      );

      if (creditDeducted) {
        setLeads(prev => [newLead, ...prev]);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalLeads: prev.totalLeads + 1,
          newLeads: prev.newLeads + 1,
        }));

        // Send notification (simulate)
        sendLeadNotification(newLead);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to simulate new lead:', error);
      return false;
    }
  };

  const sendLeadNotification = async (lead: VendorLead) => {
    try {
      // Simulate email notification
      console.log(`📧 Email notification sent to vendor about new lead from ${lead.coupleName}`);
      console.log(`🏷️ Referral Tag: ${lead.referralTag}`);
      
      // In a real implementation, this would send an actual email
      // await emailService.sendLeadNotification(vendorEmail, lead);
    } catch (error) {
      console.error('Failed to send lead notification:', error);
    }
  };

  const getLeadsByStatus = (status: VendorLead['status']) => {
    return leads.filter(lead => lead.status === status);
  };

  const getRecentLeads = (limit: number = 5) => {
    return leads
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  const getPerformanceInsights = () => {
    const categoryStats = leads.reduce((acc, lead) => {
      acc[lead.serviceCategory] = (acc[lead.serviceCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationStats = leads.reduce((acc, lead) => {
      acc[lead.location] = (acc[lead.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    const topLocation = Object.entries(locationStats)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    return {
      mostActiveCategory,
      topLocation,
      categoryStats,
      locationStats,
    };
  };

  return {
    leads,
    stats,
    loading,
    updateLeadStatus,
    simulateNewLead,
    getLeadsByStatus,
    getRecentLeads,
    getPerformanceInsights,
    refetch: fetchLeads,
  };
}
