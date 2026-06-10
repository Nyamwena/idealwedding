'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

/** Under /vendor but usable without a vendor session (local smoke tests). */
const PUBLIC_VENDOR_PREFIXES = ['/vendor/test', '/vendor/simple', '/vendor/debug', '/vendor/hooks-test'] as const;

function isPublicVendorPath(pathname: string): boolean {
  return PUBLIC_VENDOR_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

type VendorApprovalGate = {
  isApproved: boolean;
  approvalStatus: string;
  message: string;
};

function approvalGateTitle(status: string): string {
  switch (status) {
    case 'rejected':
      return 'Application not approved';
    case 'suspended':
      return 'Account suspended';
    default:
      return 'Account pending approval';
  }
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { isVendor, loading, logout } = useAuth();
  const pathname = usePathname() || '';
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [approval, setApproval] = useState<VendorApprovalGate | null>(null);

  useEffect(() => {
    if (!isVendor || isPublicVendorPath(pathname)) {
      setApprovalLoading(false);
      setApproval(null);
      return;
    }

    let cancelled = false;
    setApprovalLoading(true);

    (async () => {
      try {
        const res = await fetch('/api/vendor/approval-status', { credentials: 'include' });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setApproval({
            isApproved: Boolean(data.isApproved),
            approvalStatus: String(data.approvalStatus || 'pending'),
            message: String(data.message || 'Your vendor account is not approved yet.'),
          });
        } else {
          setApproval({
            isApproved: false,
            approvalStatus: 'pending',
            message: 'Unable to verify your vendor approval status. Please try again later.',
          });
        }
      } catch {
        if (!cancelled) {
          setApproval({
            isApproved: false,
            approvalStatus: 'pending',
            message: 'Unable to verify your vendor approval status. Please try again later.',
          });
        }
      } finally {
        if (!cancelled) setApprovalLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isVendor, pathname]);

  if (isPublicVendorPath(pathname)) {
    return <>{children}</>;
  }

  if (loading || (isVendor && approvalLoading)) {
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

  if (approval && !approval.isApproved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-gray-50 p-6">
        <div className="max-w-lg rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
            ⏳
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            {approvalGateTitle(approval.approvalStatus)}
          </h1>
          <p className="mt-3 text-gray-600">{approval.message}</p>
          <p className="mt-2 text-sm text-gray-500">
            Vendor dashboard access is available only after an administrator approves your account.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
