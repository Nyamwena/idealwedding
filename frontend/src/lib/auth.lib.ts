// ============================================================
// FILE PATH: /home/ideaxrbb/idealweddings/frontend/src/lib/auth.ts
// ============================================================

import { cookies } from 'next/headers';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://api-auth.idealweddings.space';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Get current authenticated user — use in Server Components & Server Actions
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) return null;

    const response = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Get raw access token — use when forwarding auth to backend services
 */
export function getAccessToken(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get('accessToken')?.value;
}

/**
 * Build Authorization header for backend service calls
 */
export function authHeader(): Record<string, string> {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
