'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ProfilePage() {

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    // phone: ''
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push('/login');
  //   }
  // }, [isAuthenticated, isLoading, router]);
  //
  // useEffect(() => {
  //   if (user) {
  //     setProfileData({
  //       firstName: user.firstName || '',
  //       lastName: user.lastName || '',
  //       email: user.email || '',
  //       // phone: user.phone || ''
  //     });
  //   }
  // }, [user]);
  //
  // const handleProfileUpdate = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsUpdating(true);
  //   setError(null);
  //   setSuccess(null);
  //
  //   try {
  //     await updateProfile(profileData);
  //     setSuccess('Profile updated successfully!');
  //   } catch (err: any) {
  //     setError(err.message || 'Failed to update profile');
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    setError(null);
    setSuccess(null);

    // try {
    //     await changePassword({
    //         currentPassword: passwordData.currentPassword,
    //         newPassword: passwordData.newPassword,
    //     });
    //   setSuccess('Password changed successfully!');
    //   setPasswordData({
    //     currentPassword: '',
    //     newPassword: '',
    //     confirmPassword: ''
    //   });
    // } catch (err: any) {
    //   setError(err.message || 'Failed to change password');
    // } finally {
    //   setIsChangingPassword(false);
    // }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading profile...</p>
  //       </div>
  //     </div>
  //   );
  // }
  //
  // if (!user) {
  //   return null; // Will redirect to login
  // }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Account Settings
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your account information, security settings, and preferences.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700 shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6">
            {success}
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
              
              {/*<form onSubmit={handleProfileUpdate} className="space-y-6">*/}
              {/*  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">*/}
              {/*    <div>*/}
              {/*      <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">*/}
              {/*        First Name **/}
              {/*      </label>*/}
              {/*      <input*/}
              {/*        type="text"*/}
              {/*        id="firstName"*/}
              {/*        name="firstName"*/}
              {/*        value={profileData.firstName}*/}
              {/*        onChange={handleInputChange}*/}
              {/*        className="input w-full"*/}
              {/*        required*/}
              {/*      />*/}
              {/*    </div>*/}

              {/*    <div>*/}
              {/*      <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">*/}
              {/*        Last Name **/}
              {/*      </label>*/}
              {/*      <input*/}
              {/*        type="text"*/}
              {/*        id="lastName"*/}
              {/*        name="lastName"*/}
              {/*        value={profileData.lastName}*/}
              {/*        onChange={handleInputChange}*/}
              {/*        className="input w-full"*/}
              {/*        required*/}
              {/*      />*/}
              {/*    </div>*/}

              {/*    <div>*/}
              {/*      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">*/}
              {/*        Email Address **/}
              {/*      </label>*/}
              {/*      <input*/}
              {/*        type="email"*/}
              {/*        id="email"*/}
              {/*        name="email"*/}
              {/*        value={profileData.email}*/}
              {/*        onChange={handleInputChange}*/}
              {/*        className="input w-full"*/}
              {/*        required*/}
              {/*      />*/}
              {/*    </div>*/}

              {/*    <div>*/}
              {/*      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">*/}
              {/*        Phone Number*/}
              {/*      </label>*/}
              {/*      <input*/}
              {/*        type="tel"*/}
              {/*        id="phone"*/}
              {/*        name="phone"*/}
              {/*        // value={profileData.phone}*/}
              {/*        onChange={handleInputChange}*/}
              {/*        className="input w-full"*/}
              {/*        placeholder="(555) 123-4567"*/}
              {/*      />*/}
              {/*    </div>*/}
              {/*  </div>*/}

              {/*  <div className="flex justify-end">*/}
              {/*    <button*/}
              {/*      type="submit"*/}
              {/*      disabled={isUpdating}*/}
              {/*      className="btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"*/}
              {/*    >*/}
              {/*      {isUpdating ? 'Updating...' : 'Update Profile'}*/}
              {/*    </button>*/}
              {/*  </div>*/}
              {/*</form>*/}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password *
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    className="input w-full"
                    required
                    minLength={6}
                  />
                  <p className="text-sm text-gray-500 mt-1">Password must be at least 6 characters long</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className="input w-full"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Preferences</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                    <p className="text-gray-600 text-sm">Receive email updates about your wedding planning</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
                    <p className="text-gray-600 text-sm">Receive text message updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 className="font-semibold text-gray-900">Marketing Emails</h3>
                    <p className="text-gray-600 text-sm">Receive promotional offers and wedding tips</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
