/**
 * POST to /api/advertisements/:id/click — bills the ad wallet and returns the ad target URL.
 */
export async function postAdvertisementClick(adId: string): Promise<{
  ok: true;
  targetUrl: string;
} | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/advertisements/${encodeURIComponent(adId)}/click`, {
      method: 'POST',
      credentials: 'include',
    });
    const json = (await res.json().catch(() => ({}))) as {
      data?: { targetUrl?: string };
      error?: string;
    };
    if (res.ok && json.data?.targetUrl) {
      return { ok: true, targetUrl: json.data.targetUrl };
    }
    return {
      ok: false,
      error: typeof json.error === 'string' ? json.error : 'Could not process this ad click',
    };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
