'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

export default function VendorServicesPage() {
  const { user,  isVendor } = useAuth();
  const { profile, loading: profileLoading, addService, updateService, deleteService } = useVendorProfile();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [newService, setNewService] = useState({
    name: '',
    category: '',
    description: '',
    minPrice: '',
    maxPrice: '',
    isPremium: false,
    isFeatured: false,
  });



  const handleAddService = async () => {
    try {
      const serviceData = {
        name: newService.name,
        category: newService.category,
        description: newService.description,
        priceRange: {
          min: parseInt(newService.minPrice),
          max: parseInt(newService.maxPrice),
        },
        isPremium: newService.isPremium,
        isFeatured: newService.isFeatured,
      };

      await addService(serviceData);
      setShowAddModal(false);
      setNewService({
        name: '',
        category: '',
        description: '',
        minPrice: '',
        maxPrice: '',
        isPremium: false,
        isFeatured: false,
      });
    } catch (error) {
      console.error('Failed to add service:', error);
    }
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      category: service.category,
      description: service.description,
      minPrice: service.priceRange.min.toString(),
      maxPrice: service.priceRange.max.toString(),
      isPremium: service.isPremium,
      isFeatured: service.isFeatured,
    });
    setShowEditModal(true);
  };

  const handleUpdateService = async () => {
    try {
      const serviceData = {
        name: newService.name,
        category: newService.category,
        description: newService.description,
        priceRange: {
          min: parseInt(newService.minPrice),
          max: parseInt(newService.maxPrice),
        },
        isPremium: newService.isPremium,
        isFeatured: newService.isFeatured,
      };

      await updateService(editingService.id, serviceData);
      setShowEditModal(false);
      setEditingService(null);
      setNewService({
        name: '',
        category: '',
        description: '',
        minPrice: '',
        maxPrice: '',
        isPremium: false,
        isFeatured: false,
      });
    } catch (error) {
      console.error('Failed to update service:', error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService(serviceId);
    }
  };



  if (!isVendor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[
          { label: 'Vendor Dashboard', href: '/vendor' },
          { label: 'Services & Portfolio', href: '/vendor/services' }
        ]} />
        
        <VendorTopMenu />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Services & <span className="gradient-text">Portfolio</span></h1>
            <p className="text-gray-600 mt-2">Manage your services and showcase your work</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary btn-md"
            >
              + Add Service
            </button>
            <Link href="/vendor">
              <button className="btn-outline btn-md hover-lift">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Services</h2>
          </div>
          
          {profile?.services.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {profile.services.map((service) => (
                <div key={service.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                        {service.isPremium && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Premium</span>
                        )}
                        {service.isFeatured && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Featured</span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{service.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Category: {service.category}</span>
                        <span>Price: ${service.priceRange.min} - ${service.priceRange.max}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditService(service)}
                        className="btn-outline btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="btn-ghost btn-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🛠️</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services added yet</h3>
              <p className="text-gray-600 mb-4">Add your first service to start attracting customers.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary btn-md"
              >
                + Add Your First Service
              </button>
            </div>
          )}
        </div>

        {/* Add Service Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Service</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service Name</label>
                      <input
                        type="text"
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., Wedding Photography"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService({...newService, category: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select category</option>
                        <option value="Photography">Photography</option>
                        <option value="Videography">Videography</option>
                        <option value="Wedding Planning">Wedding Planning</option>
                        <option value="Catering">Catering</option>
                        <option value="Floral">Floral</option>
                        <option value="Music & Entertainment">Music & Entertainment</option>
                        <option value="Venues">Venues</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={newService.description}
                        onChange={(e) => setNewService({...newService, description: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Describe your service..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Min Price ($)</label>
                        <input
                          type="number"
                          value={newService.minPrice}
                          onChange={(e) => setNewService({...newService, minPrice: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Price ($)</label>
                        <input
                          type="number"
                          value={newService.maxPrice}
                          onChange={(e) => setNewService({...newService, maxPrice: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="2000"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newService.isPremium}
                          onChange={(e) => setNewService({...newService, isPremium: e.target.checked})}
                          className="rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Premium Service</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newService.isFeatured}
                          onChange={(e) => setNewService({...newService, isFeatured: e.target.checked})}
                          className="rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Featured</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    onClick={handleAddService}
                    className="btn-primary btn-sm sm:ml-3"
                  >
                    Add Service
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn-outline btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Service Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Service</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service Name</label>
                      <input
                        type="text"
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService({...newService, category: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select category</option>
                        <option value="Photography">Photography</option>
                        <option value="Videography">Videography</option>
                        <option value="Wedding Planning">Wedding Planning</option>
                        <option value="Catering">Catering</option>
                        <option value="Floral">Floral</option>
                        <option value="Music & Entertainment">Music & Entertainment</option>
                        <option value="Venues">Venues</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={newService.description}
                        onChange={(e) => setNewService({...newService, description: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Min Price ($)</label>
                        <input
                          type="number"
                          value={newService.minPrice}
                          onChange={(e) => setNewService({...newService, minPrice: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Price ($)</label>
                        <input
                          type="number"
                          value={newService.maxPrice}
                          onChange={(e) => setNewService({...newService, maxPrice: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newService.isPremium}
                          onChange={(e) => setNewService({...newService, isPremium: e.target.checked})}
                          className="rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Premium Service</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newService.isFeatured}
                          onChange={(e) => setNewService({...newService, isFeatured: e.target.checked})}
                          className="rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Featured</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    onClick={handleUpdateService}
                    className="btn-primary btn-sm sm:ml-3"
                  >
                    Update Service
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="btn-outline btn-sm"
                  >
                    Cancel
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