'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserBooking {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  vendorId: string;
  vendorName: string;
  serviceCategory: string;
  serviceName: string;
  weddingDate: string;
  location: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  depositPaid: boolean;
  depositAmount: number;
  finalPaymentDue: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface UserBookingsManagerProps {
  userData: any;
}

export function UserBookingsManager({ userData }: UserBookingsManagerProps) {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/bookings');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch bookings');
      }

      setBookings(result.data);
    } catch (error) {
      console.error('Failed to fetch user bookings:', error);
      setError('Failed to load your bookings. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: string) => {
    setActionLoading(bookingId);
    setSuccessMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/user/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update booking');
      }

      // Update local state
      setBookings(prev => prev.map(booking =>
        booking.id === bookingId ? { ...booking, ...result.data } : booking
      ));

      setSuccessMessage(`Booking ${action} successfully!`);
    } catch (error) {
      console.error('Failed to update booking:', error);
      setError(error.message || 'Failed to update booking. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewBooking = (booking: UserBooking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading your bookings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
            <p className="text-gray-600">Manage your wedding service bookings</p>
          </div>
          <Link href="/vendors">
            <button className="btn-primary">
              Find More Vendors
            </button>
          </Link>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">✅</div>
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">❌</div>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({bookings.filter(b => b.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'confirmed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({bookings.filter(b => b.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {filteredBookings.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{booking.serviceName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                        {getStatusIcon(booking.status)} {booking.status}
                      </span>
                      {booking.depositPaid ? (
                        <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">Deposit Paid</span>
                      ) : (
                        <span className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-full">Deposit Due</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Vendor</p>
                        <p className="font-medium text-gray-900">{booking.vendorName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Wedding Date</p>
                        <p className="font-medium text-gray-900">{new Date(booking.weddingDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">{booking.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>💰 Amount: ${booking.amount.toLocaleString()}</span>
                        <span>🗓️ Final Payment Due: {new Date(booking.finalPaymentDue).toLocaleDateString()}</span>
                      </div>
                      <span>ID: {booking.id}</span>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => handleViewBooking(booking)}
                      className="btn-primary btn-sm"
                    >
                      View Details
                    </button>
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleBookingAction(booking.id, 'cancel')}
                        disabled={actionLoading === booking.id}
                        className="btn-outline btn-sm text-red-600 hover:text-red-800"
                      >
                        {actionLoading === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleBookingAction(booking.id, 'complete')}
                        disabled={actionLoading === booking.id}
                        className="btn-outline btn-sm text-green-600 hover:text-green-800"
                      >
                        {actionLoading === booking.id ? 'Marking...' : 'Mark as Completed'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📅</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === 'all'
                ? "You don't have any bookings yet. Start by getting quotes from vendors!"
                : `No ${statusFilter} bookings found.`}
            </p>
            <Link href="/vendors">
              <button className="btn-primary">
                Browse Vendors
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      Booking Details - {selectedBooking.serviceName}
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Vendor</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedBooking.vendorName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount</label>
                          <p className="mt-1 text-sm text-gray-900">${selectedBooking.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Wedding Date</label>
                          <p className="mt-1 text-sm text-gray-900">{new Date(selectedBooking.weddingDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Location</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedBooking.location}</p>
                        </div>
                      </div>

                      {selectedBooking.notes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Notes</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedBooking.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Current Status</label>
                          <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedBooking.status)}`}>
                            {getStatusIcon(selectedBooking.status)} {selectedBooking.status}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Deposit Paid</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedBooking.depositPaid ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Final Payment Due</label>
                          <p className="mt-1 text-sm text-gray-900">{new Date(selectedBooking.finalPaymentDue).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <div className="flex space-x-2">
                  {selectedBooking.status === 'pending' && (
                    <button
                      onClick={() => handleBookingAction(selectedBooking.id, 'cancel')}
                      className="btn-outline btn-sm text-red-600 hover:text-red-800"
                    >
                      Cancel Booking
                    </button>
                  )}
                  {selectedBooking.status === 'confirmed' && (
                    <button
                      onClick={() => handleBookingAction(selectedBooking.id, 'complete')}
                      className="btn-primary btn-sm"
                    >
                      Mark as Completed
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => setShowBookingModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

