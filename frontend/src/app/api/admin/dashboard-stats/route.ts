import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { readDataFile } from '@/lib/dataFileStore';

function getAuthToken(request: NextRequest): string | null {
    const header = request.headers.get('authorization');
    if (header?.startsWith('Bearer ')) return header.slice(7);
    return request.cookies.get('accessToken')?.value || null;
}

async function requireAdmin(
    request: NextRequest
): Promise<NextResponse | null> {
    const token = getAuthToken(request);
    if (!token) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const user = await verifyToken(token);
    if (!user) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    if (user.role.toUpperCase() !== 'ADMIN') {
        return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
        );
    }

    return null;
}

function isActiveVendorStatus(status: unknown): boolean {
    const s = String(status ?? 'approved').toLowerCase();
    return !['suspended', 'rejected', 'banned', 'inactive'].includes(s);
}

function normalizePayments(raw: unknown): any[] {
    if (Array.isArray(raw)) return raw;
    return [];
}

/** Last N calendar months as YYYY-MM, oldest first */
function lastNMonthKeys(n: number): string[] {
    const keys: string[] = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
        keys.push(
            `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
        );
    }
    return keys;
}

function formatMonthLabel(yyyyMm: string): string {
    const [y, m] = yyyyMm.split('-').map(Number);
    if (!y || !m) return yyyyMm;
    const dt = new Date(y, m - 1, 1);
    return dt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function paymentMonthKey(p: Record<string, unknown>): string | null {
    const raw = p?.createdAt ?? p?.transactionDate ?? p?.updatedAt;
    if (raw == null || typeof raw !== 'string') return null;
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return null;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function buildRevenueTrend(payments: any[]): { label: string; total: number }[] {
    const monthKeys = lastNMonthKeys(12);
    const sums = new Map<string, number>();
    for (const p of payments) {
        const st = String(p?.status ?? '').toLowerCase();
        if (st !== 'completed') continue;
        const amt = Number(p?.amount ?? 0);
        if (!Number.isFinite(amt)) continue;
        const k = paymentMonthKey(p);
        if (!k) continue;
        sums.set(k, (sums.get(k) ?? 0) + amt);
    }
    return monthKeys.map((key) => ({
        label: formatMonthLabel(key),
        total: sums.get(key) ?? 0,
    }));
}

function normalizeVendorsList(raw: unknown): any[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).vendors)) {
        return (raw as { vendors: any[] }).vendors;
    }
    return [];
}

function normalizeQuotesList(raw: unknown): any[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).quotes)) {
        return (raw as { quotes: any[] }).quotes;
    }
    return [];
}

function normalizeBookingsList(raw: unknown): any[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).bookings)) {
        return (raw as { bookings: any[] }).bookings;
    }
    return [];
}

function normalizeAuditLogsList(raw: unknown): any[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).auditLogs)) {
        return (raw as { auditLogs: any[] }).auditLogs;
    }
    return [];
}

function parseActivityTime(raw: unknown): number {
    if (raw == null) return 0;
    const d = new Date(String(raw));
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatRelativeActivity(ts: number): string {
    if (!ts) return '—';
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

function formatActivityMoney(n: number): string {
    return n.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    });
}

function avatarLetterFrom(text: string): string {
    const c = text.trim()[0];
    return c && /[\w]/.test(c) ? c.toUpperCase() : '•';
}

function buildRecentActivity(
    auditLogs: any[],
    payments: any[],
    bookings: any[],
    quotes: any[]
): { id: string; message: string; timestamp: string; avatarLetter: string }[] {
    type Row = {
        id: string;
        sortAt: number;
        message: string;
        avatarLetter: string;
    };
    const rows: Row[] = [];

    for (const log of auditLogs) {
        const rawId = log?.id != null ? String(log.id) : '';
        const t = parseActivityTime(log.timestamp);
        const stamp = log?.timestamp != null ? String(log.timestamp) : String(t);
        const finalId = rawId || stamp;
        if (!finalId) continue;
        const user = String(log.user || 'Admin');
        const action = String(log.action || 'EVENT');
        const resource = String(log.resource || '').trim();
        const details = log.details ? String(log.details).slice(0, 100) : '';
        rows.push({
            id: `audit:${finalId}`,
            sortAt: t,
            avatarLetter: avatarLetterFrom(user),
            message: `${user}: ${action}${resource ? ` · ${resource}` : ''}${details ? ` — ${details}` : ''}`,
        });
    }

    for (const p of payments) {
        const rawId = p?.id != null ? String(p.id) : '';
        const fallbackStamp = p?.createdAt ?? p?.updatedAt ?? p?.transactionDate ?? '';
        const stamp = fallbackStamp != null ? String(fallbackStamp) : '';
        const finalId = rawId || stamp;
        if (!finalId) continue;
        const t = parseActivityTime(p.createdAt ?? p.updatedAt ?? p.transactionDate);
        const name = String(p.customerName || 'Customer');
        const amt = Number(p.amount ?? 0);
        const st = String(p.status ?? '').toLowerCase();
        rows.push({
            id: `pay:${finalId}`,
            sortAt: t,
            avatarLetter: avatarLetterFrom(name),
            message:
                st === 'completed'
                    ? `Payment completed (${formatActivityMoney(amt)}) — ${name}`
                    : `Payment ${st} (${formatActivityMoney(amt)}) — ${name}`,
        });
    }

    for (const b of bookings) {
        const rawId = b?.id != null ? String(b.id) : '';
        const fallbackStamp = b?.createdAt ?? b?.updatedAt ?? '';
        const stamp = fallbackStamp != null ? String(fallbackStamp) : '';
        const finalId = rawId || stamp;
        if (!finalId) continue;
        const t = parseActivityTime(b.createdAt ?? b.updatedAt);
        const name = String(b.customerName || 'Customer');
        const svc = String(b.serviceName || b.serviceCategory || 'Booking');
        const st = String(b.status || 'pending');
        rows.push({
            id: `book:${finalId}`,
            sortAt: t,
            avatarLetter: avatarLetterFrom(name),
            message: `Booking ${st}: ${svc} · ${name}`,
        });
    }

    for (const q of quotes) {
        const rawId = q?.id != null ? String(q.id) : '';
        const fallbackStamp = q?.requestDate ?? q?.createdAt ?? q?.updatedAt ?? '';
        const stamp = fallbackStamp != null ? String(fallbackStamp) : '';
        const finalId = rawId || stamp;
        if (!finalId) continue;
        const t = parseActivityTime(q.requestDate ?? q.createdAt ?? q.updatedAt);
        const name = String(q.customerName || 'Customer');
        const vendor = String(q.vendorName || q.vendor || '').trim();
        rows.push({
            id: `quote:${finalId}`,
            sortAt: t,
            avatarLetter: avatarLetterFrom(name),
            message: vendor
                ? `Quote request from ${name} → ${vendor}`
                : `Quote request from ${name}`,
        });
    }

    rows.sort((a, b) => b.sortAt - a.sortAt);
    const seen = new Set<string>();
    const out: { id: string; message: string; timestamp: string; avatarLetter: string }[] = [];
    for (const r of rows) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push({
            id: r.id,
            message: r.message,
            timestamp: formatRelativeActivity(r.sortAt),
            avatarLetter: r.avatarLetter,
        });
        if (out.length >= 8) break;
    }
    return out;
}

export async function GET(request: NextRequest) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        let totalUsers = 0;
        try {
            totalUsers = await prisma.user.count();
        } catch (e) {
            console.error('dashboard-stats: user count failed', e);
        }

        const vendorsRaw = await readDataFile<any>('vendors.json', []);
        const vendors = normalizeVendorsList(vendorsRaw);
        const activeVendors = vendors.filter((v) =>
            isActiveVendorStatus(v?.status)
        ).length;

        const quotesRaw = await readDataFile<any>('quotes.json', []);
        const quotes = normalizeQuotesList(quotesRaw);
        const totalQuotes = quotes.length;

        const paymentsRaw = await readDataFile<any>('payments.json', []);
        const payments = normalizePayments(paymentsRaw);
        let revenueTotal = 0;
        revenueTotal = payments.reduce((sum, p) => {
            const st = String(p?.status ?? '').toLowerCase();
            if (st !== 'completed') return sum;
            const amt = Number(p?.amount ?? 0);
            return sum + (Number.isFinite(amt) ? amt : 0);
        }, 0);
        const revenueTrend = buildRevenueTrend(payments);

        const auditRaw = await readDataFile<any>('audit-logs.json', []);
        const auditLogs = normalizeAuditLogsList(auditRaw);
        const bookingsRaw = await readDataFile<any>('bookings.json', []);
        const bookings = normalizeBookingsList(bookingsRaw);
        const recentActivity = buildRecentActivity(
            auditLogs,
            payments,
            bookings,
            quotes
        );

        return NextResponse.json({
            success: true,
            data: {
                totalUsers,
                activeVendors,
                totalQuotes,
                revenueTotal,
                revenueTrend,
                recentActivity,
            },
        });
    } catch (error) {
        console.error('GET /api/admin/dashboard-stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load dashboard stats' },
            { status: 500 }
        );
    }
}
