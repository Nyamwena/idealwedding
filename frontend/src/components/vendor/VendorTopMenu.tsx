'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function VendorTopMenu() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/vendor', label: 'Dashboard', icon: '🏠' },
    { href: '/vendor/leads', label: 'Leads', icon: '💬' },
    { href: '/vendor/bookings', label: 'Bookings', icon: '📅' },
    { href: '/vendor/quotes', label: 'Quotes', icon: '💰' },
    { href: '/vendor/services', label: 'Services', icon: '🛠️' },
    { href: '/vendor/analytics', label: 'Analytics', icon: '📊' },
    { href: '/vendor/billing', label: 'Billing', icon: '💳' },
    { href: '/vendor/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="px-6">
        <div className="flex space-x-8">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}