'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

function safeInternalRedirect(raw: string | null): string | null {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
    return raw;
}

function redirectAllowedForRole(role: string, path: string): boolean {
    if (path.startsWith('/vendor')) return role === 'VENDOR';
    if (path.startsWith('/admin')) return role === 'ADMIN';
    return role === 'USER' || role === 'VENDOR' || role === 'ADMIN';
}

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        if (error) setError('');
    };

    const validateForm = () => {
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }

        if (!formData.password.trim()) {
            setError('Password is required');
            return false;
        }

        if (formData.password.length < 6) {
            setError(
                'Password must be at least 6 characters'
            );
            return false;
        }

        return true;
    };

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setError('');

        try {
            const user = await login(
                formData.email,
                formData.password
            );

            if (rememberMe) {
                localStorage.setItem(
                    'rememberMe',
                    'true'
                );
            } else {
                localStorage.removeItem(
                    'rememberMe'
                );
            }

            const next = safeInternalRedirect(searchParams.get('redirect'));
            if (next && redirectAllowedForRole(user.role, next)) {
                const firstCouple =
                    user.role !== 'ADMIN' &&
                    user.role !== 'VENDOR' &&
                    user.isFirstLogin &&
                    (next === '/dashboard' || next.startsWith('/dashboard?'));
                router.push(firstCouple ? '/dashboard?firstLogin=1' : next);
                return;
            }
            // Role-based redirect
            if (user.role === 'ADMIN') {
                router.push('/admin');
            } else if (user.role === 'VENDOR') {
                router.push('/vendor');
            } else {
                const firstQ = user.isFirstLogin ? '?firstLogin=1' : '';
                router.push(`/dashboard${firstQ}`);
            }
        } catch (err: any) {
            const msg = typeof err?.message === 'string' ? err.message : '';
            const lower = msg.toLowerCase();
            if (msg.includes('Invalid credentials') || lower.includes('unauthorized')) {
                setError('Invalid email or password. Please try again.');
            } else if (msg.includes('User not found') || lower.includes('not found')) {
                setError('No account found with this email address.');
            } else if (/1045|access denied for user|sqlstate.*1045/i.test(msg)) {
                setError(
                    'MySQL rejected the connection (error 1045). Update DATABASE_URL in backend/auth-service/.env with the correct MySQL user and password, then restart the auth service.',
                );
            } else if (
                /cannot reach the auth service|econnrefused|fetch failed|failed to fetch|503|502|service unavailable|bad gateway|internal server error|network|aborted|timeout/i.test(
                    msg,
                )
            ) {
                setError(
                    'Sign-in is unavailable. Start MySQL (listen on port 3306), then start the auth API: in backend/auth-service run npm run start (port 3002). Confirm frontend .env has AUTH_SERVICE_URL or NEXT_PUBLIC_AUTH_SERVICE_URL pointing at http://127.0.0.1:3002. Then try again.',
                );
            } else if (msg.length > 0 && msg.length < 500) {
                setError(msg);
            } else {
                setError('Login failed. Please check your connection and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = () => {
        setError(
            'Social login will be available soon!'
        );
    };

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <Header />

            <main className="flex-1 flex items-center justify-center py-16 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                  <span className="text-4xl">
                    💒
                  </span>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Welcome Back
                            </h1>
                            <p className="text-gray-600">
                                Sign in to continue planning your perfect wedding
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6"
                        >
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center">
                  <span className="mr-2">
                    ⚠️
                  </span>
                                    {error}
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-semibold text-gray-700 mb-2"
                                >
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="Enter your email"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-semibold text-gray-700 mb-2"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input w-full pr-12"
                                        placeholder="Enter your password"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword
                                            ? '🙈'
                                            : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) =>
                                            setRememberMe(
                                                e.target.checked
                                            )
                                        }
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">
                    Remember me
                  </span>
                                </label>

                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    Signing in...
                  </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-600">
                                Don&apos;t have an account?{' '}
                                <Link
                                    href="/register"
                                    className="text-primary-600 hover:text-primary-700 font-semibold"
                                >
                                    Sign up here
                                </Link>
                            </p>
                        </div>

                        {/* Social login section */}
                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    onClick={
                                        handleSocialLogin
                                    }
                                    className="btn-outline btn-md w-full hover:bg-blue-50 hover:border-blue-300"
                                >
                                    📘 Facebook
                                </button>

                                <button
                                    onClick={
                                        handleSocialLogin
                                    }
                                    className="btn-outline btn-md w-full hover:bg-red-50 hover:border-red-300"
                                >
                                    📧 Google
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="flex justify-center space-x-6 text-sm text-gray-500">
                            <span>🔒 Secure</span>
                            <span>💳 No fees</span>
                            <span>📱 Mobile friendly</span>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}