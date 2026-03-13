'use client';

export default function VendorTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Test Page</h1>
        <p className="text-gray-600">This is a simple test page to verify the vendor route is working.</p>
        <div className="mt-4">
          <a href="/vendor" className="text-blue-600 hover:text-blue-800">Go to Vendor Dashboard</a>
        </div>
      </div>
    </div>
  );
}
