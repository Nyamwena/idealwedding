import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import { verifyToken } from '@/lib/auth';
import { getAuthServiceBaseUrl } from '@/lib/authServiceUrl';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

function getAuthToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get('accessToken')?.value || null;
}

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

async function getVendors() {
  return readDataFile<any[]>('vendors.json', []);
}

function extractErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Request failed';
  const p = payload as Record<string, unknown>;
  if (typeof p.message === 'string') return p.message;
  if (Array.isArray(p.message) && p.message.length > 0) return String(p.message[0]);
  if (typeof p.error === 'string') return p.error;
  if (typeof p.error === 'object' && p.error !== null) {
    const e = p.error as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
  }
  return 'Request failed';
}

/** POST /api/admin/vendors/[id]/password — set vendor login password (auth service) */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authBase = getAuthServiceBaseUrl();

  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const newPassword = String(body.newPassword ?? '');

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    const vendors = await getVendors();
    const vendor = vendors.find((v) => String(v.id) === String(params.id));

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    const email = String(vendor.email || '').trim();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Vendor has no email on file' }, { status: 400 });
    }

    const url = `${authBase}/api/v1/users/admin/reset-vendor-password`;

    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, newPassword }),
      },
      15_000,
    );

    const rawText = await response.text();
    let result: Record<string, unknown> = {};
    if (rawText) {
      try {
        result = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        result = { message: rawText.slice(0, 200) };
      }
    }

    if (!response.ok) {
      const msg = extractErrorMessage(result);
      const hint =
        response.status === 401
          ? ' Your session may be for a different auth server than this app is calling. Set AUTH_SERVICE_URL in .env.local to match where you log in.'
          : response.status === 404
            ? ' No user with this email exists in the auth database. Create the vendor (Add Vendor) or register that email as a vendor first.'
            : '';
      return NextResponse.json(
        { success: false, error: `${msg}${hint}`, upstreamStatus: response.status },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor password updated successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isAbort = message.includes('abort') || message === 'The operation was aborted';
    const isConn =
      message.includes('ECONNREFUSED') ||
      message.includes('fetch failed') ||
      message.includes('ENOTFOUND') ||
      message.includes('getaddrinfo');

    console.error('[admin/vendor/password]', { authBase, error: message });

    const hint = isConn
      ? ` Cannot reach auth service at ${authBase}. Start the auth service (e.g. port 3002) or set AUTH_SERVICE_URL in frontend/.env.local.`
      : isAbort
        ? ' Auth service request timed out.'
        : '';

    return NextResponse.json(
      {
        success: false,
        error: `Failed to reset vendor password: ${message}.${hint}`,
      },
      { status: 500 },
    );
  }
}
