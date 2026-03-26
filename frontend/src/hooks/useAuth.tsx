// COPY TO: frontend/src/hooks/useAuth.ts

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'USER' | 'ADMIN' | 'VENDOR';
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

async function fetchMe(): Promise<User | null> {
    try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) return await res.json();
        return null;
    } catch {
        return null;
    }
}

async function tryRefresh(): Promise<boolean> {
    try {
        const res = await fetch('/api/auth/refresh', {
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        setUser(data.user);
        return data.user;
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
        setUser(data.user);
        return data.user;
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