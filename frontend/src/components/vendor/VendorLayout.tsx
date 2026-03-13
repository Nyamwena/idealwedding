'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { VendorNotificationBell } from '@/components/vendor/VendorNotificationBell';

interface VendorLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbItems?: Array<{ label: string; href: string }>;
  showNavigation?: boolean;
}

export function VendorLayout({ 
  children, 
  title, 
  breadcrumbItems = [],
  showNavigation = true 
}: VendorLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
  };

  const defaultBreadcrumbItems = [
    { label: 'Vendor Dashboard', href: '/vendor' },
    ...breadcrumbItems
  ];

  const navItems = [
    { label: 'Dashboard', href: '/vendor', icon: '📊' },
    { label: 'Profile', href: '/vendor/profile', icon: '👤' },
    { label: 'Leads', href: '/vendor/leads', icon: '💬', badge: '3' },
    { label: 'Services', href: '/vendor/services', icon: '🛠️' },
    { label: 'Bookings', href: '/vendor/bookings', icon: '📅' },
    { label: 'Quotes', href: '/vendor/quotes', icon: '💰' },
    { label: 'Calendar', href: '/vendor/calendar', icon: '📆' },
    { label: 'Billing', href: '/vendor/billing', icon: '💳' },
    { label: 'Reviews', href: '/vendor/reviews', icon: '⭐' },
    { label: 'Analytics', href: '/vendor/analytics', icon: '📈' },
    { label: 'Settings', href: '/vendor/settings', icon: '⚙️' },
    { label: 'Support', href: '/vendor/support', icon: '🆘' }
  ];

  const isActive = (href: string) => {
    if (href === '/vendor') {
      return pathname === '/vendor';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={defaultBreadcrumbItems} />
        
        {/* Top Navigation Bar */}
        {showNavigation && (
          <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Vendor Management</h2>
              <div className="flex items-center space-x-4">
                <VendorNotificationBell />
                {/*<span className="text-sm text-gray-600">Welcome, {user?.firstName}</span>*/}
                <button
                  onClick={handleLogout}
                  className="btn-ghost btn-sm hover-lift"
                >
                  Logout
                </button>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {title}
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your vendor account and business operations
            </p>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </main>
      
      <Footer />
    </div>
  );
}

