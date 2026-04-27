'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BookingForm } from '@/components/user/BookingForm';

function formatServicePrice(service: {
  price?: number;
  priceRange?: { min?: number; max?: number };
}): string {
  if (typeof service.price === 'number' && !Number.isNaN(service.price)) {
    return `$${service.price.toLocaleString()}`;
  }
  const pr = service.priceRange;
  if (pr && (typeof pr.min === 'number' || typeof pr.max === 'number')) {
    const min = pr.min ?? pr.max ?? 0;
    const max = pr.max ?? pr.min ?? 0;
    if (min === max) return `$${min.toLocaleString()}`;
    return `$${min.toLocaleString()}–$${max.toLocaleString()}`;
  }
  return '—';
}

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
    price?: number;
    priceRange?: { min?: number; max?: number };
  }>;
  portfolio: Array<{
    id: string;
    title: string;
    /** Legacy / alternate field from vendor-profiles.json */
    imageUrl?: string;
    url?: string;
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
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    budget: '',
    location: '',
    date: '',
    description: '',
    specialRequirements: '',
    guestCount: '',
  });

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  /** Scroll to services when opened from Vendor Map “Request Quote” (?quote=1#vendor-services). */
  useEffect(() => {
    if (!vendor || typeof window === 'undefined') return;
    const quote = new URLSearchParams(window.location.search).get('quote');
    if (quote !== '1') return;
    const t = window.setTimeout(() => {
      document.getElementById('vendor-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(t);
  }, [vendor]);

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

  const openQuoteModal = () => {
    const firstService = vendor?.services?.[0];
    const defaultDescription = firstService
      ? `Quote request for ${firstService.name}. ${firstService.description || ''}`.trim()
      : '';
    setQuoteForm((prev) => ({
      ...prev,
      description: prev.description || defaultDescription,
      location: prev.location || String(vendor?.contactInfo?.website || '').replace(/^https?:\/\//, ''),
    }));
    setShowQuoteModal(true);
  };

  const submitQuoteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.budget || !quoteForm.location || !quoteForm.date || !quoteForm.description) {
      toast.error('Please fill in all required quote fields.');
      return;
    }
    const budget = Number(quoteForm.budget);
    if (!Number.isFinite(budget) || budget <= 0) {
      toast.error('Budget must be a valid amount.');
      return;
    }
    setSubmittingQuote(true);
    try {
      const category = String(vendor?.services?.[0]?.category || 'Other').trim() || 'Other';
      const response = await fetch('/api/user/quote-requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: quoteForm.description,
          budget,
          location: quoteForm.location,
          date: quoteForm.date,
          guestCount:
            quoteForm.guestCount.trim() !== '' ? Math.max(0, parseInt(quoteForm.guestCount, 10) || 0) : undefined,
          specialRequirements: quoteForm.specialRequirements.trim() || undefined,
          vendorId,
          vendorName: vendor?.businessName,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(String(result?.error || 'Failed to send quote request'));
      }
      toast.success('Quote request sent. Vendors can now respond.');
      setShowQuoteModal(false);
      setQuoteForm({
        budget: '',
        location: '',
        date: '',
        description: '',
        specialRequirements: '',
        guestCount: '',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send quote request');
    } finally {
      setSubmittingQuote(false);
    }
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
              <button
                type="button"
                className="btn-primary"
                onClick={openQuoteModal}
              >
                Request Quote
              </button>
              <Link href="/dashboard?tab=bookings">
                <button type="button" className="btn-outline w-full">
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

        {/* Services Section — anchor for sponsored / map “Visit” links */}
        <div id="vendor-services" className="bg-white rounded-2xl shadow-lg p-8 mb-8 scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Services Offered</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendor.services.map((service) => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary-600">
                    {formatServicePrice(service)}
                  </span>
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
              {vendor.portfolio.map((item) => {
                const imageSrc = item.imageUrl || item.url;
                return (
                  <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                      {imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element -- portfolio URLs from stored JSON (mixed origins)
                        <img
                          src={imageSrc}
                          alt={item.title || 'Portfolio item'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500">📷</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                );
              })}
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

      {showQuoteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-end justify-center pt-4 px-4 pb-20 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden
              onClick={() => !submittingQuote && setShowQuoteModal(false)}
            />
            <div className="relative z-10 inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8">
              <form onSubmit={submitQuoteRequest}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Request Quote - {vendor.businessName}</h3>
                  <p className="text-sm text-gray-600 mt-1 mb-4">
                    Send your requirements and vendors will respond in My Quotations.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Budget *</label>
                      <input
                        type="number"
                        className="input w-full"
                        value={quoteForm.budget}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, budget: e.target.value }))}
                        placeholder="Enter budget"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={quoteForm.location}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, location: e.target.value }))}
                        placeholder="City / area"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                      <input
                        type="date"
                        className="input w-full"
                        value={quoteForm.date}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                      <input
                        type="number"
                        className="input w-full"
                        value={quoteForm.guestCount}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, guestCount: e.target.value }))}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      className="input w-full h-24"
                      value={quoteForm.description}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe what you need"
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                    <textarea
                      className="input w-full h-20"
                      value={quoteForm.specialRequirements}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, specialRequirements: e.target.value }))}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                  <button type="submit" disabled={submittingQuote} className="btn-primary btn-sm w-full sm:w-auto">
                    {submittingQuote ? 'Sending...' : 'Send Quote Request'}
                  </button>
                  <button
                    type="button"
                    disabled={submittingQuote}
                    onClick={() => setShowQuoteModal(false)}
                    className="btn-outline btn-sm w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}