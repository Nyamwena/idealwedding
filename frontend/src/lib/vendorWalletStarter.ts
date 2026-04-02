const DEFAULT_STARTER = 100;

/** Credits when a vendor wallet row is first created (first credits GET, lead purchase, or lead settle). */
export function getVendorWalletStarterCredits(): number {
  const raw = process.env.VENDOR_WALLET_STARTER_CREDITS;
  if (raw === undefined || raw === '') return DEFAULT_STARTER;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_STARTER;
}

export function newVendorWalletBalanceFields() {
  const now = new Date().toISOString();
  const starter = getVendorWalletStarterCredits();
  return {
    currentCredits: starter,
    totalPurchased: starter,
    totalUsed: 0,
    lastTopUp: now,
    updatedAt: now,
  };
}
