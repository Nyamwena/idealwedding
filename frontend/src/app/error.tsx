'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        <div className="text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Something went wrong!</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We encountered an unexpected error. Don't worry, our team has been notified and we're working to fix it.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={reset}
              className="btn-primary btn-lg hover-lift"
            >
              🔄 Try Again
            </button>
            <Link href="/">
              <button className="btn-secondary btn-lg hover-lift">
                🏠 Go Home
              </button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h3>
            <div className="space-y-4">
              <p className="text-gray-600">
                If this problem persists, please contact our support team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <button className="btn-outline btn-md">
                    📞 Contact Support
                  </button>
                </Link>
                <Link href="/help">
                  <button className="btn-outline btn-md">
                    ❓ Help Center
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
