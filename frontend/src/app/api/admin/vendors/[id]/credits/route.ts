import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

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

function getToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get('token')?.value || null;
}

function requireAdmin(request: NextRequest): { adminId?: string } | null {
  const token = getToken(request);
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as {
      userId?: string | number;
      role?: string;
    };
    const role = String(payload.role || '').toUpperCase();
    if (role !== 'ADMIN') return null;
    return { adminId: payload.userId ? String(payload.userId) : undefined };
  } catch {
    return null;
  }
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
    const admin = requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const amount = Number(body.amount || 0);
    const reason = String(body.reason || 'Admin credit top-up');
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than zero' },
        { status: 400 },
      );
    }

    const vendors = await readVendors();
    const vendorIndex = vendors.findIndex((v) => String(v.id) === String(params.id));
    if (vendorIndex === -1) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }
    const vendor = vendors[vendorIndex];
    const vendorId = String(vendor.id);
    const email = String(vendor.email || '').toLowerCase();

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
        currentCredits: 0,
        totalPurchased: 0,
        totalUsed: 0,
        lastTopUp: now,
        updatedAt: now,
      });
      walletIndex = wallets.length - 1;
    }

    wallets[walletIndex] = {
      ...wallets[walletIndex],
      vendorId,
      email,
      currentCredits: Number(wallets[walletIndex].currentCredits || 0) + amount,
      totalPurchased: Number(wallets[walletIndex].totalPurchased || 0) + amount,
      lastTopUp: now,
      updatedAt: now,
    };

    vendors[vendorIndex] = {
      ...vendor,
      credits: wallets[walletIndex].currentCredits,
    };

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
      referenceId: `admin:${admin.adminId || 'unknown'}`,
      source: 'admin_api',
    });

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
      message: 'Credits added successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/vendors/[id]/credits:', error);
    return NextResponse.json({ success: false, error: 'Failed to add credits' }, { status: 500 });
  }
}
