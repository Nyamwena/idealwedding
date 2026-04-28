/**
 * Origin only (no path). Route handlers append `/api/v1/auth/...`.
 * If env mistakenly includes `/api/v1`, strip it so requests are not doubled.
 */
function normalizeAuthServiceBaseUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, '');
  if (u.endsWith('/api/v1')) {
    u = u.slice(0, -'/api/v1'.length).replace(/\/+$/, '');
  }
  return u;
}

/**
 * Single source of truth for which auth service the app talks to (login, password reset, etc.).
 * Server-side route handlers do not always inherit `next.config.js` `env` defaults — set
 * `AUTH_SERVICE_URL` (preferred on the server) or `NEXT_PUBLIC_AUTH_SERVICE_URL` in `.env` / `.env.local`.
 * Must be the Nest auth-service origin where `/api/v1/auth/login` exists — not the Next.js site URL.
 */
export function getAuthServiceBaseUrl(): string {
  const fromEnv = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
  if (fromEnv?.trim()) return normalizeAuthServiceBaseUrl(fromEnv);

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3002';
  }

  return 'https://api-auth.idealweddings.space';
}
