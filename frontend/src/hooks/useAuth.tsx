// COPY TO: frontend/src/hooks/useAuth.ts

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { readFirstLoginFlag } from '@/lib/authFirstLogin';

interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'USER' | 'ADMIN' | 'VENDOR';
    /** Set from auth API / JWT when the backend marks this session as a first sign-in. */
    isFirstLogin?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    isVendor: boolean;
    isUser: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (payload: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role?: 'USER' | 'ADMIN' | 'VENDOR';
    }) => Promise<User>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Prevents session restore from hanging forever if auth API or upstream refresh never responds. */
const AUTH_FETCH_TIMEOUT_MS = 12_000;

async function fetchWithAuthTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), AUTH_FETCH_TIMEOUT_MS);
    try {
        return await fetch(input, { ...init, signal: ctrl.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function fetchMe(): Promise<User | null> {
    try {
        const res = await fetchWithAuthTimeout('/api/auth/me', { credentials: 'include' });
        if (res.ok) return await res.json();
        return null;
    } catch {
        return null;
    }
}

async function tryRefresh(): Promise<boolean> {
    try {
        const res = await fetchWithAuthTimeout('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
        });
        return res.ok;
    } catch {
        return false;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.role === 'ADMIN';
    const isVendor = user?.role === 'VENDOR';
    const isUser = user?.role === 'USER';

    useEffect(() => {
        const restoreSession = async () => {
            try {
                let currentUser = await fetchMe();
                if (!currentUser) {
                    const refreshed = await tryRefresh();
                    if (refreshed) {
                        currentUser = await fetchMe();
                    }
                }
                setUser(currentUser);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = async (email: string, password: string): Promise<User> => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        let data: { message?: string; user?: unknown } = {};
        try {
            const text = await res.text();
            if (text) data = JSON.parse(text) as { message?: string; user?: unknown };
        } catch {
            if (!res.ok) throw new Error(res.statusText || 'Login failed');
        }
        if (!res.ok) {
            const m = data.message;
            const detail =
                typeof m === 'string' ? m : Array.isArray(m) && m[0] != null ? String(m[0]) : 'Login failed';
            throw new Error(detail);
        }
        const envelope = data as Record<string, unknown>;
        const raw = envelope.user as Record<string, unknown> | undefined;
        if (!raw) throw new Error(data.message || 'Login failed');
        const firstLogin = readFirstLoginFlag(raw, envelope);
        const user: User = {
            ...(raw as unknown as User),
            ...(firstLogin ? { isFirstLogin: true } : {}),
        };
        setUser(user);
        return user;
    };

    const register = async (payload: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role?: 'USER' | 'ADMIN' | 'VENDOR';
    }): Promise<User> => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        const envelope = data as Record<string, unknown>;
        const raw = envelope.user as Record<string, unknown> | undefined;
        if (!raw) throw new Error(data.message || 'Registration failed');
        const firstLogin = readFirstLoginFlag(raw, envelope);
        const user: User = {
            ...(raw as unknown as User),
            ...(firstLogin ? { isFirstLogin: true } : {}),
        };
        setUser(user);
        return user;
    };

    const logout = async (): Promise<void> => {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        }).catch(() => {});
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, logout, isAdmin, isVendor, isUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
}