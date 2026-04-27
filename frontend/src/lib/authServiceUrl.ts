/**
 * Single source of truth for which auth service the app talks to (login, password reset, etc.).
 * Server-side route handlers do not always inherit `next.config.js` `env` defaults — set
 * `AUTH_SERVICE_URL` or `NEXT_PUBLIC_AUTH_SERVICE_URL` in `.env.local` if needed.
 */
export function getAuthServiceBaseUrl(): string {
  const fromEnv = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
  if (fromEnv?.trim()) return fromEnv.trim();

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3002';
  }

  return 'https://api-auth.idealweddings.space';
}
