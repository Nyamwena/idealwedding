// COPY TO: frontend/src/app/api/admin/vendors/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { verifyToken } from '@/lib/auth';

const getVendors = () => readDataFile<any[]>('vendors.json', []);
const getCreditWallets = () => readDataFile<any[]>('vendor-credit-wallets.json', []);
const saveVendors = (vendors: any[]) => writeDataFile('vendors.json', vendors);
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://api-auth.idealweddings.space';
const DEFAULT_VENDOR_PASSWORD = 'vendorpassword';

function getAuthToken(request: NextRequest): string | null {
    const header = request.headers.get('authorization');
    if (header?.startsWith('Bearer ')) return header.slice(7);
    return request.cookies.get('accessToken')?.value || null; // ✅ accessToken not token
}

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
    const token = getAuthToken(request);
    if (!token) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token); // ✅ local JWT decode, no network call
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role.toUpperCase() !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return null;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
    const clean = fullName.trim();
    if (!clean) return { firstName: 'Vendor', lastName: 'User' };
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return { firstName: parts[0], lastName: 'Vendor' };
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
    };
}

async function ensureVendorAuthAccount(name: string, email: string): Promise<void> {
    const { firstName, lastName } = splitName(name);
    const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password: DEFAULT_VENDOR_PASSWORD,
            firstName,
            lastName,
            role: 'vendor',
        }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.success) {
        const msg = String(json?.message || '').toLowerCase();
        // If auth user already exists, we treat that as non-fatal so vendor profiles can be linked.
        if (response.status === 409 || msg.includes('exist')) return;
        throw new Error(json?.message || 'Failed to create vendor auth account');
    }
}

// GET /api/admin/vendors
export async function GET(request: NextRequest) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const [vendors, wallets] = await Promise.all([getVendors(), getCreditWallets()]);

        const merged = vendors.map((vendor: any) => {
            const wallet = wallets.find(
                (w: any) =>
                    String(w.vendorId || '') === String(vendor.id || '') ||
                    String(w.email || '').toLowerCase() === String(vendor.email || '').toLowerCase()
            );
            if (!wallet) return vendor;
            return {
                ...vendor,
                credits: Number(wallet.currentCredits || vendor.credits || 0),
            };
        });

        return NextResponse.json({ success: true, data: merged });
    } catch (error) {
        console.error('Error in GET /api/admin/vendors:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch vendors' }, { status: 500 });
    }
}

// POST /api/admin/vendors
export async function POST(request: NextRequest) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const body = await request.json();
        const { name, email, category, location, phone, website, description } = body;

        if (!name || !email || !category || !location) {
            return NextResponse.json(
                { success: false, error: 'Name, email, category, and location are required' },
                { status: 400 }
            );
        }

        const vendors = await getVendors();

        const existingVendor = vendors.find((v: any) => v.email === email);
        if (existingVendor) {
            return NextResponse.json(
                { success: false, error: 'A vendor with this email already exists' },
                { status: 409 }
            );
        }

        // Create (or confirm existing) auth account for this vendor first.
        await ensureVendorAuthAccount(name, email);

        const newVendor = {
            id: (vendors.length + 1).toString(),
            name, email, category,
            status: 'pending',
            location,
            rating: 0,
            joinedDate: new Date().toISOString().split('T')[0],
            lastActive: 'Never',
            credits: 0,
            leadsGenerated: 0,
            quotesSent: 0,
            bookingsCompleted: 0,
            revenue: 0,
            performance: 'average' as const,
            subscription: 'basic' as const,
            phone: phone || '',
            website: website || '',
            description: description || '',
        };

        vendors.push(newVendor);
        await saveVendors(vendors);

        return NextResponse.json({
            success: true,
            data: newVendor,
            message: `Vendor created successfully. Default password: ${DEFAULT_VENDOR_PASSWORD}`,
        });
    } catch (error) {
        console.error('Error in POST /api/admin/vendors:', error);
        return NextResponse.json({ success: false, error: 'Failed to create vendor' }, { status: 500 });
    }
}