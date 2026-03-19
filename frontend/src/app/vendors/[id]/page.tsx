'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BookingForm } from '@/components/user/BookingForm';

interface Vendor {
  id: string;
  businessName: string;
  description: string;
  logo: string;
  services: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
  }>;
  portfolio: Array<{
    id: string;
    title: string;
    imageUrl: string;
    description: string;
  }>;
  contactInfo: {
    email: string;
    phone: string;
    website: string;
  };
  rating: number;
  reviewCount: number;
}

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const fetchVendor = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vendors/${vendorId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch vendor');
      }

      setVendor(result.data);
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (service: any) => {
    setSelectedService(service);
    setShowBookingForm(true);
  };

  const handleBookingCreated = (booking: any) => {
    setShowBookingForm(false);
    setSelectedService(null);
    // Could redirect to bookings page or show success message
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Header />
        <main className="container-modern py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading vendor details...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Header />
        <main className="container-modern py-8">
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">❌</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Vendor not found</h3>
            <p className="text-gray-600 mb-4">The vendor you're looking for doesn't exist.</p>
            <Link href="/vendors">
              <button className="btn-primary">Browse All Vendors</button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span>›</span>
            <Link href="/vendors" className="hover:text-primary-600">Vendors</Link>
            <span>›</span>
            <span className="text-gray-900">{vendor.businessName}</span>
          </div>
        </nav>

        {/* Vendor Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-600">
                {vendor.businessName.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{vendor.businessName}</h1>
              <p className="text-gray-600 mb-4">{vendor.description}</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-yellow-400 text-lg">⭐</span>
                  <span className="ml-1 font-medium">{vendor.rating}</span>
                  <span className="ml-1 text-gray-600">({vendor.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">📧</span>
                  <span className="text-sm">{vendor.contactInfo.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">📞</span>
                  <span className="text-sm">{vendor.contactInfo.phone}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Link href="/dashboard?tab=bookings">
                <button className="btn-primary">
                  View My Bookings
                </button>
              </Link>
              {vendor.contactInfo.website && (
                <a
                  href={vendor.contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Services Offered</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendor.services.map((service) => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary-600">${service.price}</span>
                  <button
                    onClick={() => handleBookService(service)}
                    className="btn-primary btn-sm"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Section */}
        {vendor.portfolio.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendor.portfolio.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">📷</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Booking Form Modal */}
      {showBookingForm && selectedService && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <BookingForm
                  vendorId={vendor.id}
                  vendorName={vendor.businessName}
                  serviceCategory={selectedService.category}
                  serviceName={selectedService.name}
                  onBookingCreated={handleBookingCreated}
                  onClose={() => setShowBookingForm(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}