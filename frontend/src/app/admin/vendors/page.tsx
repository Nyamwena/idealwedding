'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface MockVendor {
  id: string;
  name: string;
  email: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  location: string;
  rating: number;
  joinedDate: string;
  lastActive: string;
  credits: number;
  leadsGenerated: number;
  quotesSent: number;
  bookingsCompleted: number;
  revenue: number;
  performance: 'excellent' | 'good' | 'average' | 'poor';
  subscription: 'basic' | 'premium' | 'enterprise';
  phone: string;
  website: string;
  description: string;
}

export default function AdminVendorsPage() {
  const { user,  isAdmin, logout } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState<MockVendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<MockVendor | null>(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);



  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const response = await fetch('/api/admin/vendors');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load vendors');
      }
      
      setVendors(result.data);
    } catch (error) {
      console.error('Error loading vendors:', error);
      // Fallback to empty array if API fails
      setVendors([]);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Florist': '🌸',
      'Photography': '📸',
      'Catering': '🍽️',
      'Venue': '🏛️',
      'Entertainment': '🎵'
    };
    return icons[category as keyof typeof icons] || '🏢';
  };

  const getPerformanceBadge = (performance: string) => {
    const styles = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      average: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    };
    return styles[performance as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getSubscriptionBadge = (subscription: string) => {
    const styles = {
      basic: 'bg-gray-100 text-gray-800',
      premium: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return styles[subscription as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const handleVendorAction = async (vendorId: string, action: string) => {
    setActionLoading(vendorId);
    setSuccessMessage(null);

    try {
      let newStatus: string;
      switch (action) {
        case 'approve':
          newStatus = 'approved';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'suspend':
          newStatus = 'suspended';
          break;
        case 'activate':
          newStatus = 'approved';
          break;
        default:
          return;
      }

      // Find the vendor to get current data
      const vendor = vendors.find(v => v.id === vendorId);
      if (!vendor) return;

      // Make API call to update vendor status
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...vendor,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update vendor status');
      }

      // Update local state with the response
      const updatedVendor = await response.json();
      setVendors(prev => prev.map(v => 
        v.id === vendorId ? updatedVendor.data : v
      ));

      // Show success message
      setSuccessMessage(`Vendor ${vendor.name} has been ${action}d successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error updating vendor status:', error);
      alert(`Failed to ${action} vendor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewVendor = (vendor: MockVendor) => {
    setSelectedVendor(vendor);
    setShowVendorModal(true);
  };



  if (!isAdmin) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Management</h1>
            <p className="text-gray-600">Manage vendors, view analytics, and control vendor accounts</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/admin/vendors/new" className="btn-primary">
              + Add Vendor
            </Link>
            <Link href="/admin" className="btn-outline">
              ← Back to Admin Dashboard
            </Link>
          </div>
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

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Vendors</label>
              <input
                type="text"
                placeholder="Search by name, email, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-primary-600 text-lg">
                            {getCategoryIcon(vendor.category)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.name}
                          </div>
                          <div className="text-sm text-gray-500">{vendor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {vendor.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceBadge(vendor.performance)}`}>
                        {vendor.performance}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {vendor.credits}
                      </div>
                      <div className="text-xs text-gray-500">
                        {vendor.leadsGenerated} leads
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${vendor.revenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {vendor.bookingsCompleted} bookings
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionBadge(vendor.subscription)}`}>
                        {vendor.subscription}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewVendor(vendor)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                        {vendor.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleVendorAction(vendor.id, 'approve')}
                              disabled={actionLoading === vendor.id}
                              className={`text-green-600 hover:text-green-900 ${actionLoading === vendor.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {actionLoading === vendor.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => handleVendorAction(vendor.id, 'reject')}
                              disabled={actionLoading === vendor.id}
                              className={`text-red-600 hover:text-red-900 ${actionLoading === vendor.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {actionLoading === vendor.id ? 'Processing...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {vendor.status === 'approved' && (
                          <button 
                            onClick={() => handleVendorAction(vendor.id, 'suspend')}
                            disabled={actionLoading === vendor.id}
                            className={`text-yellow-600 hover:text-yellow-900 ${actionLoading === vendor.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === vendor.id ? 'Processing...' : 'Suspend'}
                          </button>
                        )}
                        {vendor.status === 'suspended' && (
                          <button 
                            onClick={() => handleVendorAction(vendor.id, 'activate')}
                            disabled={actionLoading === vendor.id}
                            className={`text-green-600 hover:text-green-900 ${actionLoading === vendor.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === vendor.id ? 'Processing...' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {vendors.filter(v => v.status === 'pending').length}
            </div>
            <div className="text-gray-600">Pending Approval</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {vendors.filter(v => v.status === 'approved').length}
            </div>
            <div className="text-gray-600">Approved Vendors</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {vendors.filter(v => v.status === 'rejected').length}
            </div>
            <div className="text-gray-600">Rejected</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {vendors.length}
            </div>
            <div className="text-gray-600">Total Vendors</div>
          </div>
        </div>

        {/* Vendor Detail Modal */}
        {showVendorModal && selectedVendor && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6" id="modal-title">
                        Vendor Details - {selectedVendor.name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Email:</span> {selectedVendor.email}</p>
                            <p><span className="font-medium">Phone:</span> {selectedVendor.phone}</p>
                            <p><span className="font-medium">Website:</span> {selectedVendor.website}</p>
                            <p><span className="font-medium">Location:</span> {selectedVendor.location}</p>
                            <p><span className="font-medium">Category:</span> {selectedVendor.category}</p>
                            <p><span className="font-medium">Joined:</span> {selectedVendor.joinedDate}</p>
                            <p><span className="font-medium">Last Active:</span> {selectedVendor.lastActive}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Performance Metrics</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Rating:</span> {selectedVendor.rating} ⭐</p>
                            <p><span className="font-medium">Credits:</span> {selectedVendor.credits}</p>
                            <p><span className="font-medium">Leads Generated:</span> {selectedVendor.leadsGenerated}</p>
                            <p><span className="font-medium">Quotes Sent:</span> {selectedVendor.quotesSent}</p>
                            <p><span className="font-medium">Bookings Completed:</span> {selectedVendor.bookingsCompleted}</p>
                            <p><span className="font-medium">Revenue:</span> ${selectedVendor.revenue.toLocaleString()}</p>
                            <p><span className="font-medium">Subscription:</span> 
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionBadge(selectedVendor.subscription)}`}>
                                {selectedVendor.subscription}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
                        <p className="text-sm text-gray-600">{selectedVendor.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowVendorModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
      
      <Footer />
    </div>
  );
}
