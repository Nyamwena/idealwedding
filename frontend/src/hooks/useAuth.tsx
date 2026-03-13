'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';
import { apiFetch } from '@/lib/api';

interface User {
    id: number;
    email: string;
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
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeToken(token: string) {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
}

function setTokenStorage(token: string) {
    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; SameSite=Lax`;
}

export function AuthProvider({
                                 children,
                             }: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const isAdmin = user?.role === 'ADMIN';
    const isVendor = user?.role === 'VENDOR';
    const isUser = user?.role === 'USER';
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            try {
                const decoded = decodeToken(token);

                setUser({
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                });
            } catch {
                localStorage.removeItem('token');
            }
        }

        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        setTokenStorage(data.token);

        const decoded = decodeToken(data.token);

        const loggedUser = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        setUser(loggedUser);

        return loggedUser;
    };

    const register = async (payload: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role?: 'USER' | 'ADMIN' | 'VENDOR';
    }) => {
        const data = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        setTokenStorage(data.token);
        const decoded = decodeToken(data.token);
        const registeredUser = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
        setUser(registeredUser);
        return registeredUser;
    };

    const logout = () => {
        localStorage.removeItem('token');
        document.cookie =
            'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAdmin,
                isVendor,
                isUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used inside AuthProvider'
        );
    }

    return context;
}