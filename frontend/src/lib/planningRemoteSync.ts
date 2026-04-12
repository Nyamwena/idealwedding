import { PLANNING_PARTS, userPlanningKey } from '@/lib/userPlanningStorage';

/** Rough limit for JSON body; large document base64 may need stripping before upload. */
const MAX_SYNC_BYTES = 5 * 1024 * 1024;

function collectPartsFromLocalStorage(userId: string): Record<string, string> {
  const parts: Record<string, string> = {};
  for (const part of Object.values(PLANNING_PARTS)) {
    const raw = localStorage.getItem(userPlanningKey(userId, part));
    if (raw != null && raw.length > 0) parts[part] = raw;
  }
  return parts;
}

/** Shrink documents payload by dropping embedded files (keeps metadata for list UI). */
function slimDocumentsPart(json: string): string {
  try {
    const arr = JSON.parse(json) as Array<Record<string, unknown>>;
    if (!Array.isArray(arr)) return json;
    const slim = arr.map((d) => {
      const next = { ...d };
      if (typeof next.dataUrl === 'string' && next.dataUrl.startsWith('data:')) delete next.dataUrl;
      if (typeof next.url === 'string' && next.url.startsWith('data:')) next.url = '';
      return next;
    });
    return JSON.stringify(slim);
  } catch {
    return json;
  }
}

async function pushParts(userId: string, parts: Record<string, string>): Promise<void> {
  let body = JSON.stringify({ parts });
  if (body.length > MAX_SYNC_BYTES) {
    const docsKey = PLANNING_PARTS.userDocuments;
    if (parts[docsKey]) {
      parts = { ...parts, [docsKey]: slimDocumentsPart(parts[docsKey]) };
      body = JSON.stringify({ parts });
    }
  }
  if (body.length > MAX_SYNC_BYTES) {
    console.warn('[planning sync] Payload still too large; skipping upload.');
    return;
  }
  await fetch('/api/user/planning-storage', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

/**
 * After login: fetch server copy and write into localStorage so another browser/incognito sees the same data.
 */
export async function pullRemotePlanning(userId: string): Promise<void> {
  try {
    const res = await fetch('/api/user/planning-storage', { credentials: 'include' });
    if (!res.ok) return;
    const json = (await res.json()) as { data?: { parts?: Record<string, string> } };
    const parts = json?.data?.parts;
    if (parts && typeof parts === 'object' && Object.keys(parts).length > 0) {
      for (const part of Object.keys(parts)) {
        const raw = parts[part];
        if (typeof raw === 'string') {
          localStorage.setItem(userPlanningKey(userId, part), raw);
        }
      }
      return;
    }
    // Nothing on server yet — seed from this device if we have local data (backup / first sync).
    const local = collectPartsFromLocalStorage(userId);
    if (Object.keys(local).length > 0) {
      await pushParts(userId, local);
    }
  } catch {
    /* offline or server error — local data still works */
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced upload after local saves (guest list, seating, documents, etc.). */
export function schedulePushPlanning(userId: string | number): void {
  if (typeof window === 'undefined') return;
  if (pushTimer) clearTimeout(pushTimer);
  const uid = String(userId);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void (async () => {
      const parts = collectPartsFromLocalStorage(uid);
      if (Object.keys(parts).length === 0) return;
      try {
        await pushParts(uid, parts);
      } catch {
        /* ignore */
      }
    })();
  }, 900);
}
