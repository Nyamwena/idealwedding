'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function VendorDebugPage() {
  const { user,  isVendor } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Test the vendor hooks one by one
    const testHooks = async () => {
      try {
        // Test useVendorCredits
        const { useVendorCredits } = await import('@/hooks/useVendorCredits');
        console.log('useVendorCredits imported successfully');
        
        // Test useVendorLeads
        const { useVendorLeads } = await import('@/hooks/useVendorLeads');
        console.log('useVendorLeads imported successfully');
        
        // Test useVendorSearch
        const { useVendorSearch } = await import('@/hooks/useVendorSearch');
        console.log('useVendorSearch imported successfully');
        
        // Test useVendorNotifications
        const { useVendorNotifications } = await import('@/hooks/useVendorNotifications');
        console.log('useVendorNotifications imported successfully');
        
        setDebugInfo({
          status: 'All hooks imported successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error importing hooks:', error);
        setDebugInfo({
          status: 'Error importing hooks',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    testHooks();
  }, []);



  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Vendor Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              {/*<p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : 'Not logged in'}</p>*/}
              {/*<p><strong>Email:</strong> {user?.email || 'N/A'}</p>*/}
              {/*<p><strong>Role:</strong> {user?.role || 'N/A'}</p>*/}
              {/*<p><strong>Is Vendor:</strong> {isVendor ? 'Yes' : 'No'}</p>*/}
              {/*<p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>*/}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Hook Import Status</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> {debugInfo.status || 'Testing...'}</p>
              {debugInfo.error && (
                <p><strong>Error:</strong> {debugInfo.error}</p>
              )}
              <p><strong>Timestamp:</strong> {debugInfo.timestamp || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Test Links</h2>
          <div className="space-x-4">
            <a href="/vendor" className="text-blue-600 hover:text-blue-800">Main Vendor Page</a>
            <a href="/vendor/simple" className="text-blue-600 hover:text-blue-800">Simple Vendor Page</a>
            <a href="/login" className="text-blue-600 hover:text-blue-800">Login Page</a>
          </div>
        </div>
      </div>
    </div>
  );
}
