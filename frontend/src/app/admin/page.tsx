'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import {
    StatCard,
    ChartWidget,
    RecentActivity,
    QuickActions,
    SystemStatus
} from '@/components/admin/AdminDashboardWidgets';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';

export default function AdminPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    /**
     * 🔐 Protect Admin Route
     */
    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        if (user.role !== 'ADMIN') {
            router.replace('/');
        }
    }, [user, loading, router]);

    /**
     * ⛔ Wait for auth to finish
     */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
                <p className="text-gray-600 text-lg">Checking permissions...</p>
            </div>
        );
    }

    /**
     * ⛔ Block render if unauthorized
     */
    if (!user || user.role !== 'ADMIN') {
        return null;
    }

    const breadcrumbItems = [{ label: 'Admin Dashboard' }];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <Header />

            <main className="container-modern py-16">
                <AdminBreadcrumb items={breadcrumbItems} />

                {/* Header Section */}
                <div className="flex items-center justify-between mb-12">
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4 lg:text-6xl">
                            Admin <span className="gradient-text">Dashboard</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl">
                            Manage your Ideal Weddings platform with powerful admin tools and insights.
                        </p>
                    </div>

                    <div className="hidden lg:block">
                        <AdminNotificationBell />
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Users" value="1,234" change="+15%" changeType="increase" icon="👥" color="blue" />
                    <StatCard title="Active Vendors" value="456" change="+8%" changeType="increase" icon="🏢" color="green" />
                    <StatCard title="Total Quotes" value="2,890" change="+15%" changeType="increase" icon="💬" color="yellow" />
                    <StatCard title="Revenue" value="$45.6K" change="+22%" changeType="increase" icon="💰" color="purple" />
                </div>

                {/* Charts + System Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                        <ChartWidget title="Revenue Trends" data={[]} type="line" />
                    </div>

                    <div>
                        <SystemStatus
                            services={[
                                { name: 'API Gateway', status: 'online', uptime: '99.9%' },
                                { name: 'Database', status: 'online', uptime: '99.8%' },
                                { name: 'Payment Service', status: 'warning', uptime: '98.5%' },
                                { name: 'Email Service', status: 'online', uptime: '99.7%' },
                            ]}
                        />
                    </div>
                </div>

                {/* Quick Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <RecentActivity activities={[]} />
                    <QuickActions actions={[]} />
                </div>

                {/* Admin Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    <Link href="/admin/users">
                        <AdminCard
                            icon="👥"
                            title="User Management"
                            desc="Manage users, roles, and permissions"
                        />
                    </Link>

                    <Link href="/admin/vendors">
                        <AdminCard
                            icon="🏢"
                            title="Vendor Management"
                            desc="Approve and manage vendor accounts"
                        />
                    </Link>

                    <Link href="/admin/bookings">
                        <AdminCard
                            icon="📅"
                            title="Booking Management"
                            desc="Monitor and manage all bookings"
                        />
                    </Link>

                    <Link href="/admin/content">
                        <AdminCard
                            icon="📝"
                            title="Content Management"
                            desc="Manage blog posts and platform content"
                        />
                    </Link>

                    <Link href="/admin/analytics">
                        <AdminCard
                            icon="📊"
                            title="Analytics"
                            desc="View platform analytics and reports"
                        />
                    </Link>

                    <Link href="/admin/settings">
                        <AdminCard
                            icon="⚙️"
                            title="System Settings"
                            desc="Configure platform settings"
                        />
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}

/**
 * Admin Card Component
 */
function AdminCard({
                       icon,
                       title,
                       desc,
                   }: {
    icon: string;
    title: string;
    desc: string;
}) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <div className="text-3xl mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm">{desc}</p>
        </div>
    );
}