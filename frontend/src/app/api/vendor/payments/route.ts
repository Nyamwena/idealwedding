import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';

export const dynamic = 'force-dynamic';

function mapUiStatus(raw: string): 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' {
  const u = String(raw || '').toLowerCase();
  if (u === 'completed' || u === 'paid') return 'completed';
  if (u === 'failed') return 'failed';
  if (u === 'refunded' || u === 'refund') return 'refunded';
  if (u === 'processing') return 'processing';
  return 'pending';
}

function mapPaymentMethod(
  raw: string,
): 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe' {
  const u = String(raw || '').toLowerCase().replace(/\s/g, '_');
  if (u === 'bank_transfer' || u === 'banktransfer') return 'bank_transfer';
  if (u === 'paypal') return 'paypal';
  if (u === 'stripe') return 'stripe';
  return 'credit_card';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const all = await readDataFile<any[]>('payments.json', []);
    const scoped = all.filter(
      (p) =>
        String(p.vendorUserId || '') === session.userId ||
        String(p.vendorId || '') === session.vendorId,
    );

    const data = scoped.map((p) => {
      const amount = Number(p.amount || 0);
      const commission = Number(p.commission ?? p.platformFee ?? 0);
      const vendorAmount = Number(
        p.vendorAmount ?? (amount > 0 && commission >= 0 ? amount - commission : amount),
      );
      const status = mapUiStatus(p.status);
      const createdAt = String(p.createdAt || p.updatedAt || new Date().toISOString());
      return {
        id: String(p.id),
        bookingId: String(p.bookingId || ''),
        customerName: String(p.customerName || p.customerId || 'Customer'),
        serviceName: String(p.description || p.serviceName || 'Payment'),
        amount,
        platformFee: commission,
        netAmount: vendorAmount,
        status,
        paymentMethod: mapPaymentMethod(p.paymentMethod || 'credit_card'),
        transactionId: String(p.transactionId || p.id),
        paymentDate: String(p.paymentDate || (status === 'completed' ? createdAt.slice(0, 10) : '')),
        dueDate: String(p.dueDate || createdAt.slice(0, 10)),
        description: String(p.description || ''),
        createdAt,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('GET /api/vendor/payments:', e);
    return NextResponse.json({ success: false, error: 'Failed to load payments' }, { status: 500 });
  }
}
