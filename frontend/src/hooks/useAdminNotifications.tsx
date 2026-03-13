'use client';

import { useState, useEffect } from 'react';

interface AdminNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

interface UseAdminNotificationsReturn {
  notifications: AdminNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export function useAdminNotifications(): UseAdminNotificationsReturn {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock notifications
    const mockNotifications: AdminNotification[] = [
      {
        id: '1',
        type: 'warning',
        title: 'High Server Load',
        message: 'Server CPU usage is above 80% for the last 15 minutes.',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false,
        action: {
          label: 'View Metrics',
          href: '/admin/analytics',
        },
      },
      {
        id: '2',
        type: 'info',
        title: 'New Vendor Application',
        message: 'Elegant Flowers has submitted a new vendor application.',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        read: false,
        action: {
          label: 'Review',
          href: '/admin/vendors',
        },
      },
      {
        id: '3',
        type: 'success',
        title: 'Backup Completed',
        message: 'Daily database backup completed successfully.',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        read: true,
      },
      {
        id: '4',
        type: 'error',
        title: 'Payment Processing Error',
        message: 'Failed to process payment for booking #12345.',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        read: false,
        action: {
          label: 'Investigate',
          href: '/admin/payments',
        },
      },
      {
        id: '5',
        type: 'info',
        title: 'System Update Available',
        message: 'A new system update is available for installation.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: true,
        action: {
          label: 'Update',
          href: '/admin/settings',
        },
      },
    ];
    
    setNotifications(mockNotifications);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const addNotification = (notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AdminNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAll,
  };
}


