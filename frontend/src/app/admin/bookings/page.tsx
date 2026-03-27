'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { AdminPagination } from '@/components/admin/AdminPagination';

interface MockBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  vendorName: string;
  serviceType: string;
  eventDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  bookingDate: string;
  notes: string;
}

export default function AdminBookingsPage() {
  const { user,  isAdmin, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<MockBooking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if ( !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin,  router]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load bookings');
      }
      
      setBookings(result.data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      // Fallback to empty array if API fails
      setBookings([]);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleBookingAction = async (bookingId: string, action: string) => {
    setActionLoading(bookingId);
    setSuccessMessage(null);

    try {
      let newStatus: string;
      switch (action) {
        case 'confirm':
          newStatus = 'confirmed';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        case 'cancel':
          newStatus = 'cancelled';
          break;
        default:
          return;
      }

      // Find the booking to get current data
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      // Make API call to update booking status
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...booking,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update booking status');
      }

      // Update local state with the response
      const updatedBooking = await response.json();
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? updatedBooking.data : b
      ));

      // Show success message
      setSuccessMessage(`Booking for ${booking.customerName} has been ${action}ed successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error updating booking status:', error);
      alert(`Failed to ${action} booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewBooking = (booking: MockBooking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleEditBooking = (booking: MockBooking) => {
    // Navigate to edit page (we'll create this later)
    router.push(`/admin/bookings/${booking.id}/edit`);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    setActionLoading(bookingId);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete booking');
      }

      // Remove from local state
      setBookings(prev => prev.filter(b => b.id !== bookingId));

      // Show success message
      setSuccessMessage('Booking deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error deleting booking:', error);
      alert(`Failed to delete booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      (b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || b.status === statusFilter) &&
      (serviceFilter === 'all' || b.serviceType === serviceFilter)
  );

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, serviceFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            Booking <span className="gradient-text">Management</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Monitor and manage all wedding bookings and reservations.
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

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <input
              type="text"
              placeholder="Search bookings..."
              className="form-input w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex space-x-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                className="form-select"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              >
                <option value="all">All Services</option>
                <option value="Florist">Florist</option>
                <option value="Photographer">Photographer</option>
                <option value="Caterer">Caterer</option>
                <option value="DJ">DJ</option>
                <option value="Venue">Venue</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{b.customerName}</div>
                        <div className="text-sm text-gray-500">{b.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.vendorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{b.serviceType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{b.eventDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${b.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleViewBooking(b)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleEditBooking(b)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {b.status === 'pending' && (
                          <button 
                            onClick={() => handleBookingAction(b.id, 'confirm')}
                            disabled={actionLoading === b.id}
                            className={`text-green-600 hover:text-green-900 ${actionLoading === b.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === b.id ? 'Processing...' : 'Confirm'}
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button 
                            onClick={() => handleBookingAction(b.id, 'complete')}
                            disabled={actionLoading === b.id}
                            className={`text-blue-600 hover:text-blue-900 ${actionLoading === b.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === b.id ? 'Processing...' : 'Complete'}
                          </button>
                        )}
                        {b.status !== 'completed' && b.status !== 'cancelled' && (
                          <button 
                            onClick={() => handleBookingAction(b.id, 'cancel')}
                            disabled={actionLoading === b.id}
                            className={`text-red-600 hover:text-red-900 ${actionLoading === b.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === b.id ? 'Processing...' : 'Cancel'}
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteBooking(b.id)}
                          disabled={actionLoading === b.id}
                          className={`text-red-600 hover:text-red-900 ${actionLoading === b.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {actionLoading === b.id ? 'Processing...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredBookings.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              if (page < 1 || page > totalPages) return;
              setCurrentPage(page);
            }}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(1);
            }}
          />
        </div>
      </main>
      <Footer />

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Booking Details</h3>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Customer:</label>
                <p className="text-sm text-gray-900">{selectedBooking.customerName}</p>
                <p className="text-xs text-gray-500">{selectedBooking.customerEmail}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Vendor:</label>
                <p className="text-sm text-gray-900">{selectedBooking.vendorName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Service:</label>
                <p className="text-sm text-gray-900">{selectedBooking.serviceType}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Event Date:</label>
                <p className="text-sm text-gray-900">{selectedBooking.eventDate}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Booking Date:</label>
                <p className="text-sm text-gray-900">{selectedBooking.bookingDate}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Amount:</label>
                <p className="text-sm text-gray-900">${selectedBooking.totalAmount.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Notes:</label>
                <p className="text-sm text-gray-900">{selectedBooking.notes}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowBookingModal(false);
                  handleEditBooking(selectedBooking);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
