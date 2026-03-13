'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function VendorHooksTestPage() {
  const { user, isVendor } = useAuth();
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    const testHooks = async () => {
      const results: any = {};
      
      try {
        // Test useVendorCredits
        const { useVendorCredits } = await import('@/hooks/useVendorCredits');
        results.creditsHook = 'OK';
      } catch (error) {
        results.creditsHook = `Error: ${error.message}`;
      }

      try {
        // Test useVendorLeads
        const { useVendorLeads } = await import('@/hooks/useVendorLeads');
        results.leadsHook = 'OK';
      } catch (error) {
        results.leadsHook = `Error: ${error.message}`;
      }

      try {
        // Test useVendorSearch
        const { useVendorSearch } = await import('@/hooks/useVendorSearch');
        results.searchHook = 'OK';
      } catch (error) {
        results.searchHook = `Error: ${error.message}`;
      }

      try {
        // Test useVendorNotifications
        const { useVendorNotifications } = await import('@/hooks/useVendorNotifications');
        results.notificationsHook = 'OK';
      } catch (error) {
        results.notificationsHook = `Error: ${error.message}`;
      }

      setTestResults(results);
    };

    testHooks();
  }, []);



  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Vendor Hooks Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
            {/*  <p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : 'Not logged in'}</p>*/}
            {/*  <p><strong>Email:</strong> {user?.email || 'N/A'}</p>*/}
            {/*  <p><strong>Role:</strong> {user?.role || 'N/A'}</p>*/}
            {/*</div>*/}
            {/*<div>*/}
            {/*  <p><strong>Is Vendor:</strong> {isVendor ? 'Yes' : 'No'}</p>*/}
            {/*  <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>*/}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Hook Import Test Results</h2>
          <div className="space-y-2">
            <p><strong>useVendorCredits:</strong> {testResults.creditsHook || 'Testing...'}</p>
            <p><strong>useVendorLeads:</strong> {testResults.leadsHook || 'Testing...'}</p>
            <p><strong>useVendorSearch:</strong> {testResults.searchHook || 'Testing...'}</p>
            <p><strong>useVendorNotifications:</strong> {testResults.notificationsHook || 'Testing...'}</p>
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Test Links</h2>
          <div className="space-x-4">
            <a href="/vendor" className="text-blue-600 hover:text-blue-800">Main Vendor Page</a>
            <a href="/vendor/working" className="text-blue-600 hover:text-blue-800">Working Vendor Page</a>
            <a href="/vendor/simple" className="text-blue-600 hover:text-blue-800">Simple Vendor Page</a>
            <a href="/login" className="text-blue-600 hover:text-blue-800">Login Page</a>
          </div>
        </div>
      </div>
    </div>
  );
}
