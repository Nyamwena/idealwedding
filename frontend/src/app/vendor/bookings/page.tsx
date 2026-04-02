'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

interface VendorBooking {
  id: string;
  coupleName: string;
  coupleEmail: string;
  couplePhone: string;
  serviceType: string;
  eventDate: string;
  location: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  amount: number;
  depositPaid: boolean;
  finalPaymentDue: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function VendorBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<VendorBooking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);



  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/bookings', {
        credentials: 'include',
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch bookings');
      }

      const normalized: VendorBooking[] = (result.data || []).map((item: any) => ({
        id: String(item.id),
        coupleName: String(item.coupleName || item.customerName || 'Unknown Couple'),
        coupleEmail: String(item.coupleEmail || item.customerEmail || ''),
        couplePhone: String(item.couplePhone || item.customerPhone || ''),
        serviceType: String(item.serviceType || item.serviceName || item.serviceCategory || 'Wedding Service'),
        eventDate: String(item.eventDate || item.weddingDate || item.createdAt || new Date().toISOString()),
        location: String(item.location || 'Unknown'),
        status: (item.status || 'pending') as VendorBooking['status'],
        amount: Number(item.amount || 0),
        depositPaid: Boolean(item.depositPaid),
        finalPaymentDue: String(item.finalPaymentDue || item.updatedAt || new Date().toISOString()),
        notes: item.notes ? String(item.notes) : undefined,
        createdAt: String(item.createdAt || new Date().toISOString()),
        updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString()),
      }));

      setBookings(normalized);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = selectedStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === selectedStatus);

  const handleViewBooking = (booking: VendorBooking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[
          { label: 'Vendor Dashboard', href: '/vendor' },
          { label: 'Booking Management', href: '/vendor/bookings' }
        ]} />
        
        <VendorTopMenu />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Booking <span className="gradient-text">Management</span></h1>
            <p className="text-gray-600 mt-2">Manage all your wedding bookings and appointments</p>
          </div>
          <Link href="/vendor">
            <button className="btn-outline btn-md hover-lift">
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading bookings...</span>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <span className="text-blue-600 text-xl">📅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confirmed</p>
                    <p className="text-3xl font-bold text-green-600">
                      {bookings.filter(b => b.status === 'confirmed').length}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <span className="text-green-600 text-xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {bookings.filter(b => b.status === 'pending').length}
                    </p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-3">
                    <span className="text-yellow-600 text-xl">⏳</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-purple-600">
                      ${bookings.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <span className="text-purple-600 text-xl">💰</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStatus === 'all' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Bookings ({bookings.length})
                </button>
                <button
                  onClick={() => setSelectedStatus('confirmed')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStatus === 'confirmed' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
                </button>
                <button
                  onClick={() => setSelectedStatus('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStatus === 'pending' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending ({bookings.filter(b => b.status === 'pending').length})
                </button>
                <button
                  onClick={() => setSelectedStatus('completed')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStatus === 'completed' 
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
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedStatus === 'all' ? 'All Bookings' : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Bookings`}
                </h2>
              </div>
              
              {filteredBookings.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{booking.coupleName}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)} {booking.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Service Type</p>
                              <p className="font-medium text-gray-900">{booking.serviceType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Event Date</p>
                              <p className="font-medium text-gray-900">{new Date(booking.eventDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Amount</p>
                              <p className="font-medium text-gray-900">${booking.amount.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Location</p>
                              <p className="text-gray-900">{booking.location}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Payment Status</p>
                              <p className="text-gray-900">
                                {booking.depositPaid ? (
                                  <span className="text-green-600">Deposit Paid</span>
                                ) : (
                                  <span className="text-yellow-600">Deposit Pending</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          {booking.notes && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600">Notes</p>
                              <p className="text-gray-900">{booking.notes}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>📧 {booking.coupleEmail}</span>
                              <span>📞 {booking.couplePhone}</span>
                              <span>💳 Final Payment Due: {new Date(booking.finalPaymentDue).toLocaleDateString()}</span>
                            </div>
                            <span>Created: {new Date(booking.createdAt).toLocaleDateString()}</span>
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
                            <button className="btn-outline btn-sm">
                              Confirm Booking
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button className="btn-outline btn-sm">
                              Mark Complete
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
                  <p className="text-gray-600">
                    {selectedStatus === 'all' 
                      ? "You haven't received any bookings yet." 
                      : `No ${selectedStatus} bookings found.`}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

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
                        Booking Details - {selectedBooking.coupleName}
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Service Type</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedBooking.serviceType}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Amount</label>
                            <p className="mt-1 text-sm text-gray-900">${selectedBooking.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Event Date</label>
                            <p className="mt-1 text-sm text-gray-900">{new Date(selectedBooking.eventDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedBooking.location}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-900">📧 {selectedBooking.coupleEmail}</p>
                            <p className="text-sm text-gray-900">📞 {selectedBooking.couplePhone}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Payment Information</label>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-900">
                              Deposit Status: {selectedBooking.depositPaid ? (
                                <span className="text-green-600">Paid</span>
                              ) : (
                                <span className="text-yellow-600">Pending</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-900">
                              Final Payment Due: {new Date(selectedBooking.finalPaymentDue).toLocaleDateString()}
                            </p>
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
                            <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                              {getStatusIcon(selectedBooking.status)} {selectedBooking.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <div className="flex space-x-2">
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
      </main>
      
      <Footer />
    </div>
  );
}