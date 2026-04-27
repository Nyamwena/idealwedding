'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUserData, BudgetItem } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

type ApiBooking = {
  id: string;
  serviceCategory?: string;
  serviceName?: string;
  amount?: number;
  status?: string;
  depositPaid?: boolean;
  depositAmount?: number;
  /** User override for "spent" on budget (persisted on booking) */
  userRecordedSpent?: number | null;
  vendorName?: string;
  weddingDate?: string;
  location?: string;
  updatedAt?: string;
};

const SPENT_ADJUST_STEP = 25;

function defaultDepositSpent(b: ApiBooking): number {
  const amount = Math.max(0, Number(b.amount || 0));
  if (b.depositPaid) {
    return Math.max(0, Number(b.depositAmount ?? 0) || 0.2 * amount);
  }
  return 0;
}

function effectiveSpent(b: ApiBooking): number {
  if (b.userRecordedSpent != null && Number.isFinite(Number(b.userRecordedSpent))) {
    return Math.max(0, Number(b.userRecordedSpent));
  }
  return defaultDepositSpent(b);
}

function mapCategoryFromBooking(serviceCategory: string, serviceName: string): string {
  const raw = String(serviceCategory || serviceName || 'Other').trim() || 'Other';
  const lower = raw.toLowerCase();
  if (lower.includes('photo')) return 'Photography';
  if (lower.includes('cater')) return 'Catering';
  if (lower.includes('flower') || lower.includes('floral')) return 'Flowers';
  if (lower.includes('entertain') || lower.includes('music') || lower.includes('dj')) return 'Entertainment';
  if (lower.includes('venue')) return 'Venue';
  if (lower.includes('transport')) return 'Transportation';
  if (lower.includes('hair') || lower.includes('makeup')) return 'Hair & Makeup';
  if (lower.includes('dress') || lower.includes('attire')) return 'Dress & Attire';
  if (lower.includes('decor')) return 'Decorations';
  if (lower.includes('invit')) return 'Invitations';
  if (lower.includes('ring')) return 'Wedding Rings';
  const first = raw.charAt(0).toUpperCase() + raw.slice(1);
  return first.length > 0 ? first : 'Other';
}

const UNLISTED_VENDOR_LABEL = 'Unlisted vendor';

type VendorListEntry = { id: string; displayName: string };

type VendorSelection = 'unlisted' | { id: string; displayName: string } | null;

type BookingBudgetRow = BudgetItem & {
  /** From /api/user/bookings — pending = not yet vendor-confirmed */
  bookingLifecycle: 'pending' | 'confirmed';
  sourceBookingId: string;
};

interface BudgetTrackerProps {
  userData: ReturnType<typeof useUserData>;
}

