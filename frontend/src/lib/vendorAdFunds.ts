import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import type { VendorSession } from '@/lib/vendorSession';

const FILE = 'vendor-ad-funds.json';

export type AdFundsWalletRow = {
  vendorUserId?: string;
  vendorId?: string;
  email?: string;
  /** Approved, spendable balance (clicks deduct here only). */
  balance: number;
  /** Top-ups awaiting admin approval (not spendable until moved to balance). */
  pendingBalance?: number;
  totalAdded: number;
  totalSpent: number;
  updatedAt: string;
};

export function dayKey(input: string | Date): string {
  const d = new Date(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function readAdFundsWallets(): Promise<AdFundsWalletRow[]> {
  return readDataFile<AdFundsWalletRow[]>(FILE, []);
}

export async function writeAdFundsWallets(rows: AdFundsWalletRow[]) {
  await writeDataFile(FILE, rows);
}

export function findAdFundsWalletIndexForAd(rows: AdFundsWalletRow[], ad: any): number {
  return rows.findIndex(
    (w) =>
      (String(ad.vendorUserId || '') && String(w.vendorUserId || '') === String(ad.vendorUserId)) ||
      (String(ad.vendorId || '') && String(w.vendorId || '') === String(ad.vendorId)) ||
      (String(ad.advertiserEmail || '') &&
        String(w.email || '').toLowerCase() === String(ad.advertiserEmail || '').toLowerCase()),
  );
}

export function findAdFundsWalletIndexForSession(rows: AdFundsWalletRow[], session: VendorSession): number {
  return rows.findIndex(
    (w) =>
      String(w.vendorUserId || '') === session.userId ||
      String(w.vendorId || '') === session.vendorId ||
      String(w.email || '').toLowerCase() === session.email.toLowerCase(),
  );
}

export function getAdFundsBalanceForAd(rows: AdFundsWalletRow[], ad: any): number {
  const i = findAdFundsWalletIndexForAd(rows, ad);
  if (i < 0) return 0;
  return Number(rows[i].balance || 0);
}

export function getPendingAdFundsForAd(rows: AdFundsWalletRow[], ad: any): number {
  const i = findAdFundsWalletIndexForAd(rows, ad);
  if (i < 0) return 0;
  return Number(rows[i].pendingBalance || 0);
}

/** Create or locate wallet row for an ad / advertiser (mutates rows). Returns -1 if no stable id on ad. */
export function ensureAdFundsWalletForAdvertiser(rows: AdFundsWalletRow[], ad: any): number {
  const idx = findAdFundsWalletIndexForAd(rows, ad);
  if (idx >= 0) return idx;
  const hasLink =
    String(ad.vendorUserId || '').trim() ||
    String(ad.vendorId || '').trim() ||
    String(ad.advertiserEmail || '').trim();
  if (!hasLink) return -1;
  const now = new Date().toISOString();
  rows.push({
    vendorUserId: ad.vendorUserId ? String(ad.vendorUserId) : undefined,
    vendorId: ad.vendorId ? String(ad.vendorId) : undefined,
    email: ad.advertiserEmail ? String(ad.advertiserEmail).toLowerCase() : undefined,
    balance: 0,
    pendingBalance: 0,
    totalAdded: 0,
    totalSpent: 0,
    updatedAt: now,
  });
  return rows.length - 1;
}

/** Credit approved (spendable) balance — e.g. admin grants funds. */
export function addApprovedAdFundsAtIndex(rows: AdFundsWalletRow[], index: number, amount: number): void {
  if (index < 0 || index >= rows.length) return;
  if (!Number.isFinite(amount) || amount <= 0) return;
  const now = new Date().toISOString();
  rows[index] = {
    ...rows[index],
    balance: Number(rows[index].balance || 0) + amount,
    totalAdded: Number(rows[index].totalAdded || 0) + amount,
    updatedAt: now,
  };
}

/** Move all pending balance into approved balance. Returns amount moved (0 if none). */
export function approvePendingAdFundsAtIndex(rows: AdFundsWalletRow[], index: number): number {
  if (index < 0 || index >= rows.length) return 0;
  const pending = Number(rows[index].pendingBalance || 0);
  if (!Number.isFinite(pending) || pending <= 0) return 0;
  const now = new Date().toISOString();
  rows[index] = {
    ...rows[index],
    balance: Number(rows[index].balance || 0) + pending,
    pendingBalance: 0,
    totalAdded: Number(rows[index].totalAdded || 0) + pending,
    updatedAt: now,
  };
  return pending;
}

/** Ad may serve in sponsored placements: admin-approved, funded for at least one click, daily cap OK. */
export function canServeSponsoredAd(
  ad: any,
  adFundsBalance: number,
  clickEvents: any[],
  today: string,
): boolean {
  if (String(ad.status || '').toLowerCase() !== 'active') return false;
  const bid = Number(ad.bidPerClick || ad.cost || 0);
  if (bid <= 0) return false;
  if (adFundsBalance < bid) return false;
  const maxDaily = Number(ad.maxDailyBudget || 0);
  if (maxDaily > 0) {
    const dailySpent = clickEvents
      .filter(
        (ev: any) =>
          ev.adId === ad.id &&
          ev.blocked !== true &&
          dayKey(ev.timestamp) === today,
      )
      .reduce((s, ev: any) => s + Number(ev.charge || 0), 0);
    if (dailySpent + bid > maxDaily) return false;
  }
  return true;
}

export async function ensureAdFundsWallet(session: VendorSession): Promise<{
  rows: AdFundsWalletRow[];
  index: number;
}> {
  const rows = await readAdFundsWallets();
  let idx = findAdFundsWalletIndexForSession(rows, session);
  const now = new Date().toISOString();
  if (idx < 0) {
    rows.push({
      vendorUserId: session.userId,
      vendorId: session.vendorId,
      email: session.email,
      balance: 0,
      pendingBalance: 0,
      totalAdded: 0,
      totalSpent: 0,
      updatedAt: now,
    });
    idx = rows.length - 1;
    await writeAdFundsWallets(rows);
  }
  return { rows, index: idx };
}
