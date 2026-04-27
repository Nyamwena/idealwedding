'use client';

import React, { useState } from 'react';
import { useQuoteGenerator, QuoteRequest, VendorMatch } from '@/hooks/useQuoteGenerator';

interface InstantQuoteGeneratorProps {
  quoteGenerator: ReturnType<typeof useQuoteGenerator>;
}

export function InstantQuoteGenerator({ quoteGenerator }: InstantQuoteGeneratorProps) {
  const {
    quoteRequests,
    createQuoteRequest,
    matchedVendors,
    searchVendors,
    isLoading,
    isSearching,
    error
  } = quoteGenerator;

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    budget: '',
    location: '',
    date: '',
    guestCount: '',
    specialRequirements: ''
  });

  const categories = [
    'Photography',
    'Catering',
    'Flowers',
    'Entertainment',
    'Venue',
    'Transportation',
    'Hair & Makeup',
    'Dress & Attire',
    'Decorations',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description || !formData.budget || !formData.location || !formData.date) {
      return;
    }

    try {
      await createQuoteRequest({
        category: formData.category,
        description: formData.description,
        budget: parseInt(formData.budget),
        location: formData.location,
        date: formData.date,
        guestCount: formData.guestCount ? parseInt(formData.guestCount) : undefined,
        specialRequirements: formData.specialRequirements || undefined
      });

      // Reset form
      setFormData({
        category: '',
        description: '',
        budget: '',
        location: '',
        date: '',
        guestCount: '',
        specialRequirements: ''
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating quote request:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Instant Quote Generator</h2>
            <p className="text-gray-600">
              Post your request once—<strong>all approved vendors</strong> can see it and send quotations. It stays
              open until you <strong>approve a quotation</strong> under <strong>My Quotations</strong>. We also
              show matching vendors on this page after you submit.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary btn-lg"
          >
            {showForm ? 'Cancel' : 'Request Quote'}
          </button>
        </div>
      </div>

      {/* Quote Request Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">New Quote Request</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-semibold text-gray-700 mb-2">
                  Budget *
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter your budget"
                  required
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="e.g., Napa Valley, CA"
                  required
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="guestCount" className="block text-sm font-semibold text-gray-700 mb-2">
                  Guest Count
                </label>
                <input
                  type="number"
                  id="guestCount"
                  name="guestCount"
                  value={formData.guestCount}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Number of guests"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input w-full h-24"
                placeholder="Describe your requirements in detail..."
                required
              />
            </div>

            <div>
              <label htmlFor="specialRequirements" className="block text-sm font-semibold text-gray-700 mb-2">
                Special Requirements
              </label>
              <textarea
                id="specialRequirements"
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                className="input w-full h-20"
                placeholder="Any special requirements or preferences..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-outline btn-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Request...' : 'Request Quote'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quote Requests */}
      {quoteRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Your Quote Requests</h3>
          <div className="space-y-4">
            {quoteRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{request.category}</h4>
                    <p className="text-gray-600 text-sm">{request.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">${request.budget.toLocaleString()}</div>
                    <div
                      className={`text-sm px-2 py-1 rounded-full ${
                        request.status === 'open'
                          ? 'bg-amber-100 text-amber-900'
                          : request.status === 'awarded'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {request.status === 'open' ? 'Open to vendors' : request.status === 'awarded' ? 'Quote approved' : request.status}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Location:</span> {request.location}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date(request.date).toLocaleDateString()}
                  </div>
                  {request.guestCount && (
                    <div>
                      <span className="font-medium">Guests:</span> {request.guestCount}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created:</span> {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-sm text-primary-900">
        <strong>Vendor responses</strong> appear under the <strong>My Quotations</strong> tab. Approve one there; your
        open request is then no longer shown to other vendors.
      </div>

      {/* Matched Vendors */}
      {matchedVendors.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Matched Vendors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedVendors.map((vendor) => (
              <div key={vendor.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <span className="text-sm font-medium">{vendor.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{vendor.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price Range:</span>
                    <span className="font-medium">${vendor.priceRange.min} - ${vendor.priceRange.max}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-medium">{vendor.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{vendor.location}</span>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button className="btn-outline btn-sm flex-1">
                    View Profile
                  </button>
                  <button className="btn-primary btn-sm flex-1">
                    Contact
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for matching vendors...</p>
        </div>
      )}
    </div>
  );
}
