'use client';

import { useState, useEffect } from 'react';

interface AdminActivity {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

interface UseAdminActivityReturn {
  activities: AdminActivity[];
  logActivity: (action: string, resource: string, details: string, resourceId?: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function useAdminActivity(): UseAdminActivityReturn {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock activities
      const mockActivities: AdminActivity[] = [
        {
          id: '1',
          adminId: 'admin-1',
          adminName: 'Admin User',
          action: 'CREATE',
          resource: 'User',
          resourceId: 'user-123',
          details: 'Created new user account for john.doe@example.com',
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        {
          id: '2',
          adminId: 'admin-1',
          adminName: 'Admin User',
          action: 'UPDATE',
          resource: 'Vendor',
          resourceId: 'vendor-456',
          details: 'Updated vendor status from pending to approved',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        {
          id: '3',
          adminId: 'admin-1',
          adminName: 'Admin User',
          action: 'DELETE',
          resource: 'Booking',
          resourceId: 'booking-789',
          details: 'Deleted booking for cancelled event',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      ];
      
      setActivities(mockActivities);
    } catch (err) {
      setError('Failed to load admin activities');
    } finally {
      setIsLoading(false);
    }
  };

  const logActivity = (action: string, resource: string, details: string, resourceId?: string) => {
    const newActivity: AdminActivity = {
      id: Date.now().toString(),
      adminId: 'admin-1', // This would come from auth context
      adminName: 'Admin User', // This would come from auth context
      action,
      resource,
      resourceId,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100', // This would be detected
      userAgent: navigator.userAgent,
    };

    setActivities(prev => [newActivity, ...prev]);
    
    // In a real app, this would send to the backend
    console.log('Admin Activity Logged:', newActivity);
  };

  return {
    activities,
    logActivity,
    isLoading,
    error,
  };
}


