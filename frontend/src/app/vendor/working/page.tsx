'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';

export default function WorkingVendorPage() {
  const { user,  isVendor, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (isVendor) {
      // Simulate loading
      setTimeout(() => setLoading(false), 1000);
    }
  }, [isVendor]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };



  if (!isVendor) {
    return null; // Will redirect if not vendor
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[{ label: 'Vendor Dashboard', href: '/vendor' }]} />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Vendor <span className="gradient-text">Dashboard</span></h1>
            {/*<p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Manage your business here.</p>*/}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Last login: Today</span>
            <button
              onClick={handleLogout}
              className="btn-ghost btn-md hover-lift"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading dashboard...</span>
          </div>
        ) : (
          <>
            {/* Simple Credit Balance Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Credit Balance</h2>
                  <p className="text-4xl font-bold mb-1">45</p>
                  <p className="text-blue-100">Available Credits</p>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 rounded-lg p-4 mb-2">
                    <p className="text-sm text-blue-100">Total Used</p>
                    <p className="text-xl font-bold">155</p>
                  </div>
                  <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                    Top Up Credits
                  </button>
                </div>
              </div>
            </div>

            {/* Simple Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-3xl font-bold text-gray-900">12</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <span className="text-blue-600 text-xl">📋</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Leads</p>
                    <p className="text-3xl font-bold text-gray-900">3</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <span className="text-green-600 text-xl">🆕</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Booked Leads</p>
                    <p className="text-3xl font-bold text-gray-900">8</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <span className="text-purple-600 text-xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">66.7%</p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-3">
                    <span className="text-yellow-600 text-xl">📈</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/vendor/leads">
                  <button className="w-full btn-primary btn-md">
                    📋 Manage Leads
                  </button>
                </Link>
                <Link href="/vendor/profile">
                  <button className="w-full btn-secondary btn-md">
                    👤 Update Profile
                  </button>
                </Link>
                <Link href="/vendor/services">
                  <button className="w-full btn-outline btn-md">
                    🛠️ Manage Services
                  </button>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
