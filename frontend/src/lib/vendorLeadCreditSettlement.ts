import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import type { VendorSession } from '@/lib/vendorSession';
import { leadBelongsToVendor } from '@/lib/vendorLeadScope';
import { newVendorWalletBalanceFields } from '@/lib/vendorWalletStarter';

/**
 * For leads already tied to this vendor but never charged (no `creditsSettled`),
 * deduct credits once from the vendor wallet and write a transaction.
 * POST /api/vendor/leads already charges at creation — this covers legacy/imported rows.
 */
export async function settleOutstandingLeadCredits(
  session: VendorSession,
  catalogVendor?: { id: string } | null,
): Promise<void> {
  const data = await readDataFile<any[]>('vendor-leads.json', []);
  let anyLeadChanged = false;

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
  const transactions = await readDataFile<any[]>('vendor-credit-transactions.json', []);
  let newTransactions: any[] = [];

  const nextLeads = data.map((lead) => {
    if (!leadBelongsToVendor(lead, session, catalogVendor)) return lead;
    if (lead.creditsSettled === true) return lead;

    const cost =
      typeof lead.creditsUsed === 'number' && lead.creditsUsed > 0 ? lead.creditsUsed : 5;
    const balance = Number(wallet.currentCredits || 0);
    if (balance < cost) {
      return lead;
    }

    wallet.currentCredits = balance - cost;
    wallet.totalUsed = Number(wallet.totalUsed || 0) + cost;
    wallet.updatedAt = new Date().toISOString();

    newTransactions.push({
      id: `tx_settle_${lead.id}_${Date.now()}`,
      key: wallet.key || session.vendorId,
      vendorId: session.vendorId,
      vendorUserId: session.userId,
      type: 'usage',
      amount: -cost,
      description: `Lead delivery — ${lead.coupleName || 'Lead'} (${lead.serviceCategory || 'inquiry'})`,
      timestamp: new Date().toISOString(),
      referenceId: lead.id,
      source: 'lead_settle',
    });

    anyLeadChanged = true;
    return {
      ...lead,
      creditsSettled: true,
      vendorUserId: lead.vendorUserId || session.userId,
      vendorId: lead.vendorId || session.vendorId,
      creditsUsed: cost,
    };
  });

  if (!anyLeadChanged && newTransactions.length === 0) {
    return;
  }

  wallets[walletIndex] = wallet;
  const allTx = [...transactions, ...newTransactions];

  await Promise.all([
    writeDataFile('vendor-leads.json', nextLeads),
    writeDataFile('vendor-credit-wallets.json', wallets),
    writeDataFile('vendor-credit-transactions.json', allTx),
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
}
