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

  // Prevent cross-user vendor notification leakage by scoping localStorage keys per user.
  const userNotificationsKey = user ? `vendor-notifications:${user.id}` : null;

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

  const persistNotifications = (items: VendorNotification[]) => {
    if (!userNotificationsKey) return;
    try {
      localStorage.setItem(userNotificationsKey, JSON.stringify(items));
    } catch {
      // Ignore storage failures (private mode/quota).
    }
  };

  useEffect(() => {
    if (isVendor && user) {
      fetchNotifications();
    }
  }, [isVendor, user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      if (!userNotificationsKey) {
        setNotifications([]);
        setStats({
          total: 0,
          unread: 0,
          byType: { lead: 0, booking: 0, review: 0, payment: 0, system: 0 },
        });
        return;
      }

      const saved = localStorage.getItem(userNotificationsKey);
      const parsed = saved ? (JSON.parse(saved) as VendorNotification[]) : [];
      const safe = Array.isArray(parsed) ? parsed : [];

      setNotifications(safe);

      // Calculate stats
      const total = safe.length;
      const unread = safe.filter(n => !n.isRead).length;
      const byType = safe.reduce((acc, notif) => {
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
      setNotifications(prev => {
        const updated = prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif,
        );
        persistNotifications(updated);
        return updated;
      });

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
      setNotifications(prev => {
        const updated = prev.map(notif => ({ ...notif, isRead: true }));
        persistNotifications(updated);
        return updated;
      });
      setStats(prev => ({ ...prev, unread: 0 }));

      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev => {
        const updated = prev.filter(notif => notif.id !== notificationId);
        persistNotifications(updated);
        return updated;
      });
      
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

      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        persistNotifications(updated);
        return updated;
      });
      
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