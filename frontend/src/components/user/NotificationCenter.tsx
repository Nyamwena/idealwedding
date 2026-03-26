'use client';

import React, { useState } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    settings,
    updateSettings,
    isLoading,
    error
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | Notification['type']>('all');
  const [showSettings, setShowSettings] = useState(false);

  const notificationTypes = [
    { type: 'quote', label: 'Quotes', icon: '💬', color: 'bg-blue-100 text-blue-800' },
    { type: 'rsvp', label: 'RSVPs', icon: '👥', color: 'bg-green-100 text-green-800' },
    { type: 'vendor', label: 'Vendors', icon: '🏢', color: 'bg-purple-100 text-purple-800' },
    { type: 'task', label: 'Tasks', icon: '📋', color: 'bg-orange-100 text-orange-800' },
    { type: 'budget', label: 'Budget', icon: '💰', color: 'bg-yellow-100 text-yellow-800' },
    { type: 'guest', label: 'Guests', icon: '👤', color: 'bg-pink-100 text-pink-800' },
    { type: 'system', label: 'System', icon: '⚙️', color: 'bg-gray-100 text-gray-800' }
  ];

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const getFilteredNotifications = () => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'unread') return getUnreadNotifications();
    return getNotificationsByType(activeFilter as Notification['type']);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Center</h2>
            <p className="text-gray-600">
              Stay updated with real-time notifications about your wedding planning progress.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <div className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </div>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-outline btn-sm"
            >
              Settings
            </button>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark All Read
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Notification Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">General Settings</h4>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">Email Notifications</h5>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => updateSettings({ emailNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">Push Notifications</h5>
                  <p className="text-sm text-gray-600">Receive browser push notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => updateSettings({ pushNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Specific Alerts</h4>
              
              {[
                { key: 'quoteAlerts', label: 'Quote Alerts', description: 'New quotes from vendors' },
                { key: 'rsvpAlerts', label: 'RSVP Alerts', description: 'Guest RSVP responses' },
                { key: 'taskReminders', label: 'Task Reminders', description: 'Wedding planning tasks' },
                { key: 'budgetAlerts', label: 'Budget Alerts', description: 'Budget updates and warnings' },
                { key: 'vendorUpdates', label: 'Vendor Updates', description: 'Messages from vendors' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">{setting.label}</h5>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[setting.key as keyof typeof settings] as boolean}
                      onChange={(e) => updateSettings({ [setting.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">🔔</div>
          <h3 className="font-semibold text-gray-900">Total</h3>
          <p className="text-2xl font-bold text-primary-600">{notifications.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">📬</div>
          <h3 className="font-semibold text-gray-900">Unread</h3>
          <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">💬</div>
          <h3 className="font-semibold text-gray-900">Quotes</h3>
          <p className="text-2xl font-bold text-blue-600">{getNotificationsByType('quote').length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="font-semibold text-gray-900">RSVPs</h3>
          <p className="text-2xl font-bold text-green-600">{getNotificationsByType('rsvp').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Notifications</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'unread'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          {notificationTypes.map((type) => (
            <button
              key={type.type}
              onClick={() => setActiveFilter(type.type as Notification['type'])}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === type.type
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.icon} {type.label} ({getNotificationsByType(type.type as Notification['type']).length})
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {activeFilter === 'all' ? 'All Notifications' : 
             activeFilter === 'unread' ? 'Unread Notifications' :
             `${notificationTypes.find(t => t.type === activeFilter)?.label} Notifications`}
            ({filteredNotifications.length})
          </h3>
          {filteredNotifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
            >
              Clear All
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔔</div>
            <p className="text-gray-600">No notifications found for the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const typeConfig = notificationTypes.find(t => t.type === notification.type);
              const priorityConfig = priorityColors[notification.priority];
              
              return (
                <div
                  key={notification.id}
                  className={`border rounded-xl p-4 transition-all duration-200 ${
                    notification.isRead 
                      ? 'border-gray-200 bg-gray-50' 
                      : 'border-primary-200 bg-primary-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-2xl">{typeConfig?.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-semibold ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm mb-2 ${
                          notification.isRead ? 'text-gray-600' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {typeConfig && (
                            <span className={`px-2 py-1 rounded-full ${typeConfig.color}`}>
                              {typeConfig.label}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full ${priorityConfig}`}>
                            {notification.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {notification.actionUrl && notification.actionText && (
                        <a
                          href={notification.actionUrl}
                          className="btn-primary btn-sm"
                        >
                          {notification.actionText}
                        </a>
                      )}
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="btn-outline btn-sm"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
