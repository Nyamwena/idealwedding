'use client';

import { useState, useEffect, useCallback } from 'react';
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

const emptyByType = (): NotificationStats['byType'] => ({
  lead: 0,
  booking: 0,
  review: 0,
  payment: 0,
  system: 0,
});

export function useVendorNotifications() {
  const { isVendor } = useAuth();
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byType: emptyByType(),
  });
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/notifications', { credentials: 'include' });
      const result = await response.json();
      if (!response.ok) {
        setNotifications([]);
        setStats({ total: 0, unread: 0, byType: emptyByType() });
        return;
      }
      setNotifications(result.data || []);
      const bt = result.stats?.byType || {};
      setStats({
        total: result.stats?.total ?? 0,
        unread: result.stats?.unread ?? 0,
        byType: {
          lead: bt.lead ?? 0,
          booking: bt.booking ?? 0,
          review: bt.review ?? 0,
          payment: bt.payment ?? 0,
          system: bt.system ?? 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setStats({ total: 0, unread: 0, byType: emptyByType() });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isVendor) {
      fetchNotifications();
    }
  }, [isVendor, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/vendor/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'markRead', id: notificationId }),
      });
      if (!response.ok) return false;
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/vendor/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      if (!response.ok) return false;
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return false;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch('/api/vendor/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'delete', id: notificationId }),
      });
      if (!response.ok) return false;
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  };

  const simulateNewLead = async () => {
    try {
      const response = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'lead',
          title: 'New lead (demo)',
          message: 'This is a sample notification tied to your vendor account.',
          priority: 'high',
          actionUrl: '/vendor/leads',
          actionText: 'View leads',
        }),
      });
      if (!response.ok) return false;
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Failed to simulate notification:', error);
      return false;
    }
  };

  const getNotificationsByType = (type: VendorNotification['type']) => {
    return notifications.filter((notif) => notif.type === type);
  };

  const getRecentNotifications = (limit: number = 5) => {
    return notifications
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  const getUnreadNotifications = () => {
    return notifications.filter((notif) => !notif.isRead);
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
