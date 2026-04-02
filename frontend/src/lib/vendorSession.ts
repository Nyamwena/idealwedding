import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export type VendorSession = {
  userId: string;
  email: string;
  vendorId: string;
};

/**
 * Resolve the current vendor from the same cookies / headers as /api/auth/me.
 * Uses accessToken (httpOnly) from login, with fallbacks for Bearer and legacy token cookie.
 */
export async function getVendorSession(request: NextRequest): Promise<VendorSession | null> {
  const candidates: string[] = [];
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    const t = header.slice(7).trim();
    if (t) candidates.push(t);
  }
  const access = request.cookies.get('accessToken')?.value;
  if (access?.trim()) candidates.push(access.trim());
  const legacy = request.cookies.get('token')?.value;
  if (legacy?.trim()) candidates.push(legacy.trim());

  const seen = new Set<string>();
  for (const raw of candidates) {
    if (seen.has(raw)) continue;
    seen.add(raw);

    const user = await verifyToken(raw);
    if (!user) continue;
    if (String(user.role || '').toUpperCase() !== 'VENDOR') continue;

    const userId = String(user.id);
    return {
      userId,
      email: String(user.email || '').toLowerCase(),
      vendorId: `vendor_${userId}`,
    };
  }

  return null;
}
