'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all_users' | 'vendors' | 'customers' | 'admin';
  status: 'sent' | 'scheduled' | 'draft';
  sendDate: string;
  recipients: number;
  openRate: number;
  author: string;
  category: string;
  priority: string;
  tags: string[];
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminNotificationsPage() {
  const { user,  isAdmin, logout } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');



  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notifications');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load notifications');
      }
      
      setNotifications(result.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to load notifications');
      // Fallback to empty array if API fails
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationAction = async (notificationId: string, action: string) => {
    setActionLoading(notificationId);
    setError(null);
    setSuccessMessage(null);

    try {
      let newStatus = '';
      switch (action) {
        case 'send':
          newStatus = 'sent';
          break;
        case 'schedule':
          newStatus = 'scheduled';
          break;
        case 'draft':
          newStatus = 'draft';
          break;
        default:
          return;
      }

      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `Failed to ${action} notification`);
      }

      setSuccessMessage(`Notification ${action}ed successfully!`);
      loadNotifications(); // Reload notifications to reflect changes
    } catch (error) {
      console.error(`Error ${action}ing notification:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${action} notification`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewNotification = (notificationItem: Notification) => {
    setSelectedNotification(notificationItem);
    setShowNotificationModal(true);
  };

  const handleEditNotification = (notificationId: string) => {
    router.push(`/admin/notifications/${notificationId}/edit`);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return;
    }

    setActionLoading(notificationId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete notification');
      }

      setSuccessMessage('Notification deleted successfully!');
      loadNotifications(); // Reload notifications to reflect changes
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete notification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const filteredNotifications = notifications.filter(
    (n) =>
      (n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (typeFilter === 'all' || n.type === typeFilter) &&
      (statusFilter === 'all' || n.status === statusFilter) &&
      (targetFilter === 'all' || n.target === targetFilter)
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };



  if (!isAdmin) {
    return null; // Will redirect if not admin
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 lg:text-5xl">
            Notification <span className="gradient-text">Management</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage platform notifications, announcements, and user communications.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">✅</div>
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">❌</div>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/notifications/new" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left">
            <div className="text-2xl mb-2">📢</div>
            <h3 className="font-semibold text-gray-900">Send Notification</h3>
            <p className="text-sm text-gray-600">Create and send new notification</p>
          </Link>
          
          <Link href="/admin/notifications/new" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left">
            <div className="text-2xl mb-2">📅</div>
            <h3 className="font-semibold text-gray-900">Schedule Message</h3>
            <p className="text-sm text-gray-600">Schedule notification for later</p>
          </Link>
          
          <Link href="/admin/notifications/analytics" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600">View notification performance</p>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <input
              type="text"
              placeholder="Search notifications..."
              className="form-input w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex space-x-4">
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
              </select>
              <select
                className="form-select"
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
              >
                <option value="all">All Targets</option>
                <option value="all_users">All Users</option>
                <option value="vendors">Vendors</option>
                <option value="customers">Customers</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notification
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Open Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotifications.map((n) => (
                  <tr key={n.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{n.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{n.message}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(n.type)}`}>
                        <span className="mr-1">{getTypeIcon(n.type)}</span>
                        {n.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {n.target.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(n.status)}`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{n.recipients}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {n.openRate > 0 ? `${n.openRate}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{n.sendDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewNotification(n)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={actionLoading === n.id}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditNotification(n.id)}
                          className="text-primary-600 hover:text-primary-900"
                          disabled={actionLoading === n.id}
                        >
                          Edit
                        </button>
                        {n.status !== 'sent' && (
                          <button
                            onClick={() => handleNotificationAction(n.id, 'send')}
                            className="text-green-600 hover:text-green-900"
                            disabled={actionLoading === n.id}
                          >
                            {actionLoading === n.id ? 'Processing...' : 'Send'}
                          </button>
                        )}
                        {n.status !== 'scheduled' && (
                          <button
                            onClick={() => handleNotificationAction(n.id, 'schedule')}
                            className="text-yellow-600 hover:text-yellow-900"
                            disabled={actionLoading === n.id}
                          >
                            {actionLoading === n.id ? 'Processing...' : 'Schedule'}
                          </button>
                        )}
                        {n.status !== 'draft' && (
                          <button
                            onClick={() => handleNotificationAction(n.id, 'draft')}
                            className="text-gray-600 hover:text-gray-900"
                            disabled={actionLoading === n.id}
                          >
                            {actionLoading === n.id ? 'Processing...' : 'Draft'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(n.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={actionLoading === n.id}
                        >
                          {actionLoading === n.id ? 'Processing...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notification Details Modal */}
        {showNotificationModal && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Notification Details</h2>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
                    <p className="text-gray-700">{selectedNotification.title}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Type</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getTypeColor(selectedNotification.type)}`}>
                      <span className="mr-1">{getTypeIcon(selectedNotification.type)}</span>
                      {selectedNotification.type}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedNotification.status)}`}>
                      {selectedNotification.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Target</h3>
                    <p className="text-gray-700">{selectedNotification.target.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Author</h3>
                    <p className="text-gray-700">{selectedNotification.author}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Category</h3>
                    <p className="text-gray-700">{selectedNotification.category}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Priority</h3>
                    <p className="text-gray-700">{selectedNotification.priority}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Recipients</h3>
                    <p className="text-gray-700">{selectedNotification.recipients}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Rate</h3>
                    <p className="text-gray-700">{selectedNotification.openRate > 0 ? `${selectedNotification.openRate}%` : 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Send Date</h3>
                    <p className="text-gray-700">{selectedNotification.sendDate || 'Not sent yet'}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Created</h3>
                    <p className="text-gray-700">{new Date(selectedNotification.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedNotification.tags && selectedNotification.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedNotification.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Message</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    handleEditNotification(selectedNotification.id);
                  }}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Edit Notification
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
