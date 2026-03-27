'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    action?: {
        label: string;
        href: string;
    };
}

interface UseAdminNotificationsReturn {
    notifications: AdminNotification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (
        notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>
    ) => Promise<void>;
    removeNotification: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
}

async function patchBell(body: object): Promise<void> {
    const res = await fetch('/api/admin/bell-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
        throw new Error(json.error || 'Request failed');
    }
}

export function useAdminNotifications(): UseAdminNotificationsReturn {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setError(null);
        try {
            const res = await fetch('/api/admin/bell-notifications', {
                credentials: 'include',
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Failed to load notifications');
            }
            const list = Array.isArray(json.data) ? json.data : [];
            setNotifications(
                list.map((n: AdminNotification) => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    timestamp: n.timestamp,
                    read: n.read,
                    action: n.action,
                }))
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
            setNotifications([]);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            await refresh();
            if (!cancelled) setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [refresh]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAsRead = useCallback(
        async (id: string) => {
            try {
                await patchBell({ markRead: id });
            } finally {
                await refresh();
            }
        },
        [refresh]
    );

    const markAllAsRead = useCallback(async () => {
        try {
            await patchBell({ markAllRead: true });
        } finally {
            await refresh();
        }
    }, [refresh]);

    const addNotification = useCallback(
        async (
            notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>
        ) => {
            const res = await fetch('/api/admin/bell-notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    action: notification.action,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Failed to add notification');
            }
            await refresh();
        },
        [refresh]
    );

    const removeNotification = useCallback(
        async (id: string) => {
            if (id.startsWith('computed:')) {
                await markAsRead(id);
                return;
            }
            try {
                await patchBell({ removeStored: id });
            } finally {
                await refresh();
            }
        },
        [refresh, markAsRead]
    );

    const clearAll = useCallback(async () => {
        try {
            await patchBell({ clearInbox: true });
        } finally {
            await refresh();
        }
    }, [refresh]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        refresh,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification,
        clearAll,
    };
}
