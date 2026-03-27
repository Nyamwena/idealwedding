'use client';

import { useEffect, useState, useCallback } from 'react';
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
    SystemStatus,
    type RecentActivityItem,
} from '@/components/admin/AdminDashboardWidgets';

const ADMIN_QUICK_ACTIONS: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    href: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}> = [
    {
        id: 'qa-users',
        title: 'User accounts',
        description: 'Manage users, roles, and access',
        icon: '👥',
        href: '/admin/users',
        color: 'blue',
    },
    {
        id: 'qa-vendors',
        title: 'Vendors',
        description: 'Review applications and profiles',
        icon: '🏢',
        href: '/admin/vendors',
        color: 'green',
    },
    {
        id: 'qa-bookings',
        title: 'Bookings',
        description: 'View and update reservations',
        icon: '📅',
        href: '/admin/bookings',
        color: 'purple',
    },
    {
        id: 'qa-quotes',
        title: 'Quotes',
        description: 'Track quote requests',
        icon: '💬',
        href: '/admin/quotes',
        color: 'yellow',
    },
    {
        id: 'qa-payments',
        title: 'Payments',
        description: 'Transactions and revenue',
        icon: '💳',
        href: '/admin/payments',
        color: 'blue',
    },
    {
        id: 'qa-notifications',
        title: 'Notifications',
        description: 'Campaigns and admin messages',
        icon: '🔔',
        href: '/admin/notifications',
        color: 'red',
    },
];
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';

function formatCount(n: number): string {
    return n.toLocaleString();
}

function formatRevenueUsd(n: number): string {
    return n.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: n >= 1000 ? 0 : 2,
    });
}

export default function AdminPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [stats, setStats] = useState<{
        totalUsers: number;
        activeVendors: number;
        totalQuotes: number;
        revenueTotal: number;
        revenueTrend: { label: string; total: number }[];
        recentActivity: RecentActivityItem[];
    } | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
            const res = await fetch('/api/admin/dashboard-stats', {
                credentials: 'include',
            });
            const json = await res.json();
            if (!res.ok || !json.success || !json.data) {
                throw new Error(json.error || 'Failed to load stats');
            }
            setStats(json.data);
        } catch (e) {
            setStatsError(e instanceof Error ? e.message : 'Failed to load stats');
            setStats(null);
        } finally {
            setStatsLoading(false);
        }
    }, []);

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

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return;
        void loadStats();
    }, [user, loadStats]);

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

                {/* Statistics (live: users from DB; vendors / quotes / revenue from platform data store) */}
                {statsError && (
                    <div className="mb-4 rounded-lg bg-amber-50 text-amber-900 px-4 py-3 text-sm">
                        Could not load dashboard stats: {statsError}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Users"
                        value={statsLoading ? '…' : formatCount(stats?.totalUsers ?? 0)}
                        icon="👥"
                        color="blue"
                        sublabel="Registered users (database)"
                    />
                    <StatCard
                        title="Active Vendors"
                        value={statsLoading ? '…' : formatCount(stats?.activeVendors ?? 0)}
                        icon="🏢"
                        color="green"
                        sublabel="Non-suspended vendor profiles"
                    />
                    <StatCard
                        title="Total Quotes"
                        value={statsLoading ? '…' : formatCount(stats?.totalQuotes ?? 0)}
                        icon="💬"
                        color="yellow"
                        sublabel="All quote requests on record"
                    />
                    <StatCard
                        title="Revenue"
                        value={statsLoading ? '…' : formatRevenueUsd(stats?.revenueTotal ?? 0)}
                        icon="💰"
                        color="purple"
                        sublabel="Sum of completed payments"
                    />
                </div>

                {/* Charts + System Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                        <ChartWidget
                            title="Revenue Trends"
                            series={
                                stats?.revenueTrend?.map((p) => ({
                                    label: p.label,
                                    value: p.total,
                                })) ?? []
                            }
                            loading={statsLoading}
                        />
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
                    <RecentActivity
                        activities={stats?.recentActivity ?? []}
                        loading={statsLoading}
                    />
                    <QuickActions actions={ADMIN_QUICK_ACTIONS} />
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