'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  description: string;
  badge?: string;
}

export function VendorNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/vendor',
      icon: '📊',
      description: 'Overview & Statistics'
    },
    {
      label: 'Profile',
      href: '/vendor/profile',
      icon: '👤',
      description: 'Business Profile Management'
    },
    {
      label: 'Leads',
      href: '/vendor/leads',
      icon: '💬',
      description: 'Lead Tracking & Management',
      badge: '3'
    },
    {
      label: 'Services',
      href: '/vendor/services',
      icon: '🛠️',
      description: 'Portfolio & Services'
    },
    {
      label: 'Bookings',
      href: '/vendor/bookings',
      icon: '📅',
      description: 'Booking Management'
    },
    {
      label: 'Quotes',
      href: '/vendor/quotes',
      icon: '💰',
      description: 'Quote Management'
    },
    {
      label: 'Calendar',
      href: '/vendor/calendar',
      icon: '📆',
      description: 'Availability & Schedule'
    },
    {
      label: 'Billing',
      href: '/vendor/billing',
      icon: '💳',
      description: 'Credits & Billing'
    },
    {
      label: 'Reviews',
      href: '/vendor/reviews',
      icon: '⭐',
      description: 'Reviews & Ratings'
    },
    {
      label: 'Analytics',
      href: '/vendor/analytics',
      icon: '📈',
      description: 'Performance Analytics'
    },
    {
      label: 'Settings',
      href: '/vendor/settings',
      icon: '⚙️',
      description: 'Account Settings'
    },
    {
      label: 'Support',
      href: '/vendor/support',
      icon: '🆘',
      description: 'Help & Support'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/vendor') {
      return pathname === '/vendor';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white shadow-lg rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Vendor Management</h2>
          <div className="text-sm text-gray-500">
            Quick Access Menu
          </div>
        </div>
        
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                isActive(item.href)
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-primary-300 bg-white'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`text-2xl ${isActive(item.href) ? 'animate-pulse' : ''}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className={`font-semibold text-sm ${
                      isActive(item.href) ? 'text-primary-700' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </h3>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${
                    isActive(item.href) ? 'text-primary-600' : 'text-gray-600'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </div>
              
              {isActive(item.href) && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden bg-white shadow-lg rounded-2xl p-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Vendor Menu</h2>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">
              {isMobileMenuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 border-l-4 border-primary-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      isActive(item.href) ? 'text-primary-700' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${
                    isActive(item.href) ? 'text-primary-600' : 'text-gray-600'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

