'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { AdminErrorState } from '@/components/admin/AdminErrorState';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

export default function VendorProfilePage() {
  const { logout } = useAuth();
  const { 
    profile, 
    loading, 
    saving, 
    updateProfile, 
    addService, 
    updateService, 
    deleteService,
    addPortfolioItem,
    updateAvailability,
    uploadLogo,
    getProfileCompletion,
    refetch 
  } = useVendorProfile();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);



  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleEditProfile = () => {
    setEditData({
      businessName: profile?.businessName || '',
      description: profile?.description || '',
      contactInfo: profile?.contactInfo || {},
      businessInfo: profile?.businessInfo || {},
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(editData);
      if (result.success) {
        setShowEditModal(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    }
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setEditData({
      name: service.name,
      category: service.category,
      description: service.description,
      minPrice: service.priceRange.min,
      maxPrice: service.priceRange.max,
      isPremium: service.isPremium,
      isFeatured: service.isFeatured,
    });
    setShowAddServiceModal(true);
  };

  const handleSaveService = async () => {
    try {
      const serviceData = {
        name: editData.name,
        category: editData.category,
        description: editData.description,
        priceRange: {
          min: parseInt(editData.minPrice),
          max: parseInt(editData.maxPrice),
        },
        isPremium: editData.isPremium,
        isFeatured: editData.isFeatured,
      };

      let result;
      if (editingService) {
        result = await updateService(editingService.id, serviceData);
      } else {
        result = await addService(serviceData);
      }

      if (result.success) {
        setShowAddServiceModal(false);
        setEditingService(null);
        setEditData({});
        setSuccessMessage(editingService ? 'Service updated successfully!' : 'Service added successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to save service');
      }
    } catch (error) {
      setError('Failed to save service');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        const result = await deleteService(serviceId);
        if (result.success) {
          setSuccessMessage('Service deleted successfully!');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(result.error || 'Failed to delete service');
        }
      } catch (error) {
        setError('Failed to delete service');
      }
    }
  };

  const handleAddPortfolio = () => {
    setEditData({
      type: 'image',
      title: '',
      description: '',
      category: '',
      isPublic: true,
    });
    setShowAddPortfolioModal(true);
  };

  const handleSavePortfolio = async () => {
    try {
      const portfolioData = {
        type: editData.type,
        url: editData.url || '/images/portfolio/placeholder.jpg',
        title: editData.title,
        description: editData.description,
        category: editData.category,
        isPublic: editData.isPublic,
      };

      const result = await addPortfolioItem(portfolioData);
      if (result.success) {
        setShowAddPortfolioModal(false);
        setEditData({});
        setSuccessMessage('Portfolio item added successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to add portfolio item');
      }
    } catch (error) {
      setError('Failed to add portfolio item');
    }
  };



  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Header />
        <main className="container-modern py-8">
          <AdminErrorState 
            message={error}
            onRetry={() => {
              setError(null);
              refetch();
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const completionPercentage = getProfileCompletion();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'services', label: 'Services', icon: '🛠️' },
    { id: 'portfolio', label: 'Portfolio', icon: '🖼️' },
    { id: 'availability', label: 'Availability', icon: '📅' },
    { id: 'contact', label: 'Contact Info', icon: '📞' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[
          { label: 'Vendor Dashboard', href: '/vendor' },
          { label: 'Profile Management', href: '/vendor/profile' }
        ]} />
        
        {/* Vendor Top Menu */}
        <VendorTopMenu />
        
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-green-600 text-xl mr-3">✅</span>
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-3">❌</span>
              <div>
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 text-sm underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Profile <span className="gradient-text">Management</span></h1>
            <p className="text-gray-600 mt-2">Manage your vendor profile and business information</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Profile Completion</p>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{completionPercentage}%</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-ghost btn-md hover-lift"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Profile Status Alert */}
        {profile?.approvalStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-yellow-600 text-xl mr-3">⏳</span>
              <div>
                <h3 className="text-yellow-800 font-medium">Profile Under Review</h3>
                <p className="text-yellow-700 text-sm">Your profile is currently being reviewed by our admin team. You'll be notified once it's approved.</p>
              </div>
            </div>
          </div>
        )}

        {profile?.approvalStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-3">❌</span>
              <div>
                <h3 className="text-red-800 font-medium">Profile Rejected</h3>
                <p className="text-red-700 text-sm">Your profile was rejected. Please review the requirements and update your information.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Profile Overview</h2>
                <button
                  onClick={handleEditProfile}
                  className="btn-primary btn-md"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Edit Profile'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Profile Views</p>
                      <p className="text-2xl font-bold text-blue-900">{profile?.stats.profileViews || 0}</p>
                    </div>
                    <span className="text-blue-600 text-2xl">👁️</span>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Portfolio Views</p>
                      <p className="text-2xl font-bold text-green-900">{profile?.stats.portfolioViews || 0}</p>
                    </div>
                    <span className="text-green-600 text-2xl">🖼️</span>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Response Rate</p>
                      <p className="text-2xl font-bold text-purple-900">{profile?.stats.responseRate || 0}%</p>
                    </div>
                    <span className="text-purple-600 text-2xl">📈</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Name</label>
                      <p className="text-gray-900">{profile?.businessName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Years in Business</label>
                      <p className="text-gray-900">{profile?.businessInfo.yearsInBusiness || 0} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Team Size</label>
                      <p className="text-gray-900">{profile?.businessInfo.teamSize || 0} people</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Languages</label>
                      <p className="text-gray-900">{profile?.businessInfo.languages.join(', ') || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h3>
                  <div className="space-y-2">
                    {profile?.serviceCategories.map((category, index) => (
                      <span
                        key={index}
                        className="inline-block bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full mr-2 mb-2"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <h4 className="text-md font-medium text-gray-900 mt-4 mb-2">Service Count</h4>
                  <p className="text-gray-600">{profile?.services.length || 0} services configured</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Services Management</h2>
                <button 
                  onClick={() => {
                    setEditingService(null);
                    setEditData({
                      name: '',
                      category: '',
                      description: '',
                      minPrice: '',
                      maxPrice: '',
                      isPremium: false,
                      isFeatured: false,
                    });
                    setShowAddServiceModal(true);
                  }}
                  className="btn-primary btn-md"
                >
                  + Add Service
                </button>
              </div>

              <div className="space-y-4">
                {profile?.services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
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
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Portfolio Management</h2>
                <button 
                  onClick={handleAddPortfolio}
                  className="btn-primary btn-md"
                >
                  + Add Portfolio Item
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile?.portfolio.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      {item.type === 'image' ? (
                        <span className="text-gray-400 text-4xl">🖼️</span>
                      ) : (
                        <span className="text-gray-400 text-4xl">🎥</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{item.category}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.isPublic 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Availability Calendar</h2>
                <button className="btn-primary btn-md">
                  + Add Date
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile?.availability.map((date, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {new Date(date.date).toLocaleDateString()}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        date.status === 'available' 
                          ? 'bg-green-100 text-green-800'
                          : date.status === 'booked'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {date.status}
                      </span>
                    </div>
                    {date.eventType && (
                      <p className="text-sm text-gray-600 mb-1">Event: {date.eventType}</p>
                    )}
                    {date.notes && (
                      <p className="text-sm text-gray-500">{date.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                <button
                  onClick={() => {
                    setEditData({
                      contactInfo: {
                        email: profile?.contactInfo?.email || '',
                        phone: profile?.contactInfo?.phone || '',
                        website: profile?.contactInfo?.website || '',
                        socialMedia: {
                          facebook: profile?.contactInfo?.socialMedia?.facebook || '',
                          instagram: profile?.contactInfo?.socialMedia?.instagram || '',
                          twitter: profile?.contactInfo?.socialMedia?.twitter || '',
                        }
                      }
                    });
                    setShowEditModal(true);
                  }}
                  className="btn-primary btn-md"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Edit Contact Info'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Contact</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{profile?.contactInfo.email || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{profile?.contactInfo.phone || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <p className="text-gray-900">
                        {profile?.contactInfo.website ? (
                          <a href={profile.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                            {profile.contactInfo.website}
                          </a>
                        ) : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
                  <div className="space-y-3">
                    {profile?.contactInfo.socialMedia?.facebook && (
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">📘</span>
                        <a href={profile.contactInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                          Facebook
                        </a>
                      </div>
                    )}
                    {profile?.contactInfo.socialMedia?.instagram && (
                      <div className="flex items-center space-x-2">
                        <span className="text-pink-600">📷</span>
                        <a href={profile.contactInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                          Instagram
                        </a>
                      </div>
                    )}
                    {profile?.contactInfo.socialMedia?.twitter && (
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400">🐦</span>
                        <a href={profile.contactInfo.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                          Twitter
                        </a>
                      </div>
                    )}
                    {(!profile?.contactInfo.socialMedia?.facebook && !profile?.contactInfo.socialMedia?.instagram && !profile?.contactInfo.socialMedia?.twitter) && (
                      <p className="text-gray-500 text-sm">No social media links added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Visibility Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Profile Visibility</label>
                        <p className="text-xs text-gray-500">Control who can see your profile</p>
                      </div>
                      <select className="border border-gray-300 rounded-md px-3 py-1">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Show Pricing</label>
                        <p className="text-xs text-gray-500">Display price ranges on your profile</p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked={profile?.settings.showPricing} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Allow Direct Booking</label>
                        <p className="text-xs text-gray-500">Let couples book directly through your profile</p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked={profile?.settings.allowDirectBooking} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Management</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Auto-Accept Leads</label>
                        <p className="text-xs text-gray-500">Automatically accept new leads</p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked={profile?.settings.autoAcceptLeads} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                        <p className="text-xs text-gray-500">Receive email alerts for new leads</p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked={profile?.settings.leadNotificationEmail} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                        <p className="text-xs text-gray-500">Receive SMS alerts for urgent leads</p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked={profile?.settings.leadNotificationSMS} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Profile</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Name</label>
                      <input
                        type="text"
                        value={editData.businessName || ''}
                        onChange={(e) => setEditData({...editData, businessName: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={editData.contactInfo?.email || ''}
                        onChange={(e) => setEditData({...editData, contactInfo: {...editData.contactInfo, email: e.target.value}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="text"
                        value={editData.contactInfo?.phone || ''}
                        onChange={(e) => setEditData({...editData, contactInfo: {...editData.contactInfo, phone: e.target.value}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <input
                        type="url"
                        value={editData.contactInfo?.website || ''}
                        onChange={(e) => setEditData({...editData, contactInfo: {...editData.contactInfo, website: e.target.value}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Facebook URL</label>
                      <input
                        type="url"
                        value={editData.contactInfo?.socialMedia?.facebook || ''}
                        onChange={(e) => setEditData({...editData, contactInfo: {...editData.contactInfo, socialMedia: {...editData.contactInfo?.socialMedia, facebook: e.target.value}}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
                      <input
                        type="url"
                        value={editData.contactInfo?.socialMedia?.instagram || ''}
                        onChange={(e) => setEditData({...editData, contactInfo: {...editData.contactInfo, socialMedia: {...editData.contactInfo?.socialMedia, instagram: e.target.value}}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="https://instagram.com/yourpage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Twitter URL</label>
                      <input
                        type="url"
                        value={editData.contactInfo?.socialMedia?.twitter || ''}
                        onChange={(e) => setEditData({...editData, contactInfo: {...editData.contactInfo, socialMedia: {...editData.contactInfo?.socialMedia, twitter: e.target.value}}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="https://twitter.com/yourpage"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    onClick={handleSaveProfile}
                    className="btn-primary btn-sm sm:ml-3"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
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

        {/* Add/Edit Service Modal */}
        {showAddServiceModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service Name</label>
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., Wedding Photography"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={editData.category || ''}
                        onChange={(e) => setEditData({...editData, category: e.target.value})}
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
                        value={editData.description || ''}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
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
                          value={editData.minPrice || ''}
                          onChange={(e) => setEditData({...editData, minPrice: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Price ($)</label>
                        <input
                          type="number"
                          value={editData.maxPrice || ''}
                          onChange={(e) => setEditData({...editData, maxPrice: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="2000"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editData.isPremium || false}
                          onChange={(e) => setEditData({...editData, isPremium: e.target.checked})}
                          className="rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Premium Service</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editData.isFeatured || false}
                          onChange={(e) => setEditData({...editData, isFeatured: e.target.checked})}
                          className="rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Featured</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    onClick={handleSaveService}
                    className="btn-primary btn-sm sm:ml-3"
                  >
                    {editingService ? 'Update Service' : 'Add Service'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddServiceModal(false);
                      setEditingService(null);
                      setEditData({});
                    }}
                    className="btn-outline btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Portfolio Modal */}
        {showAddPortfolioModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add Portfolio Item</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={editData.title || ''}
                        onChange={(e) => setEditData({...editData, title: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., Garden Wedding Ceremony"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={editData.category || ''}
                        onChange={(e) => setEditData({...editData, category: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select category</option>
                        <option value="Photography">Photography</option>
                        <option value="Videography">Videography</option>
                        <option value="Wedding Planning">Wedding Planning</option>
                        <option value="Catering">Catering</option>
                        <option value="Floral">Floral</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Describe this portfolio item..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        value={editData.type || 'image'}
                        onChange={(e) => setEditData({...editData, type: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editData.isPublic || true}
                        onChange={(e) => setEditData({...editData, isPublic: e.target.checked})}
                        className="rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Make this item public</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    onClick={handleSavePortfolio}
                    className="btn-primary btn-sm sm:ml-3"
                  >
                    Add Portfolio Item
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPortfolioModal(false);
                      setEditData({});
                    }}
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