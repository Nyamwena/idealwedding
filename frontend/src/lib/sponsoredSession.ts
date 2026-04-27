const PREFIX = 'iw_sponsored_paid_';

/** Remember that a paid click was already recorded for this ad in this session (e.g. from a listing before opening the landing page). */
export function markSponsoredClickPaid(adId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PREFIX + adId, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function hasSponsoredClickPaid(adId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(PREFIX + adId) != null;
  } catch {
    return false;
  }
}
