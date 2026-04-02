// COPY TO: frontend/src/app/api/admin/vendors/[id]/credits/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { verifyToken } from '@/lib/auth';
import { newVendorWalletBalanceFields } from '@/lib/vendorWalletStarter';

type CreditWallet = {
    key: string;
    vendorId?: string;
    vendorUserId?: string;
    email?: string;
    currentCredits: number;
    totalPurchased: number;
    totalUsed: number;
    lastTopUp: string;
    updatedAt: string;
};

type CreditTransaction = {
    id: string;
    key: string;
    vendorId?: string;
    vendorUserId?: string;
    email?: string;
    type: 'purchase' | 'usage' | 'refund' | 'admin_add';
    amount: number;
    description: string;
    timestamp: string;
    referenceId?: string;
    source?: string;
};

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

async function readVendors() {
    return readDataFile<any[]>('vendors.json', []);
}

async function writeVendors(vendors: any[]) {
    await writeDataFile('vendors.json', vendors);
}

async function readWallets() {
    return readDataFile<CreditWallet[]>('vendor-credit-wallets.json', []);
}

async function writeWallets(wallets: CreditWallet[]) {
    await writeDataFile('vendor-credit-wallets.json', wallets);
}

async function readTransactions() {
    return readDataFile<CreditTransaction[]>('vendor-credit-transactions.json', []);
}

async function writeTransactions(transactions: CreditTransaction[]) {
    await writeDataFile('vendor-credit-transactions.json', transactions);
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        // 1. Check admin auth
        const authError = await requireAdmin(request);
        if (authError) return authError;

        // 2. Get the actual admin user for logging
        const token = getAuthToken(request);
        const adminUser = token ? await verifyToken(token) : null;

        // 3. Parse and validate body
        const body = await request.json();
        const amount = Number(body.amount || 0);
        const reason = String(body.reason || 'Admin credit top-up');

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Amount must be greater than zero' },
                { status: 400 },
            );
        }

        // 4. Find the vendor
        const vendors = await readVendors();
        const vendorIndex = vendors.findIndex((v) => String(v.id) === String(params.id));

        if (vendorIndex === -1) {
            return NextResponse.json(
                { success: false, error: 'Vendor not found' },
                { status: 404 },
            );
        }

        const vendor = vendors[vendorIndex];
        const vendorId = String(vendor.id);
        const email = String(vendor.email || '').toLowerCase();

        // 5. Find or create wallet
        const wallets = await readWallets();
        let walletIndex = wallets.findIndex(
            (w) =>
                String(w.vendorId || '') === vendorId ||
                String(w.email || '').toLowerCase() === email,
        );

        const now = new Date().toISOString();

        if (walletIndex < 0) {
            wallets.push({
                key: vendorId,
                vendorId,
                email,
                ...newVendorWalletBalanceFields(),
            });
            walletIndex = wallets.length - 1;
        }

        // 6. Update wallet
        wallets[walletIndex] = {
            ...wallets[walletIndex],
            vendorId,
            email,
            currentCredits: Number(wallets[walletIndex].currentCredits || 0) + amount,
            totalPurchased: Number(wallets[walletIndex].totalPurchased || 0) + amount,
            lastTopUp: now,
            updatedAt: now,
        };

        // 7. Sync credits back to vendor record
        vendors[vendorIndex] = {
            ...vendor,
            credits: wallets[walletIndex].currentCredits,
        };

        // 8. Record transaction with actual admin ID
        const transactions = await readTransactions();
        transactions.push({
            id: `tx_${Date.now()}`,
            key: wallets[walletIndex].key,
            vendorId: wallets[walletIndex].vendorId,
            vendorUserId: wallets[walletIndex].vendorUserId,
            email: wallets[walletIndex].email,
            type: 'admin_add',
            amount,
            description: reason,
            timestamp: now,
            referenceId: `admin:${adminUser?.id || 'unknown'}`,
            source: 'admin_api',
        });

        // 9. Save everything
        await Promise.all([
            writeWallets(wallets),
            writeTransactions(transactions),
            writeVendors(vendors),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                vendor: vendors[vendorIndex],
                wallet: wallets[walletIndex],
            },
            message: `${amount} credits added successfully to ${vendor.name}`,
        });
    } catch (error) {
        console.error('Error in POST /api/admin/vendors/[id]/credits:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add credits' },
            { status: 500 },
        );
    }
}