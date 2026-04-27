'use client';

import React, { useState } from 'react';

export function TestCredentials() {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Test Login Info
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Test Credentials</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Local login</strong> uses the <strong>auth service + MySQL</strong> (<code className="text-xs">user</code>{' '}
          table). There is no “any password” bypass — the account must exist and the password must match the stored hash.
        </div>
        <div className="text-xs text-gray-600">
          If login fails: confirm auth is running on port 3002, <code className="text-xs">DATABASE_URL</code> points at your
          DB, and this email exists in <code className="text-xs">user</code> (or register a new account).
        </div>
      </div>
    </div>
  );
}
