import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { verifyToken } from '@/lib/auth';

export type BellType = 'info' | 'success' | 'warning' | 'error';

export interface BellNotificationDTO {
    id: string;
    type: BellType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    action?: { label: string; href: string };
    source: 'stored' | 'computed';
}

interface StoredBellItem {
    id: string;
    type: BellType;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
    action?: { label: string; href: string };
}

interface BellInboxStore {
    items: StoredBellItem[];
    /** For computed:* ids: hide while count <= dismissedCount until count rises */
    computedDismissed: Record<string, number>;
}

const STORE_KEY = 'admin-bell-inbox.json';
const EMPTY_STORE: BellInboxStore = { items: [], computedDismissed: {} };

function getAuthToken(request: NextRequest): string | null {
 const header = request.headers.get('authorization');
 if (header?.startsWith('Bearer ')) return header.slice(7);
 return request.cookies.get('accessToken')?.value || null;
}

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
 const token = getAuthToken(request);
 if (!token) {
 return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
 }
 const user = await verifyToken(token);
 if (!user) {
 return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
 }
 if (user.role.toUpperCase() !== 'ADMIN') {
 return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
 }
 return null;
}

async function readStore(): Promise<BellInboxStore> {
 const raw = await readDataFile<unknown>(STORE_KEY, EMPTY_STORE);
 if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
 const o = raw as Record<string, unknown>;
 const items = Array.isArray(o.items) ? (o.items as StoredBellItem[]) : [];
 const computedDismissed =
 typeof o.computedDismissed === 'object' &&
 o.computedDismissed !== null &&
 !Array.isArray(o.computedDismissed)
 ? (o.computedDismissed as Record<string, number>)
 : {};
 return { items, computedDismissed };
 }
 return { ...EMPTY_STORE };
}

async function saveStore(store: BellInboxStore): Promise<void> {
 await writeDataFile(STORE_KEY, store);
}

async function loadVendorsArray(): Promise<any[]> {
 const raw = await readDataFile<any>('vendors.json', []);
 if (Array.isArray(raw)) return raw;
 if (raw && typeof raw === 'object' && Array.isArray(raw.vendors)) return raw.vendors;
 return [];
}

async function loadQuotesArray(): Promise<any[]> {
 const raw = await readDataFile<any>('quotes.json', []);
 if (Array.isArray(raw)) return raw;
 if (raw && typeof raw === 'object' && Array.isArray(raw.quotes)) return raw.quotes;
 return [];
}

async function loadPaymentsArray(): Promise<any[]> {
 const raw = await readDataFile<any>('payments.json', []);
 if (Array.isArray(raw)) return raw;
 return [];
}

function pendingVendorCount(vendors: any[]): number {
 return vendors.filter(
 (v) => String(v?.status ?? '').toLowerCase() === 'pending'
 ).length;
}

function pendingQuoteCount(quotes: any[]): number {
 return quotes.filter((q) => {
 const s = String(q?.status ?? 'pending').toLowerCase();
 return s === 'pending' || s === 'new' || s === 'awaiting';
 }).length;
}

function failedPaymentCount(payments: any[]): number {
 return payments.filter((p) => {
 const s = String(p?.status ?? '').toLowerCase();
 return s === 'failed' || s === 'declined' || s === 'error';
 }).length;
}

function computedVisible(
 id: string,
 count: number,
 store: BellInboxStore
): boolean {
 if (count <= 0) return false;
 const dismissed = store.computedDismissed[id];
 if (dismissed === undefined) return true;
 return count > dismissed;
}

function buildComputed(
 id: string,
 type: BellType,
 title: string,
 message: string,
 href: string,
 label: string,
 count: number,
 store: BellInboxStore
): BellNotificationDTO | null {
 if (!computedVisible(id, count, store)) return null;
 return {
 id,
 type,
 title,
 message,
 timestamp: new Date().toISOString(),
 read: false,
 action: { label, href },
 source: 'computed',
 };
}

