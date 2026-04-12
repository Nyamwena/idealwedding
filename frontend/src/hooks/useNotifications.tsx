'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Notification Interfaces
export interface Notification {
  id: string;
  type: 'quote' | 'rsvp' | 'vendor' | 'task' | 'budget' | 'guest' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    vendorId?: string;
    guestId?: string;
    taskId?: string;
    quoteId?: string;
    amount?: number;
    [key: string]: any;
  };
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  quoteAlerts: boolean;
  rsvpAlerts: boolean;
  taskReminders: boolean;
  budgetAlerts: boolean;
  vendorUpdates: boolean;
}

interface UseNotificationsReturn {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Notification Management
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  getNotificationsByType: (type: Notification['type']) => Notification[];
  getUnreadNotifications: () => Notification[];
  
  // Settings
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  
  // Real-time Simulation
  simulateRealTimeNotifications: () => void;
  
  // Loading and Error States
  isLoading: boolean;
  error: string | null;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Prevent cross-user notification leakage by scoping localStorage keys per user.
  const userNotificationsKey = user ? `user-notifications:${user.id}` : null;
  const userNotificationSettingsKey = user ? `notification-settings:${user.id}` : null;

  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    quoteAlerts: true,
    rsvpAlerts: true,
    taskReminders: true,
    budgetAlerts: true,
    vendorUpdates: true
  });

  const persistNotifications = (items: Notification[]) => {
    if (!userNotificationsKey) return;
    try {
      localStorage.setItem(userNotificationsKey, JSON.stringify(items));
    } catch {
      // Ignore storage failures (private mode / quota). UI still works for the session.
    }
  };

  const persistSettings = (items: NotificationSettings) => {
    if (!userNotificationSettingsKey) return;
    try {
      localStorage.setItem(userNotificationSettingsKey, JSON.stringify(items));
    } catch {
      // Ignore storage failures.
    }
  };

  // Load notifications and settings on mount
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    void loadNotifications();
    void loadSettings();

    // Simulate real-time notifications (client-side demo) - persisted per user.
    const interval = setInterval(simulateRealTimeNotifications, 30000); // Every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!userNotificationsKey) {
        setNotifications([]);
        return;
      }

      // Load from user-scoped storage (if nothing exists, default to empty).
      const saved = localStorage.getItem(userNotificationsKey);
      const parsed = saved ? (JSON.parse(saved) as Notification[]) : [];
      const safe = Array.isArray(parsed) ? parsed : [];

      setNotifications(safe);
      
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      if (!userNotificationSettingsKey) return;
      const savedSettings = localStorage.getItem(userNotificationSettingsKey);
      if (!savedSettings) return;
      const parsed = JSON.parse(savedSettings);
      if (parsed && typeof parsed === 'object') setSettings(parsed as NotificationSettings);
    } catch (err) {
      console.error('Error loading notification settings:', err);
    }
  };

  // Notification Management Functions
  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isRead: false
      };
      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        persistNotifications(updated);
        return updated;
      });
    } catch (err) {
      setError('Failed to add notification');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setNotifications(prev => {
        const updated = prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        );
        persistNotifications(updated);
        return updated;
      });
    } catch (err) {
      setError('Failed to mark notification as read');
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotifications(prev => {
        const updated = prev.map(notification => ({ ...notification, isRead: true }));
        persistNotifications(updated);
        return updated;
      });
    } catch (err) {
      setError('Failed to mark all notifications as read');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setNotifications(prev => {
        const updated = prev.filter(notification => notification.id !== notificationId);
        persistNotifications(updated);
        return updated;
      });
    } catch (err) {
      setError('Failed to delete notification');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotifications([]);
      persistNotifications([]);
    } catch (err) {
      setError('Failed to clear all notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering Functions
  const getNotificationsByType = (type: Notification['type']) => {
    return notifications.filter(notification => notification.type === type);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(notification => !notification.isRead);
  };

  // Settings Management
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      persistSettings(updatedSettings);
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Simulation
  const simulateRealTimeNotifications = () => {
    if (!user) return;
    // Simulate random notifications for demo purposes
    const notificationTypes: Notification['type'][] = ['quote', 'rsvp', 'vendor', 'task', 'budget'];
    const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    
    // Only add notifications occasionally (10% chance)
    if (Math.random() < 0.1) {
      const mockNotifications = {
        quote: {
          title: 'New Quote Available',
          message: 'A new vendor has sent you a quote for your wedding',
          priority: 'medium' as const
        },
        rsvp: {
          title: 'RSVP Update',
          message: 'A guest has updated their RSVP status',
          priority: 'low' as const
        },
        vendor: {
          title: 'Vendor Message',
          message: 'You have a new message from a vendor',
          priority: 'medium' as const
        },
        task: {
          title: 'Task Reminder',
          message: 'A wedding planning task is due soon',
          priority: 'high' as const
        },
        budget: {
          title: 'Budget Update',
          message: 'Your budget has been updated',
          priority: 'low' as const
        }
      };

      const notification = mockNotifications[randomType];
      if (notification) {
        addNotification({
          type: randomType,
          title: notification.title,
          message: notification.message,
          priority: notification.priority
        });
      }
    }
  };

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    // Notifications
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    
    // Notification Management
    addNotification,
    getNotificationsByType,
    getUnreadNotifications,
    
    // Settings
    settings,
    updateSettings,
    
    // Real-time Simulation
    simulateRealTimeNotifications,
    
    // Loading and Error States
    isLoading,
    error
  };
}
