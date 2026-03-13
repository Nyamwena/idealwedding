'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface VendorNotification {
  id: string;
  type: 'lead' | 'booking' | 'review' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    lead: number;
    booking: number;
    review: number;
    payment: number;
    system: number;
  };
}

export function useVendorNotifications() {
  const { user, isVendor } = useAuth();
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byType: {
      lead: 0,
      booking: 0,
      review: 0,
      payment: 0,
      system: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVendor && user) {
      fetchNotifications();
    }
  }, [isVendor, user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock notifications data
      const mockNotifications: VendorNotification[] = [
        {
          id: 'notif_001',
          type: 'lead',
          title: 'New Lead Received',
          message: 'You have received a new lead from Sarah & John for Photography services.',
          timestamp: '2024-09-24T10:30:00Z',
          isRead: false,
          priority: 'high',
          actionUrl: '/vendor/leads',
          actionText: 'View Lead',
        },
        {
          id: 'notif_002',
          type: 'review',
          title: 'New Review Received',
          message: 'Emily & Michael left a 5-star review for your services.',
          timestamp: '2024-09-23T14:20:00Z',
          isRead: false,
          priority: 'medium',
          actionUrl: '/vendor/reviews',
          actionText: 'View Review',
        },
        {
          id: 'notif_003',
          type: 'payment',
          title: 'Payment Received',
          message: 'Payment of $1,200 has been received for Amanda & Robert wedding.',
          timestamp: '2024-09-22T09:15:00Z',
          isRead: true,
          priority: 'medium',
          actionUrl: '/vendor/payments',
          actionText: 'View Payment',
        },
        {
          id: 'notif_004',
          type: 'booking',
          title: 'Booking Confirmed',
          message: 'Your booking with Jessica & David has been confirmed for January 10, 2025.',
          timestamp: '2024-09-21T16:45:00Z',
          isRead: true,
          priority: 'high',
          actionUrl: '/vendor/bookings',
          actionText: 'View Booking',
        },
        {
          id: 'notif_005',
          type: 'system',
          title: 'Profile Update Required',
          message: 'Please complete your profile to improve your visibility to potential clients.',
          timestamp: '2024-09-20T11:30:00Z',
          isRead: false,
          priority: 'low',
          actionUrl: '/vendor/profile',
          actionText: 'Update Profile',
        },
      ];

      setNotifications(mockNotifications);

      // Calculate stats
      const total = mockNotifications.length;
      const unread = mockNotifications.filter(n => !n.isRead).length;
      const byType = mockNotifications.reduce((acc, notif) => {
        acc[notif.type]++;
        return acc;
      }, {
        lead: 0,
        booking: 0,
        review: 0,
        payment: 0,
        system: 0,
      });

      setStats({ total, unread, byType });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      ));

      // Update stats
      const updatedNotifications = notifications.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      );
      
      const unread = updatedNotifications.filter(n => !n.isRead).length;
      setStats(prev => ({ ...prev, unread }));

      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setStats(prev => ({ ...prev, unread: 0 }));

      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Update stats
      const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
      const total = updatedNotifications.length;
      const unread = updatedNotifications.filter(n => !n.isRead).length;
      
      setStats(prev => ({ ...prev, total, unread }));

      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  };

  const simulateNewLead = async () => {
    try {
      const newNotification: VendorNotification = {
        id: `notif_${Date.now()}`,
        type: 'lead',
        title: 'New Lead Received',
        message: 'You have received a new lead from a potential client.',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'high',
        actionUrl: '/vendor/leads',
        actionText: 'View Lead',
      };

      setNotifications(prev => [newNotification, ...prev]);
      
      // Update stats
      const updatedNotifications = [newNotification, ...notifications];
      const total = updatedNotifications.length;
      const unread = updatedNotifications.filter(n => !n.isRead).length;
      
      setStats(prev => ({
        total,
        unread,
        byType: {
          ...prev.byType,
          lead: prev.byType.lead + 1,
        },
      }));

      return true;
    } catch (error) {
      console.error('Failed to simulate new lead notification:', error);
      return false;
    }
  };

  const getNotificationsByType = (type: VendorNotification['type']) => {
    return notifications.filter(notif => notif.type === type);
  };

  const getRecentNotifications = (limit: number = 5) => {
    return notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(notif => !notif.isRead);
  };

  return {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    simulateNewLead,
    getNotificationsByType,
    getRecentNotifications,
    getUnreadNotifications,
    refetch: fetchNotifications,
  };
}