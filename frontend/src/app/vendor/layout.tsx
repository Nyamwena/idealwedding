'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/** Under /vendor but usable without a vendor session (local smoke tests). */
const PUBLIC_VENDOR_PREFIXES = ['/vendor/test', '/vendor/simple', '/vendor/debug', '/vendor/hooks-test'] as const;

function isPublicVendorPath(pathname: string): boolean {
  return PUBLIC_VENDOR_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { isVendor, loading } = useAuth();
  const pathname = usePathname() || '';

  if (isPublicVendorPath(pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
          <p className="mt-4 text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isVendor) {
    const signInHref = `/login?redirect=${encodeURIComponent(pathname || '/vendor')}`;
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-semibold text-gray-900">Vendor sign-in required</h1>
          <p className="mt-2 text-gray-600">
            Sign in with a vendor account to view leads, billing, and your dashboard.
          </p>
          <Link
            href={signInHref}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Sign in
          </Link>
          <Link href="/" className="mt-4 block text-sm text-primary-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
