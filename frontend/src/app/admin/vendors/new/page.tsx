'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';

interface VendorFormData {
  name: string;
  email: string;
  category: string;
  location: string;
  phone: string;
  website: string;
  description: string;
}

const CATEGORIES = [
  'Photography',
  'Videography',
  'Florist',
  'Catering',
  'Venue',
  'Entertainment',
  'Wedding Planning',
  'Transportation',
  'Beauty & Styling',
  'Decorations',
  'Other'
];

export default function AdminAddVendorPage() {
  const { user,  isAdmin, logout } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    email: '',
    category: '',
    location: '',
    phone: '',
    website: '',
    description: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Vendor name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create vendor');
      }
      
      setSuccessMessage('Vendor created successfully!');
      
      // Redirect to vendors list after a short delay
      setTimeout(() => {
        router.push('/admin/vendors');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the vendor');
    } finally {
      setIsSubmitting(false);
    }
  };



  if (!isAdmin) {
    return null; // Will redirect to dashboard
  }

  const breadcrumbItems = [
    { label: 'Admin', href: '/admin' },
    { label: 'Vendors', href: '/admin/vendors' },
    { label: 'Add Vendor' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        <AdminBreadcrumb items={breadcrumbItems} />
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Add New <span className="gradient-text">Vendor</span>
            </h1>
            <p className="text-lg text-gray-600">
              Register a new vendor to join the Ideal Weddings platform.
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

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-input w-full ${validationErrors.name ? 'border-red-500' : ''}`}
                      placeholder="Enter vendor name"
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-input w-full ${validationErrors.email ? 'border-red-500' : ''}`}
                      placeholder="Enter email address"
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`form-select w-full ${validationErrors.category ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {validationErrors.category && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`form-input w-full ${validationErrors.location ? 'border-red-500' : ''}`}
                      placeholder="Enter location (e.g., New York, NY)"
                    />
                    {validationErrors.location && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      placeholder="Enter website URL"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="form-textarea w-full"
                    placeholder="Describe the vendor's services and specialties"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                <Link href="/admin/vendors">
                  <button
                    type="button"
                    className="btn-secondary btn-lg w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </Link>
                
                <button
                  type="submit"
                  className="btn-primary btn-lg w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Vendor...
                    </>
                  ) : (
                    'Create Vendor'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