export function BudgetTracker({ userData }: BudgetTrackerProps) {
  const { user } = useAuth();
  const { budgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem } = userData;
  const [linkedBookings, setLinkedBookings] = useState<ApiBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [savingSpentId, setSavingSpentId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    allocated: '',
    spent: '',
    vendor: '',
    status: 'planned' as BudgetItem['status']
  });

  const [vendorOptions, setVendorOptions] = useState<VendorListEntry[]>([]);
  const [vendorQuery, setVendorQuery] = useState('');
  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorPick, setVendorPick] = useState<VendorSelection>(null);
  const [unlistedDetail, setUnlistedDetail] = useState('');
  const vendorComboboxRef = useRef<HTMLDivElement>(null);

  const categories = [
    'Venue',
    'Photography',
    'Catering',
    'Flowers',
    'Entertainment',
    'Transportation',
    'Hair & Makeup',
    'Dress & Attire',
    'Decorations',
    'Invitations',
    'Wedding Rings',
    'Other'
  ];

  const statuses = [
    { value: 'planned', label: 'Planned', color: 'bg-gray-100 text-gray-800' },
    { value: 'booked', label: 'Booked', color: 'bg-blue-100 text-blue-800' },
    { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' }
  ];

  const resetVendorForm = useCallback(() => {
    setVendorQuery('');
    setVendorOpen(false);
    setVendorPick(null);
    setUnlistedDetail('');
  }, []);

  const resolveVendorForSave = (): string | undefined => {
    if (vendorPick === 'unlisted') {
      const t = unlistedDetail.trim();
      if (!t) {
        toast.error('Enter the unlisted vendor name, supplier, or item to purchase.');
        return undefined;
      }
      return t;
    }
    if (vendorPick && typeof vendorPick === 'object') {
      return vendorPick.displayName;
    }
    return formData.vendor.trim() || undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.allocated) {
      return;
    }

    const vendorResolved = resolveVendorForSave();
    if (vendorPick === 'unlisted' && vendorResolved === undefined) {
      return;
    }

    try {
      if (editingItem) {
        await updateBudgetItem(editingItem.id, {
          category: formData.category,
          allocated: parseInt(formData.allocated),
          spent: parseInt(formData.spent) || 0,
          vendor: vendorResolved,
          status: formData.status
        });
      } else {
        await addBudgetItem({
          category: formData.category,
          allocated: parseInt(formData.allocated),
          spent: parseInt(formData.spent) || 0,
          vendor: vendorResolved,
          status: formData.status
        });
      }

      // Reset form
      setFormData({
        category: '',
        allocated: '',
        spent: '',
        vendor: '',
        status: 'planned'
      });
      resetVendorForm();
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving budget item:', err);
    }
  };

  const handleEdit = (item: BudgetItem) => {
    setFormData({
      category: item.category,
      allocated: item.allocated.toString(),
      spent: item.spent.toString(),
      vendor: item.vendor || '',
      status: item.status
    });
    resetVendorForm();
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this budget item?')) {
      try {
        await deleteBudgetItem(itemId);
      } catch (err) {
        console.error('Error deleting budget item:', err);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setLinkedBookings([]);
      return;
    }
    let cancelled = false;
    const loadBookings = async () => {
      setBookingsLoading(true);
      try {
        const res = await fetch('/api/user/bookings', { credentials: 'include', cache: 'no-store' });
        const result = await res.json();
        if (!res.ok || !result?.success) {
          if (!cancelled) setLinkedBookings([]);
          return;
        }
        const rows: ApiBooking[] = Array.isArray(result.data) ? result.data : [];
        const linked = rows.filter((b) => {
          const s = String(b?.status || '').toLowerCase();
          return s === 'pending' || s === 'confirmed';
        });
        if (!cancelled) setLinkedBookings(linked);
      } catch {
        if (!cancelled) setLinkedBookings([]);
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    };
    void loadBookings();
    const onFocus = () => {
      void loadBookings();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id]);

  const maxSpendFor = (b: ApiBooking) => {
    const m = Math.max(0, Number(b.amount || 0) * 3);
    return m > 0 ? m : Number.POSITIVE_INFINITY;
  };

  const persistUserSpent = async (bookingId: string, value: number | null) => {
    setSavingSpentId(bookingId);
    try {
      const res = await fetch(`/api/user/bookings/${encodeURIComponent(bookingId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          value === null ? { userRecordedSpent: null } : { userRecordedSpent: value },
        ),
      });
      const result = await res.json();
      if (!res.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to save');
      }
      setLinkedBookings((prev) => prev.map((row) => (row.id === bookingId ? { ...row, ...result.data } : row)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update amount');
    } finally {
      setSavingSpentId(null);
    }
  };

  const adjustSpent = (b: ApiBooking, delta: number) => {
    const cap = maxSpendFor(b);
    const current = effectiveSpent(b);
    const next = Math.max(0, Math.min(current + delta, cap));
    void persistUserSpent(b.id, next);
  };

  const bookingBudgetRows: BookingBudgetRow[] = useMemo(
    () =>
      linkedBookings.map((b) => {
        const amount = Math.max(0, Number(b.amount || 0));
        const isPending = String(b?.status || '').toLowerCase() === 'pending';
        return {
          id: `__booking__${b.id}`,
          sourceBookingId: b.id,
          category: mapCategoryFromBooking(
            String(b.serviceCategory || ''),
            String(b.serviceName || ''),
          ),
          allocated: amount,
          spent: effectiveSpent(b),
          vendor: b.vendorName ? String(b.vendorName) : 'Vendor',
          status: isPending ? ('planned' as const) : ('booked' as const),
          bookingLifecycle: isPending ? 'pending' : 'confirmed',
        };
      }),
    [linkedBookings],
  );

  const combinedItems = useMemo(
    () => [...bookingBudgetRows, ...budgetItems] as (BudgetItem | BookingBudgetRow)[],
    [bookingBudgetRows, budgetItems],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/vendors', { cache: 'no-store' });
        const j = await res.json();
        if (!res.ok || !j?.success || !Array.isArray(j.data)) return;
        const byId = new Map<string, VendorListEntry>();
        for (const raw of j.data) {
          const v = raw as { id: unknown; businessName?: string; name?: string };
          const displayName = String(v.businessName || v.name || '').trim() || 'Vendor';
          byId.set(String(v.id), { id: String(v.id), displayName });
        }
        if (!cancelled) {
          setVendorOptions(
            Array.from(byId.values()).sort((a, b) => a.displayName.localeCompare(b.displayName)),
          );

        }
      } catch {
        /* keep empty list */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editingItem) return;
    if (vendorOptions.length === 0) return;
    const v = (editingItem.vendor || '').trim();
    if (!v) {
      setVendorPick(null);
      setVendorQuery('');
      setUnlistedDetail('');
      return;
    }
    const match = vendorOptions.find((x) => x.displayName === v);
    if (match) {
      setVendorPick({ id: match.id, displayName: match.displayName });
      setVendorQuery(match.displayName);
      setUnlistedDetail('');
    } else {
      setVendorPick('unlisted');
      setUnlistedDetail(v);
      setVendorQuery(UNLISTED_VENDOR_LABEL);
    }
  }, [editingItem?.id, editingItem?.vendor, vendorOptions]);

  useEffect(() => {
    if (showForm && !editingItem) {
      resetVendorForm();
    }
  }, [showForm, editingItem, resetVendorForm]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!vendorComboboxRef.current?.contains(e.target as Node)) setVendorOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filteredVendors = useMemo(() => {
    const q = vendorQuery.trim().toLowerCase();
    if (!q) return vendorOptions;
    return vendorOptions.filter((v) => v.displayName.toLowerCase().includes(q));
  }, [vendorQuery, vendorOptions]);

  const onVendorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVendorQuery(value);
    setVendorOpen(true);
    if (value === UNLISTED_VENDOR_LABEL) {
      setVendorPick('unlisted');
      return;
    }
    const listed = vendorOptions.find((o) => o.displayName === value);
    if (listed) {
      setVendorPick({ id: listed.id, displayName: listed.displayName });
      return;
    }
    setVendorPick(null);
    setUnlistedDetail('');
  };

  // Calculate budget summary (includes pending + confirmed bookings from My Bookings)
  const totalBudget = combinedItems.reduce((sum, item) => sum + item.allocated, 0);
  const totalSpent = combinedItems.reduce((sum, item) => sum + item.spent, 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate by status
  const plannedItems = combinedItems.filter((item) => item.status === 'planned');
  const bookedItems = combinedItems.filter((item) => item.status === 'booked');
  const paidItems = combinedItems.filter((item) => item.status === 'paid');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Budget Tracker</h2>
            <p className="text-gray-600">
              Track your wedding budget, manage expenses, and monitor spending across all categories.
              Bookings from <strong>My Bookings</strong> appear here: <strong>pending</strong> (awaiting
              vendor confirmation) and <strong>confirmed</strong> (vendor confirmed).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingItem(null);
                setFormData({
                  category: '',
                  allocated: '',
                  spent: '',
                  vendor: '',
                  status: 'planned',
                });
                resetVendorForm();
              } else {
                setShowForm(true);
              }
            }}
            className="btn-primary btn-lg"
          >
            {showForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-semibold text-gray-900">Total Budget</h3>
          <p className="text-2xl font-bold text-primary-600">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">💸</div>
          <h3 className="font-semibold text-gray-900">Total Spent</h3>
          <p className="text-2xl font-bold text-red-600">${totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">💵</div>
          <h3 className="font-semibold text-gray-900">Remaining</h3>
          <p className="text-2xl font-bold text-green-600">${remainingBudget.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-900">Progress</h3>
          <p className="text-2xl font-bold text-blue-600">{budgetPercentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Spent: ${totalSpent.toLocaleString()}</span>
          <span>Budget: ${totalBudget.toLocaleString()}</span>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Planned</h3>
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-3xl font-bold text-gray-600 mb-2">{plannedItems.length}</p>
          <p className="text-sm text-gray-500">
            ${plannedItems.reduce((sum, item) => sum + item.allocated, 0).toLocaleString()} allocated
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Booked</h3>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-2">{bookedItems.length}</p>
          <p className="text-sm text-gray-500">
            ${bookedItems.reduce((sum, item) => sum + item.allocated, 0).toLocaleString()} allocated
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Paid</h3>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-2">{paidItems.length}</p>
          <p className="text-sm text-gray-500">
            ${paidItems.reduce((sum, item) => sum + item.spent, 0).toLocaleString()} spent
          </p>
        </div>
      </div>

      {/* Budget Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="allocated" className="block text-sm font-semibold text-gray-700 mb-2">
                  Allocated Amount *
                </label>
                <input
                  type="number"
                  id="allocated"
                  name="allocated"
                  value={formData.allocated}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter allocated amount"
                  required
                />
              </div>

              <div>
                <label htmlFor="spent" className="block text-sm font-semibold text-gray-700 mb-2">
                  Spent Amount
                </label>
                <input
                  type="number"
                  id="spent"
                  name="spent"
                  value={formData.spent}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter spent amount"
                />
              </div>

              <div className="md:col-span-2" ref={vendorComboboxRef}>
                <label htmlFor="vendor-search" className="block text-sm font-semibold text-gray-700 mb-2">
                  Vendor
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="vendor-search"
                    autoComplete="off"
                    value={vendorQuery}
                    onChange={onVendorInputChange}
                    onFocus={() => setVendorOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setVendorOpen(false);
                    }}
                    className="input w-full"
                    placeholder="Search or select a vendor…"
                    aria-autocomplete="list"
                    aria-expanded={vendorOpen}
                    aria-controls="vendor-options-list"
                    role="combobox"
                  />
                  {vendorOpen && (
                    <ul
                      id="vendor-options-list"
                      className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                      role="listbox"
                    >
                      <li role="option">
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-primary-800 hover:bg-primary-50 focus:bg-primary-50 focus:outline-none"
                          onClick={() => {
                            setVendorPick('unlisted');
                            setVendorQuery(UNLISTED_VENDOR_LABEL);
                            setVendorOpen(false);
                          }}
                        >
                          {UNLISTED_VENDOR_LABEL}
                        </button>
                      </li>
                      {filteredVendors.length === 0 && vendorQuery.trim() !== '' && (
                        <li className="px-4 py-2 text-sm text-gray-500">No matching vendors</li>
                      )}
                      {filteredVendors.map((v) => (
                        <li key={v.id} role="option">
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                            onClick={() => {
                              setVendorPick({ id: v.id, displayName: v.displayName });
                              setVendorQuery(v.displayName);
                              setUnlistedDetail('');
                              setVendorOpen(false);
                            }}
                          >
                            {v.displayName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {vendorPick === 'unlisted' && (
                  <div className="mt-3">
                    <label
                      htmlFor="unlisted-vendor-detail"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Unlisted vendor name / supplier / item to purchase
                    </label>
                    <input
                      type="text"
                      id="unlisted-vendor-detail"
                      className="input w-full"
                      value={unlistedDetail}
                      onChange={(e) => setUnlistedDetail(e.target.value)}
                      placeholder="e.g. supplier or item to purchase"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({
                    category: '',
                    allocated: '',
                    spent: '',
                    vendor: '',
                    status: 'planned',
                  });
                  resetVendorForm();
                }}
                className="btn-outline btn-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary btn-lg"
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Items List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Budget Items</h3>
        {bookingsLoading && (
          <p className="text-sm text-gray-500 mb-4">Syncing bookings from My Bookings…</p>
        )}

        {bookingBudgetRows.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-primary-800 mb-3">From your bookings (My Bookings)</h4>
            <div className="space-y-4">
              {bookingBudgetRows.map((item) => {
                const raw = linkedBookings.find((b) => b.id === item.sourceBookingId);
                if (!raw) return null;
                const cap = maxSpendFor(raw);
                const busy = savingSpentId === raw.id;
                const spentPercentage =
                  item.allocated > 0 ? (item.spent / item.allocated) * 100 : 0;
                const isPending = item.bookingLifecycle === 'pending';
                const hasCustomSpent = raw.userRecordedSpent != null;
                return (
                  <div
                    key={item.id}
                    className={
                      isPending
                        ? 'border border-amber-200 bg-amber-50/50 rounded-xl p-4'
                        : 'border border-primary-200 bg-primary-50/40 rounded-xl p-4'
                    }
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.category}</h4>
                        {item.vendor && <p className="text-gray-600 text-sm">{item.vendor}</p>}
                        <p className={`text-xs mt-1 ${isPending ? 'text-amber-800' : 'text-primary-700'}`}>
                          {isPending
                            ? 'Awaiting vendor confirmation (booking still pending)'
                            : 'Vendor confirmed this booking'}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isPending
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isPending ? 'Pending vendor' : 'Confirmed'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Booking amount</div>
                        <div className="font-semibold text-gray-900">
                          ${item.allocated.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Spent (deposit &amp; payments)</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={busy || item.spent <= 0}
                            onClick={() => adjustSpent(raw, -SPENT_ADJUST_STEP)}
                            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                            aria-label="Decrease spent"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={Number.isFinite(cap) ? cap : undefined}
                            step={1}
                            className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm font-semibold text-red-600"
                            key={`${raw.id}-spent-${String(raw.userRecordedSpent)}-${String(raw.updatedAt)}`}
                            defaultValue={String(Math.round(effectiveSpent(raw)))}
                            disabled={busy}
                            onBlur={(e) => {
                              const n = parseFloat(e.target.value);
                              if (!Number.isFinite(n) || n < 0) {
                                return;
                              }
                              const top = Number.isFinite(cap) ? cap : n;
                              void persistUserSpent(raw.id, Math.min(n, top));
                            }}
                            aria-label="Amount spent on this booking"
                          />
                          <button
                            type="button"
                            disabled={busy || (Number.isFinite(cap) && item.spent >= cap)}
                            onClick={() => adjustSpent(raw, SPENT_ADJUST_STEP)}
                            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                            aria-label="Increase spent"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Step ${SPENT_ADJUST_STEP} ·
                          {Number.isFinite(cap) ? ` max $${Math.round(cap)}` : ' no cap'}
                          {hasCustomSpent ? ' · you set this manually' : ''}
                        </p>
                        {hasCustomSpent && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void persistUserSpent(raw.id, null)}
                            className="text-xs text-primary-700 hover:underline mt-1"
                          >
                            Use automatic deposit default
                          </button>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Remaining (line)</div>
                        <div
                          className={`font-semibold ${
                            item.allocated - item.spent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          ${(item.allocated - item.spent).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          spentPercentage > 100
                            ? 'bg-red-500'
                            : spentPercentage > 80
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {budgetItems.length === 0 && bookingBudgetRows.length === 0 && !bookingsLoading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💰</div>
            <p className="text-gray-600">No budget items yet.</p>
            <p className="text-gray-500 text-sm">
              Add your own items, or create a booking from quotations — pending and confirmed bookings
              show here.
            </p>
          </div>
        ) : (
          <div>
            {budgetItems.length > 0 && (
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Your plan</h4>
            )}
            <div className="space-y-4">
              {budgetItems.map((item) => {
                const spentPercentage = item.allocated > 0 ? (item.spent / item.allocated) * 100 : 0;
                const statusConfig = statuses.find((s) => s.value === item.status);

                return (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.category}</h4>
                        {item.vendor && <p className="text-gray-600 text-sm">{item.vendor}</p>}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig?.color}`}
                        >
                          {statusConfig?.label}
                        </span>
                        <div className="flex space-x-2">
                          <button onClick={() => handleEdit(item)} className="btn-outline btn-sm">
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Allocated</div>
                        <div className="font-semibold text-gray-900">
                          ${item.allocated.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Spent</div>
                        <div className="font-semibold text-red-600">
                          ${item.spent.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Remaining</div>
                        <div
                          className={`font-semibold ${
                            item.allocated - item.spent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          ${(item.allocated - item.spent).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          spentPercentage > 100
                            ? 'bg-red-500'
                            : spentPercentage > 80
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {spentPercentage.toFixed(1)}% of budget used
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
