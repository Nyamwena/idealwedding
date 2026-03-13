'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => router.back()}
              className="btn-secondary btn-lg hover-lift"
            >
              ← Go Back
            </button>
            <Link href="/">
              <button className="btn-primary btn-lg hover-lift">
                🏠 Go Home
              </button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Pages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">🏠</div>
                  <div className="font-medium text-gray-900">Home</div>
                  <div className="text-sm text-gray-600">Main landing page</div>
                </div>
              </Link>
              
              <Link href="/about" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">ℹ️</div>
                  <div className="font-medium text-gray-900">About</div>
                  <div className="text-sm text-gray-600">Learn about us</div>
                </div>
              </Link>
              
              <Link href="/features" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">✨</div>
                  <div className="font-medium text-gray-900">Features</div>
                  <div className="text-sm text-gray-600">Platform features</div>
                </div>
              </Link>
              
              <Link href="/vendors" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">🏢</div>
                  <div className="font-medium text-gray-900">Vendors</div>
                  <div className="text-sm text-gray-600">Browse vendors</div>
                </div>
              </Link>
              
              <Link href="/login" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">🔐</div>
                  <div className="font-medium text-gray-900">Login</div>
                  <div className="text-sm text-gray-600">Sign in to your account</div>
                </div>
              </Link>
              
              <Link href="/register" className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium text-gray-900">Register</div>
                  <div className="text-sm text-gray-600">Create new account</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
