import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import type { VendorSession } from '@/lib/vendorSession';
import { newVendorWalletBalanceFields } from '@/lib/vendorWalletStarter';

const DEFAULT_CREDIT_COST = 5;

export function getVendorQuoteCreditCost(): number {
  const raw =
    process.env.VENDOR_QUOTE_CREDIT_COST ??
    process.env.VENDOR_LEAD_CREDIT_COST;
  if (raw === undefined || raw === '') return DEFAULT_CREDIT_COST;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CREDIT_COST;
}

/** Lead delivery already charged — do not bill again when sending a quote. */
export function leadAlreadyChargedForContact(lead: unknown): boolean {
  if (!lead || typeof lead !== 'object') return false;
  const row = lead as { creditsSettled?: boolean; creditsUsed?: number };
  return row.creditsSettled === true && Number(row.creditsUsed || 0) > 0;
}

export type VendorCreditDeductionResult =
  | { ok: true; creditsUsed: number; currentCredits: number }
  | { ok: false; error: string };

/** Deduct credits from the vendor wallet and record a usage transaction. */
export async function deductVendorCredits(
  session: VendorSession,
  opts: {
    amount: number;
    description: string;
    referenceId: string;
    source: string;
  },
): Promise<VendorCreditDeductionResult> {
  const amount = Number(opts.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Invalid credit amount' };
  }

  const wallets = await readDataFile<any[]>('vendor-credit-wallets.json', []);
  let walletIndex = wallets.findIndex(
    (w: any) =>
      String(w.vendorUserId || '') === session.userId ||
      String(w.vendorId || '') === session.vendorId,
  );
  if (walletIndex < 0) {
    wallets.push({
      key: session.vendorId,
      vendorId: session.vendorId,
      vendorUserId: session.userId,
      ...newVendorWalletBalanceFields(),
    });
    walletIndex = wallets.length - 1;
  }

  const wallet = { ...wallets[walletIndex] };
  const balance = Number(wallet.currentCredits || 0);
  if (balance < amount) {
    return {
      ok: false,
      error: `Insufficient credits. You need at least ${amount} credits to send this quote.`,
    };
  }

  const now = new Date().toISOString();
  wallet.currentCredits = balance - amount;
  wallet.totalUsed = Number(wallet.totalUsed || 0) + amount;
  wallet.updatedAt = now;
  wallets[walletIndex] = wallet;

  const transactions = await readDataFile<any[]>('vendor-credit-transactions.json', []);
  transactions.push({
    id: `tx_${opts.source}_${opts.referenceId}_${Date.now()}`,
    key: wallet.key || session.vendorId,
    vendorId: session.vendorId,
    vendorUserId: session.userId,
    type: 'usage',
    amount: -amount,
    description: opts.description,
    timestamp: now,
    referenceId: opts.referenceId,
    source: opts.source,
  });

  await Promise.all([
    writeDataFile('vendor-credit-wallets.json', wallets),
    writeDataFile('vendor-credit-transactions.json', transactions),
  ]);

  const vendors = await readDataFile<any[]>('vendors.json', []);
  let vendorChanged = false;
  for (let i = 0; i < vendors.length; i += 1) {
    if (
      String(vendors[i].id || '') === session.vendorId ||
      String(vendors[i].email || '').toLowerCase() === session.email.toLowerCase()
    ) {
      vendors[i] = { ...vendors[i], credits: wallet.currentCredits };
      vendorChanged = true;
    }
  }
  if (vendorChanged) {
    await writeDataFile('vendors.json', vendors);
  }

  return { ok: true, creditsUsed: amount, currentCredits: wallet.currentCredits };
}

export async function settleQuoteCredits(
  session: VendorSession,
  quote: Record<string, unknown>,
  lead: unknown | null,
): Promise<VendorCreditDeductionResult | { ok: true; creditsUsed: 0; currentCredits?: number }> {
  if (quote.creditsSettled === true) {
    return { ok: true, creditsUsed: 0 };
  }

  if (lead && leadAlreadyChargedForContact(lead)) {
    return { ok: true, creditsUsed: 0 };
  }

  const cost = getVendorQuoteCreditCost();
  const name =
    String(quote.coupleName || quote.customerName || 'Couple');
  const service = String(
    quote.serviceType || quote.serviceCategory || 'Wedding Service',
  );
  const quoteId = String(quote.id || '');

  const result = await deductVendorCredits(session, {
    amount: cost,
    description: `Quote sent — ${name} (${service})`,
    referenceId: quoteId,
    source: 'quote_send',
  });

  return result;
}