function sortBell(a: BellNotificationDTO, b: BellNotificationDTO): number {
 return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

export async function GET(request: NextRequest) {
 try {
 const authError = await requireAdmin(request);
 if (authError) return authError;

 const store = await readStore();
 const [vendors, quotes, payments] = await Promise.all([
 loadVendorsArray(),
 loadQuotesArray(),
 loadPaymentsArray(),
 ]);

 const pv = pendingVendorCount(vendors);
 const pq = pendingQuoteCount(quotes);
 const pf = failedPaymentCount(payments);

 const computed: BellNotificationDTO[] = [];
 const c1 = buildComputed(
 'computed:pending-vendors',
 'info',
 'Vendor applications',
 pv === 1
 ? '1 vendor application is awaiting review.'
 : `${pv} vendor applications are awaiting review.`,
 '/admin/vendors',
 'Review',
 pv,
 store
 );
 if (c1) computed.push(c1);

 const c2 = buildComputed(
 'computed:pending-quotes',
 'warning',
 'Pending quotes',
 pq === 1
 ? '1 quote request needs attention.'
 : `${pq} quote requests need attention.`,
 '/admin/quotes',
 'View quotes',
 pq,
 store
 );
 if (c2) computed.push(c2);

 const c3 = buildComputed(
 'computed:failed-payments',
 'error',
 'Payment issues',
 pf === 1
 ? '1 payment failed or was declined.'
 : `${pf} payments failed or were declined.`,
 '/admin/payments',
 'Open payments',
 pf,
 store
 );
 if (c3) computed.push(c3);

 const stored: BellNotificationDTO[] = store.items.map((i) => ({
 id: i.id,
 type: i.type,
 title: i.title,
 message: i.message,
 timestamp: i.createdAt,
 read: i.read,
 action: i.action,
 source: 'stored' as const,
 }));

 const data = [...stored, ...computed].sort(sortBell);

 return NextResponse.json({ success: true, data });
 } catch (e) {
 console.error('GET /api/admin/bell-notifications', e);
 return NextResponse.json(
 { success: false, error: 'Failed to load notifications' },
 { status: 500 }
 );
 }
}

export async function PATCH(request: NextRequest) {
 try {
 const authError = await requireAdmin(request);
 if (authError) return authError;

 const body = await request.json().catch(() => ({}));
 const markRead = typeof body.markRead === 'string' ? body.markRead : null;
 const markAllRead = body.markAllRead === true;

 const store = await readStore();

 if (markAllRead) {
 store.items = store.items.map((i) => ({ ...i, read: true }));
 const vendors = await loadVendorsArray();
 const quotes = await loadQuotesArray();
 const payments = await loadPaymentsArray();
 store.computedDismissed['computed:pending-vendors'] = pendingVendorCount(
 vendors
 );
 store.computedDismissed['computed:pending-quotes'] = pendingQuoteCount(quotes);
 store.computedDismissed['computed:failed-payments'] = failedPaymentCount(
 payments
 );
 Object.keys(store.computedDismissed).forEach((k) => {
 const v = store.computedDismissed[k];
 if (v <= 0) delete store.computedDismissed[k];
 });
 await saveStore(store);
 return NextResponse.json({ success: true });
 }

 const clearInbox = body.clearInbox === true;
 if (clearInbox) {
 store.items = [];
 const vendors = await loadVendorsArray();
 const quotes = await loadQuotesArray();
 const payments = await loadPaymentsArray();
 store.computedDismissed['computed:pending-vendors'] = pendingVendorCount(
 vendors
 );
 store.computedDismissed['computed:pending-quotes'] = pendingQuoteCount(quotes);
 store.computedDismissed['computed:failed-payments'] = failedPaymentCount(
 payments
 );
 Object.keys(store.computedDismissed).forEach((k) => {
 const v = store.computedDismissed[k];
 if (v <= 0) delete store.computedDismissed[k];
 });
 await saveStore(store);
 return NextResponse.json({ success: true });
 }

 const removeStored =
 typeof body.removeStored === 'string' ? body.removeStored : null;
 if (removeStored) {
 store.items = store.items.filter((i) => i.id !== removeStored);
 await saveStore(store);
 return NextResponse.json({ success: true });
 }

 if (markRead) {
 if (markRead.startsWith('computed:')) {
 const vendors = await loadVendorsArray();
 const quotes = await loadQuotesArray();
 const payments = await loadPaymentsArray();
 if (markRead === 'computed:pending-vendors') {
 const n = pendingVendorCount(vendors);
 if (n <= 0) delete store.computedDismissed[markRead];
 else store.computedDismissed[markRead] = n;
 } else if (markRead === 'computed:pending-quotes') {
 const n = pendingQuoteCount(quotes);
 if (n <= 0) delete store.computedDismissed[markRead];
 else store.computedDismissed[markRead] = n;
 } else if (markRead === 'computed:failed-payments') {
 const n = failedPaymentCount(payments);
 if (n <= 0) delete store.computedDismissed[markRead];
 else store.computedDismissed[markRead] = n;
 }
 } else {
 const item = store.items.find((i) => i.id === markRead);
 if (item) item.read = true;
 }
 await saveStore(store);
 return NextResponse.json({ success: true });
 }

 return NextResponse.json(
 {
 success: false,
 error:
 'Expected markRead, markAllRead, clearInbox, or removeStored',
 },
 { status: 400 }
 );
 } catch (e) {
 console.error('PATCH /api/admin/bell-notifications', e);
 return NextResponse.json(
 { success: false, error: 'Failed to update notifications' },
 { status: 500 }
 );
 }
}

/** Optional: add a manual admin inbox message (persisted). */
export async function POST(request: NextRequest) {
 try {
 const authError = await requireAdmin(request);
 if (authError) return authError;

 const body = await request.json().catch(() => null);
 if (!body || typeof body.title !== 'string' || typeof body.message !== 'string') {
 return NextResponse.json(
 { success: false, error: 'title and message required' },
 { status: 400 }
 );
 }

 const type: BellType =
 body.type === 'success' ||
 body.type === 'warning' ||
 body.type === 'error' ||
 body.type === 'info'
 ? body.type
 : 'info';

 const store = await readStore();
 const id = `stored:${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
 const createdAt = new Date().toISOString();

 const item: StoredBellItem = {
 id,
 type,
 title: body.title,
 message: body.message,
 createdAt,
 read: false,
 };
 if (body.action?.href && body.action?.label) {
 item.action = { href: String(body.action.href), label: String(body.action.label) };
 }

 store.items.unshift(item);
 await saveStore(store);

 const dto: BellNotificationDTO = {
 id: item.id,
 type: item.type,
 title: item.title,
 message: item.message,
 timestamp: item.createdAt,
 read: false,
 action: item.action,
 source: 'stored',
 };

 return NextResponse.json({ success: true, data: dto }, { status: 201 });
 } catch (e) {
 console.error('POST /api/admin/bell-notifications', e);
 return NextResponse.json(
 { success: false, error: 'Failed to create notification' },
 { status: 500 }
 );
 }
}
