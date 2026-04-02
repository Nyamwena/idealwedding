'use client';

import Link from 'next/link';
import toast from 'react-hot-toast';
import { useVendorLeads } from '@/hooks/useVendorLeads';
import { useVendorCredits } from '@/hooks/useVendorCredits';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

type LeadStatus = 'new' | 'contacted' | 'quoted' | 'booked' | 'declined';

export default function VendorLeadsPage() {
  const { creditData, loading: creditsLoading } = useVendorCredits();
  const {
    leads,
    stats,
    loading: leadsLoading,
    updateLeadStatus,
    simulateNewLead,
    refetch,
  } = useVendorLeads();

  const loading = leadsLoading || creditsLoading;

  const statusBadge = (status: string) => {
    const c =
      status === 'new'
        ? 'bg-green-100 text-green-800'
        : status === 'contacted'
          ? 'bg-blue-100 text-blue-800'
          : status === 'quoted'
            ? 'bg-yellow-100 text-yellow-800'
            : status === 'booked'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-red-100 text-red-800';
    return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      <main className="container-modern py-8">
        <AdminBreadcrumb
          items={[
            { label: 'Vendor Dashboard', href: '/vendor' },
            { label: 'Leads', href: '/vendor/leads' },
          ]}
        />
        <VendorTopMenu />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Vendor <span className="gradient-text">Leads</span>
            </h1>
            <p className="mt-2 text-gray-600">
              Incoming inquiries scoped to your account. Update status and open quotes from here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-outline btn-md"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await simulateNewLead();
                if (!ok) {
                  toast.error('Could not add lead — need at least 5 credits.');
                }
              }}
              className="btn-primary btn-md disabled:opacity-50"
              disabled={loading || creditData.currentCredits < 5}
            >
              Simulate lead (5 credits)
            </button>
            <Link href="/vendor/quotes" className="btn-secondary btn-md inline-flex items-center">
              Manage quotes
            </Link>
          </div>
        </div>

        {creditData.currentCredits < 5 && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You need at least <strong>5 credits</strong> to simulate a new lead.{' '}
            <Link href="/vendor/billing" className="font-medium underline">
              Top up billing
            </Link>
            .
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total', value: stats.totalLeads },
            { label: 'New', value: stats.newLeads },
            { label: 'Quoted', value: stats.quotedLeads },
            { label: 'Booked', value: stats.bookedLeads },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-4 shadow-lg">
              <p className="text-sm text-gray-600">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-600">
            <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
            Loading leads…
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-lg">
            <span className="text-4xl">📭</span>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">No leads yet</h2>
            <p className="mt-2 text-gray-600">
              Leads tied to your vendor account will show here. Use “Simulate lead” to test with credits,
              or wait for real inquiries.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/vendor" className="btn-outline btn-md">
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700">Couple</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Service</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Location</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                    )
                    .map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{lead.coupleName}</div>
                          <div className="text-xs text-gray-500">{lead.coupleEmail}</div>
                          {lead.referralTag && (
                            <div className="text-xs text-primary-600">{lead.referralTag}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{lead.serviceCategory}</td>
                        <td className="px-4 py-3 text-gray-700">{lead.location}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(lead.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={statusBadge(lead.status)}>{lead.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <select
                              className="form-select max-w-[10rem] text-sm"
                              value={lead.status}
                              onChange={async (e) => {
                                await updateLeadStatus(lead.id, e.target.value as LeadStatus);
                              }}
                            >
                              {(
                                ['new', 'contacted', 'quoted', 'booked', 'declined'] as LeadStatus[]
                              ).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <Link
                              href="/vendor/quotes"
                              className="text-xs font-medium text-primary-600 hover:underline"
                            >
                              Create quote →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
