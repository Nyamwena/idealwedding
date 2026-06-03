import { NextResponse } from 'next/server';
import { getAuthServiceBaseUrl } from '@/lib/authServiceUrl';

/**
 * Lightweight runtime check for deployed environments.
 * Exposes only non-sensitive configuration useful for auth troubleshooting.
 */
export async function GET() {
  const hasAuthServiceUrl = Boolean(process.env.AUTH_SERVICE_URL?.trim());
  const hasPublicAuthServiceUrl = Boolean(process.env.NEXT_PUBLIC_AUTH_SERVICE_URL?.trim());

  return NextResponse.json(
    {
      ok: true,
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
      authServiceBaseUrl: getAuthServiceBaseUrl(),
      source: hasAuthServiceUrl
        ? 'AUTH_SERVICE_URL'
        : hasPublicAuthServiceUrl
          ? 'NEXT_PUBLIC_AUTH_SERVICE_URL'
          : 'default',
    },
    { status: 200 },
  );
}
