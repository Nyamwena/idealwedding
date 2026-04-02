import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
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

async function readVendors() {
  return readDataFile<any[]>('vendors.json', []);
}

async function writeVendors(vendors: any[]) {
  await writeDataFile('vendors.json', vendors);
}

function findWalletIndex(
  wallets: CreditWallet[],
  identity: { userId: string; email: string; vendorId: string },
) {
  return wallets.findIndex(
    (w) =>
      String(w.vendorUserId || '') === identity.userId ||
      String(w.vendorId || '') === identity.vendorId ||
      String(w.email || '').toLowerCase() === identity.email,
  );
}

function ensureWallet(
  wallets: CreditWallet[],
  identity: { userId: string; email: string; vendorId: string },
) {
  const idx = findWalletIndex(wallets, identity);
  if (idx >= 0) {
    wallets[idx] = {
      ...wallets[idx],
      vendorUserId: identity.userId,
      vendorId: identity.vendorId,
      email: identity.email,
    };
    return { wallet: wallets[idx], index: idx };
  }

  const wallet: CreditWallet = {
    key: identity.vendorId,
    vendorId: identity.vendorId,
    vendorUserId: identity.userId,
    email: identity.email,
    ...newVendorWalletBalanceFields(),
  };
  wallets.push(wallet);
  return { wallet, index: wallets.length - 1 };
}

async function syncVendorCredits(identity: { email: string; vendorId: string }, credits: number) {
  const vendors = await readVendors();
  let changed = false;
  for (let i = 0; i < vendors.length; i += 1) {
    const vendor = vendors[i];
    if (
      String(vendor.id || '') === identity.vendorId ||
      String(vendor.email || '').toLowerCase() === identity.email
    ) {
      vendors[i] = {
        ...vendor,
        credits,
      };
      changed = true;
    }
  }
  if (changed) {
    await writeVendors(vendors);
  }
}

export async function GET(request: NextRequest) {
  try {
    const identity = await getVendorSession(request);
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const wallets = await readWallets();
    const { wallet } = ensureWallet(wallets, identity);
    await writeWallets(wallets);
    await syncVendorCredits(identity, wallet.currentCredits);

    const transactions = await readTransactions();
    const scopedTransactions = transactions
      .filter(
        (tx) =>
          String(tx.vendorUserId || '') === identity.userId ||
          String(tx.vendorId || '') === identity.vendorId ||
          String(tx.email || '').toLowerCase() === identity.email,
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: {
        currentCredits: wallet.currentCredits,
        totalPurchased: wallet.totalPurchased,
        totalUsed: wallet.totalUsed,
        lastTopUp: wallet.lastTopUp,
        isLowBalance: wallet.currentCredits < 50,
      },
      transactions: scopedTransactions,
    });
  } catch (error) {
    console.error('Error in GET /api/vendor/credits:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch credits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await getVendorSession(request);
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const body = await request.json();
    const action = String(body.action || '').toLowerCase();
    const amount = Number(body.amount || 0);
    const description = String(body.description || 'Credit update');
    const referenceId = body.referenceId ? String(body.referenceId) : undefined;

    if (!['purchase', 'deduct', 'refund'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid credit action' }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be greater than zero' }, { status: 400 });
    }

    const wallets = await readWallets();
    const { wallet, index } = ensureWallet(wallets, identity);
    const now = new Date().toISOString();

    if (action === 'deduct' && wallet.currentCredits < amount) {
      return NextResponse.json({ success: false, error: 'Insufficient credits' }, { status: 400 });
    }

    if (action === 'purchase' || action === 'refund') {
      wallet.currentCredits += amount;
      wallet.totalPurchased += amount;
      wallet.lastTopUp = now;
    } else {
      wallet.currentCredits -= amount;
      wallet.totalUsed += amount;
    }
    wallet.updatedAt = now;
    wallets[index] = wallet;

    const transactions = await readTransactions();
    const txType: CreditTransaction['type'] =
      action === 'deduct' ? 'usage' : action === 'refund' ? 'refund' : 'purchase';
    const txAmount = txType === 'usage' ? -amount : amount;
    transactions.push({
      id: `tx_${Date.now()}`,
      key: wallet.key,
      vendorId: wallet.vendorId,
      vendorUserId: wallet.vendorUserId,
      email: wallet.email,
      type: txType,
      amount: txAmount,
      description,
      timestamp: now,
      referenceId,
      source: 'vendor_api',
    });

    await Promise.all([writeWallets(wallets), writeTransactions(transactions)]);
    await syncVendorCredits(identity, wallet.currentCredits);

    return NextResponse.json({
      success: true,
      data: {
        currentCredits: wallet.currentCredits,
        totalPurchased: wallet.totalPurchased,
        totalUsed: wallet.totalUsed,
        lastTopUp: wallet.lastTopUp,
        isLowBalance: wallet.currentCredits < 50,
      },
      message: 'Credits updated successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/vendor/credits:', error);
    return NextResponse.json({ success: false, error: 'Failed to update credits' }, { status: 500 });
  }
}
