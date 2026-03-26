'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
    const { user, loading, logout } = useAuth();

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'ADMIN';
    const isVendor = user?.role === 'VENDOR';
    const adminDropdownRef = useRef<HTMLDivElement>(null);

    // Close admin dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
                setIsAdminDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="glass sticky top-0 z-50">
            <nav className="container-modern flex items-center justify-between py-4" aria-label="Global">
                <div className="flex lg:flex-1">
                    <Logo size="lg" className="flex-shrink-0" />
                </div>

                <div className="flex lg:hidden">
                    <button
                        type="button"
                        className="-m-2.5 inline-flex items-center justify-center rounded-xl p-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMenuOpen(true)}
                    >
                        <span className="sr-only">Open main menu</span>
                        <span className="h-6 w-6 text-2xl">☰</span>
                    </button>
                </div>

                <div className="hidden lg:flex lg:gap-x-8">
                    {isAuthenticated ? (
                        <>
                            <Link
                                href={isVendor ? "/vendor" : isAdmin ? "/admin" : "/dashboard"}
                                className="nav-link text-sm font-semibold leading-6"
                            >
                                Dashboard
                            </Link>
                            {isAdmin && (
                                <div className="relative" ref={adminDropdownRef}>
                                    <button
                                        onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                                        className="nav-link text-sm font-semibold leading-6 text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                    >
                                        Admin
                                        <svg className={`w-4 h-4 transition-transform ${isAdminDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isAdminDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                            <Link
                                                href="/admin"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                onClick={() => setIsAdminDropdownOpen(false)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">🏠</span>
                                                    <div>
                                                        <div className="font-medium">Admin Dashboard</div>
                                                        <div className="text-xs text-gray-500">Overview & Quick Actions</div>
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/admin/vendors"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                onClick={() => setIsAdminDropdownOpen(false)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">🏢</span>
                                                    <div>
                                                        <div className="font-medium">Vendor Management</div>
                                                        <div className="text-xs text-gray-500">Manage vendors & analytics</div>
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/admin/ads"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                onClick={() => setIsAdminDropdownOpen(false)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">📢</span>
                                                    <div>
                                                        <div className="font-medium">Advertisement Management</div>
                                                        <div className="text-xs text-gray-500">Banner ads & AdSense</div>
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/admin/monitoring"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                onClick={() => setIsAdminDropdownOpen(false)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">📊</span>
                                                    <div>
                                                        <div className="font-medium">System Monitoring</div>
                                                        <div className="text-xs text-gray-500">Activity & health tracking</div>
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/admin/advanced-reports"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                onClick={() => setIsAdminDropdownOpen(false)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">📈</span>
                                                    <div>
                                                        <div className="font-medium">Advanced Reports</div>
                                                        <div className="text-xs text-gray-500">Analytics & custom queries</div>
                                                    </div>
                                                </div>
                                            </Link>

                                            <div className="border-t border-gray-100 my-1"></div>

                                            <Link
                                                href="/admin/users"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                onClick={() => setIsAdminDropdownOpen(false)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">👥</span>
                                                    <div>
                                                        <div className="font-medium">User Management</div>
                                                        <div className="text-xs text-gray-500">Manage users & permissions</div>
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/admin/settings"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                onClick={() => setIsAdminDropdownOpen(false)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">⚙️</span>
                                                    <div>
                                                        <div className="font-medium">System Settings</div>
                                                        <div className="text-xs text-gray-500">Platform configuration</div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <Link href="/about" className="nav-link text-sm font-semibold leading-6">
                                About
                            </Link>
                            <Link href="/blog" className="nav-link text-sm font-semibold leading-6">
                                Blog
                            </Link>
                            <Link href="/features" className="nav-link text-sm font-semibold leading-6">
                                Features
                            </Link>
                            <Link href="/vendors" className="nav-link text-sm font-semibold leading-6">
                                Vendors
                            </Link>
                            <Link href="/vendor" className="nav-link text-sm font-semibold leading-6 text-orange-600 hover:text-orange-700">
                                🏪 Vendor Account
                            </Link>
                            <Link href="/pricing" className="nav-link text-sm font-semibold leading-6">
                                Pricing
                            </Link>
                            <Link href="/contact" className="nav-link text-sm font-semibold leading-6">
                                Contact
                            </Link>
                        </>
                    )}
                </div>

                <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-x-4">
              <span className="text-sm text-gray-600">
                {/*Welcome, {user?.firstName}*/}
              </span>
                            <button
                                onClick={logout}
                                className="btn-ghost btn-md hover-lift"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link href="/login">
                                <button className="btn-ghost btn-md hover-lift">
                                    Sign in
                                </button>
                            </Link>
                            <Link href="/register">
                                <button className="btn-primary btn-md hover-lift">
                                    Get Started
                                </button>
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="lg:hidden">
                    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
                    <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white/95 backdrop-blur-md px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                        <div className="flex items-center justify-between">
                            <Logo size="md" className="flex-shrink-0" />
                            <button
                                type="button"
                                className="-m-2.5 rounded-xl p-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span className="sr-only">Close menu</span>
                                <span className="h-6 w-6 text-2xl">✕</span>
                            </button>
                        </div>
                        <div className="mt-8 flow-root">
                            <div className="-my-6 divide-y divide-gray-200">
                                <div className="space-y-4 py-6">
                                    {isAuthenticated ? (
                                        <>
                                            <Link
                                                href={isVendor ? "/vendor" : isAdmin ? "/admin" : "/dashboard"}
                                                className="-mx-3 block rounded-xl px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Dashboard
                                            </Link>
                                            {isAdmin && (
                                                <>
                                                    <div className="px-3 py-2">
                                                        <div className="text-sm font-semibold text-purple-600 mb-2">Admin Panel</div>
                                                        <div className="space-y-2 ml-4">
                                                            <Link
                                                                href="/admin"
                                                                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                                                onClick={() => setIsMenuOpen(false)}
                                                            >
                                                                🏠 Admin Dashboard
                                                            </Link>
                                                            <Link
                                                                href="/admin/vendors"
                                                                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                                                onClick={() => setIsMenuOpen(false)}
                                                            >
                                                                🏢 Vendor Management
                                                            </Link>
                                                            <Link
                                                                href="/admin/ads"
                                                                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                                                onClick={() => setIsMenuOpen(false)}
                                                            >
                                                                📢 Advertisement Management
                                                            </Link>
                                                            <Link
                                                                href="/admin/monitoring"
                                                                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                                                onClick={() => setIsMenuOpen(false)}
                                                            >
                                                                📊 System Monitoring
                                                            </Link>
                                                            <Link
                                                                href="/admin/advanced-reports"
                                                                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                                                onClick={() => setIsMenuOpen(false)}
                                                            >
                                                                📈 Advanced Reports
                                                            </Link>
                                                            <Link
                                                                href="/admin/users"
                                                                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                                                onClick={() => setIsMenuOpen(false)}
                                                            >
                                                                👥 User Management
                                                            </Link>
                                                            <Link
                                                                href="/admin/settings"
                                                                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                                                onClick={() => setIsMenuOpen(false)}
                                                            >
                                                                ⚙️ System Settings
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href="/about"
                                                className="-mx-3 block rounded-xl px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                About
                                            </Link>
                                            <Link
                                                href="/features"
                                                className="-mx-3 block rounded-xl px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Features
                                            </Link>
                                            <Link
                                                href="/vendors"
                                                className="-mx-3 block rounded-xl px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Vendors
                                            </Link>
                                            <Link
                                                href="/vendor"
                                                className="-mx-3 block rounded-xl px-3 py-3 text-base font-semibold leading-7 text-orange-600 hover:bg-orange-50 transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                🏪 Vendor Account
                                            </Link>
                                            <Link
                                                href="/pricing"
                                                className="-mx-3 block rounded-xl px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Pricing
                                            </Link>
                                            <Link
                                                href="/contact"
                                                className="-mx-3 block rounded-xl px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Contact
                                            </Link>
                                        </>
                                    )}
                                </div>
                                <div className="py-6">
                                    <div className="space-y-4">
                                        <Link href="/login">
                                            <button className="w-full text-left -mx-3 block rounded-xl px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors">
                                                Sign in
                                            </button>
                                        </Link>
                                        <Link href="/register">
                                            <button className="w-full btn-primary btn-md hover-lift">
                                                Get Started
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
} 