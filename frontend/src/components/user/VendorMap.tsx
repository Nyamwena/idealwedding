'use client';

import React, { useState, useEffect } from 'react';

interface Vendor {
  id: string;
  name: string;
  category: string;
  location: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  priceRange: { min: number; max: number };
  contact: {
    email: string;
    phone: string;
  };
  description: string;
}

interface VendorMapProps {}

export function VendorMap({}: VendorMapProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Mock vendor data with coordinates
  const mockVendors: Vendor[] = [
    {
      id: '1',
      name: 'Elite Wedding Photography',
      category: 'Photography',
      location: 'Napa Valley, CA',
      coordinates: { lat: 38.2975, lng: -122.2869 },
      rating: 4.8,
      priceRange: { min: 2000, max: 3500 },
      contact: {
        email: 'contact@elitephoto.com',
        phone: '+1 (555) 123-4567'
      },
      description: 'Professional wedding photography with 10+ years of experience.'
    },
    {
      id: '2',
      name: 'Garden Catering Co.',
      category: 'Catering',
      location: 'Napa Valley, CA',
      coordinates: { lat: 38.3011, lng: -122.2845 },
      rating: 4.6,
      priceRange: { min: 45, max: 85 },
      contact: {
        email: 'info@gardencatering.com',
        phone: '+1 (555) 234-5678'
      },
      description: 'Farm-to-table catering with locally sourced ingredients.'
    },
    {
      id: '3',
      name: 'Blossom Floral Design',
      category: 'Flowers',
      location: 'Napa Valley, CA',
      coordinates: { lat: 38.2950, lng: -122.2890 },
      rating: 4.9,
      priceRange: { min: 1500, max: 3000 },
      contact: {
        email: 'hello@blossomfloral.com',
        phone: '+1 (555) 345-6789'
      },
      description: 'Custom floral arrangements for your special day.'
    },
    {
      id: '4',
      name: 'Harmony Music',
      category: 'Entertainment',
      location: 'Napa Valley, CA',
      coordinates: { lat: 38.3000, lng: -122.2820 },
      rating: 4.7,
      priceRange: { min: 800, max: 1500 },
      contact: {
        email: 'bookings@harmonymusic.com',
        phone: '+1 (555) 456-7890'
      },
      description: 'Live music and DJ services for your wedding celebration.'
    },
    {
      id: '5',
      name: 'Luxury Venue Napa',
      category: 'Venue',
      location: 'Napa Valley, CA',
      coordinates: { lat: 38.2985, lng: -122.2850 },
      rating: 4.9,
      priceRange: { min: 5000, max: 12000 },
      contact: {
        email: 'events@luxuryvenuenapa.com',
        phone: '+1 (555) 567-8901'
      },
      description: 'Elegant vineyard venue with stunning views.'
    }
  ];

  const categories = [
    'all',
    'Photography',
    'Catering',
    'Flowers',
    'Entertainment',
    'Venue',
    'Transportation',
    'Hair & Makeup',
    'Dress & Attire',
    'Decorations'
  ];

  useEffect(() => {
    setVendors(mockVendors);
    
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error);
          // Default to Napa Valley if location access is denied
          setUserLocation({ lat: 38.2975, lng: -122.2869 });
        }
      );
    } else {
      // Default to Napa Valley if geolocation is not supported
      setUserLocation({ lat: 38.2975, lng: -122.2869 });
    }
  }, []);

  const filteredVendors = selectedCategory === 'all' 
    ? vendors 
    : vendors.filter(vendor => vendor.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Photography': '📸',
      'Catering': '🍽️',
      'Flowers': '🌸',
      'Entertainment': '🎵',
      'Venue': '🏛️',
      'Transportation': '🚗',
      'Hair & Makeup': '💄',
      'Dress & Attire': '👗',
      'Decorations': '🎨'
    };
    return icons[category] || '🏢';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Photography': 'bg-blue-100 text-blue-800',
      'Catering': 'bg-green-100 text-green-800',
      'Flowers': 'bg-pink-100 text-pink-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Venue': 'bg-yellow-100 text-yellow-800',
      'Transportation': 'bg-gray-100 text-gray-800',
      'Hair & Makeup': 'bg-red-100 text-red-800',
      'Dress & Attire': 'bg-indigo-100 text-indigo-800',
      'Decorations': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Map</h2>
            <p className="text-gray-600">
              Discover wedding vendors in your area. Filter by category and explore their locations.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">📍</span>
            <span className="text-sm text-gray-600">
              {userLocation ? 'Location detected' : 'Location not available'}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Categories' : `${getCategoryIcon(category)} ${category}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vendor List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Vendors ({filteredVendors.length})
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => setSelectedVendor(vendor)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedVendor?.id === vendor.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(vendor.category)}`}>
                      {vendor.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{vendor.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">⭐</span>
                      <span className="font-medium">{vendor.rating}</span>
                    </div>
                    <div className="text-gray-600">
                      ${vendor.priceRange.min} - ${vendor.priceRange.max}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    📍 {vendor.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map and Vendor Details */}
        <div className="lg:col-span-2">
          {/* Map Placeholder */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Locations</h3>
            <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🗺️</div>
                <p className="text-gray-600 mb-2">Interactive Map</p>
                <p className="text-sm text-gray-500">
                  Google Maps integration would be displayed here
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>📍 {filteredVendors.length} vendors in {selectedCategory === 'all' ? 'all categories' : selectedCategory}</p>
                  {userLocation && (
                    <p>📍 Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Vendor Details */}
          {selectedVendor && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Details</h3>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedVendor.name}</h4>
                    <p className="text-gray-600">{selectedVendor.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedVendor.category)}`}>
                    {getCategoryIcon(selectedVendor.category)} {selectedVendor.category}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Contact Information</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">📧</span>
                        <a href={`mailto:${selectedVendor.contact.email}`} className="text-primary-600 hover:text-primary-700">
                          {selectedVendor.contact.email}
                        </a>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">📞</span>
                        <a href={`tel:${selectedVendor.contact.phone}`} className="text-primary-600 hover:text-primary-700">
                          {selectedVendor.contact.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Details</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">⭐</span>
                        <span>Rating: {selectedVendor.rating}/5.0</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">💰</span>
                        <span>Price: ${selectedVendor.priceRange.min} - ${selectedVendor.priceRange.max}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">📍</span>
                        <span>{selectedVendor.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button className="btn-primary btn-md">
                    Request Quote
                  </button>
                  <button className="btn-outline btn-md">
                    View Profile
                  </button>
                  <button className="btn-outline btn-md">
                    Save to Favorites
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Map Integration Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
            <div className="flex items-start">
              <div className="text-blue-500 mr-3 mt-1">ℹ️</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Google Maps Integration</h4>
                <p className="text-blue-800 text-sm">
                  This component is designed to integrate with Google Maps API. To enable full functionality:
                </p>
                <ul className="text-blue-800 text-sm mt-2 space-y-1">
                  <li>• Add Google Maps API key to environment variables</li>
                  <li>• Install @googlemaps/js-api-loader package</li>
                  <li>• Replace the placeholder with actual map component</li>
                  <li>• Add markers for each vendor location</li>
                  <li>• Implement click handlers for vendor selection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
