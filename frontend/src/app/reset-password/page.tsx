'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500'];
    
    return {
      score: Math.min(score, 5),
      label: labels[Math.min(score - 1, 4)],
      color: colors[Math.min(score - 1, 4)]
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err.message?.includes('Invalid token')) {
        setError('This reset link is invalid or has expired. Please request a new one.');
      } else if (err.message?.includes('Password too weak')) {
        setError('Please choose a stronger password.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
                Password Reset Successfully!
              </h1>
              <p className="text-gray-600 mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link href="/login">
                <button className="btn-primary w-full btn-lg">
                  Sign In Now
                </button>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <span className="text-4xl">⚠️</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Invalid Reset Link
              </h1>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <Link href="/forgot-password">
                <button className="btn-primary w-full btn-lg">
                  Request New Reset Link
                </button>
              </Link>
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
          {/* Reset Password Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <span className="text-4xl">🔐</span>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Reset Your Password
              </h1>
              <p className="text-gray-600">
                Enter your new password below
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
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="input w-full pr-12"
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={passwordStrength.color}>{passwordStrength.label}</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 w-8 rounded-full ${
                              level <= passwordStrength.score
                                ? passwordStrength.color.replace('text-', 'bg-')
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 8 characters with uppercase, lowercase, number, and symbol
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input w-full pr-12"
                    placeholder="Confirm new password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
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

          {/* Security Note */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">🔒 Security Note</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Choose a strong, unique password</p>
              <p>• Don't reuse passwords from other accounts</p>
              <p>• This reset link will expire after use</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
