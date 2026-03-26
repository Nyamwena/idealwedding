'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      if (err.message?.includes('User not found')) {
        setError('No account found with this email address.');
      } else {
        setError('Failed to send reset email. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <span className="text-4xl">✅</span>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Check Your Email
              </h1>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm mb-6">
                <p>If you don't see the email, check your spam folder.</p>
              </div>
              <Link href="/login">
                <button className="btn-primary w-full btn-lg mb-4">
                  Back to Login
                </button>
              </Link>
              <p className="text-sm text-gray-500">
                Didn't receive the email?{' '}
                <button 
                  onClick={() => setSuccess(false)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          {/* Forgot Password Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <span className="text-4xl">🔐</span>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </h1>
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="input w-full"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Check your spam folder for the reset email</p>
              <p>• Make sure you're using the email address you registered with</p>
              <p>• Contact support if you continue to have issues</p>
            </div>
            <div className="mt-4">
              <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
