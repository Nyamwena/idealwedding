'use client';

import { useState, useEffect } from 'react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    quoteAlerts: true,
    rsvpAlerts: true,
    taskReminders: true,
    budgetAlerts: true,
    vendorUpdates: true
  });

  // Load notifications and settings on mount
  useEffect(() => {
    loadNotifications();
    loadSettings();
    
    // Simulate real-time notifications
    const interval = setInterval(simulateRealTimeNotifications, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock notifications
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'quote',
          title: 'New Quote Received',
          message: 'Elite Wedding Photography has sent you a quote for $2,800',
          priority: 'high',
          isRead: false,
          actionUrl: '/dashboard?tab=quotes',
          actionText: 'View Quote',
          metadata: {
            vendorId: 'vendor1',
            quoteId: 'quote1',
            amount: 2800
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          id: '2',
          type: 'rsvp',
          title: 'New RSVP Response',
          message: 'Sarah Johnson has confirmed attendance for your wedding',
          priority: 'medium',
          isRead: false,
          actionUrl: '/dashboard?tab=guests',
          actionText: 'View Guest List',
          metadata: {
            guestId: 'guest2'
          },
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
        },
        {
          id: '3',
          type: 'task',
          title: 'Task Reminder',
          message: 'Book photographer is due in 3 days',
          priority: 'urgent',
          isRead: true,
          actionUrl: '/dashboard?tab=timeline',
          actionText: 'View Timeline',
          metadata: {
            taskId: 'task3'
          },
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
        },
        {
          id: '4',
          type: 'vendor',
          title: 'Vendor Update',
          message: 'Garden Venue has updated their availability for your date',
          priority: 'medium',
          isRead: true,
          actionUrl: '/dashboard?tab=map',
          actionText: 'View Vendor',
          metadata: {
            vendorId: 'vendor2'
          },
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        },
        {
          id: '5',
          type: 'budget',
          title: 'Budget Alert',
          message: 'You have exceeded your photography budget by $300',
          priority: 'high',
          isRead: false,
          actionUrl: '/dashboard?tab=budget',
          actionText: 'View Budget',
          metadata: {
            amount: 300
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        }
      ];
      
      setNotifications(mockNotifications);
      
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // Load settings from localStorage or API
      const savedSettings = localStorage.getItem('notification-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
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
      setNotifications(prev => [newNotification, ...prev]);
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
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      ));
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
      setNotifications(prev => prev.map(notification => 
        ({ ...notification, isRead: true })
      ));
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
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
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
      localStorage.setItem('notification-settings', JSON.stringify(updatedSettings));
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Simulation
  const simulateRealTimeNotifications = () => {
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
