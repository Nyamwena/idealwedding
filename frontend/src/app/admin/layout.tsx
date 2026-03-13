'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    const { user, loading } = useRequireRole('ADMIN');

    if (loading) {
        return (
            <AdminLoadingState
                message="Loading admin panel..."
                size="lg"
            />
        );
    }

    if (!user) return null;

    return <>{children}</>;
}