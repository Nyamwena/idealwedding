'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function useRequireRole(
    role: 'ADMIN' | 'USER' | 'VENDOR'
) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        if (user.role !== role) {
            router.replace('/');
        }
    }, [user, loading, role, router]);

    return { user, loading };
}