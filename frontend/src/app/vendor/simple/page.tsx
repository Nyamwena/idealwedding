'use client';

import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function SimpleVendorPage() {
  const { user,  isVendor } = useAuth();



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple Vendor Page</h1>
          <p className="text-gray-600 mb-4">Testing vendor authentication and basic functionality</p>
          
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2 text-left">
              {/*<p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : 'Not logged in'}</p>*/}
              {/*<p><strong>Email:</strong> {user?.email || 'N/A'}</p>*/}
              {/*<p><strong>Role:</strong> {user?.role || 'N/A'}</p>*/}
              {/*<p><strong>Is Vendor:</strong> {isVendor ? 'Yes' : 'No'}</p>*/}
              {/*<p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>*/}
            </div>
            
            {!isVendor && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">You need to be logged in as a vendor to access this page.</p>
                <a href="/login" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                  Go to Login
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
