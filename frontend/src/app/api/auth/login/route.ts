// COPY TO: frontend/src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { getAuthServiceBaseUrl } from '@/lib/authServiceUrl';

function pickAuthErrorMessage(json: unknown): string {
  if (!json || typeof json !== 'object') return 'Invalid credentials';
  const o = json as Record<string, unknown>;
  if (Array.isArray(o.message) && o.message.length > 0) {
    return String(o.message[0]);
  }
  if (typeof o.message === 'string' && o.message.trim()) {
    return o.message;
  }
  if (typeof o.error === 'string' && o.error.trim()) {
    return o.error;
  }
  return 'Invalid credentials';
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        const response = await fetchWithTimeout(`${getAuthServiceBaseUrl()}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const raw = await response.text();
        let json: Record<string, unknown> = {};
        if (raw) {
            try {
                json = JSON.parse(raw) as Record<string, unknown>;
            } catch {
                return NextResponse.json(
                    { message: response.statusText || 'Invalid response from auth service' },
                    { status: response.status }
                );
            }
        }

        if (!response.ok) {
            return NextResponse.json(
                { message: pickAuthErrorMessage(json) },
                { status: response.status }
            );
        }

        if (!json.success) {
            return NextResponse.json(
                { message: pickAuthErrorMessage(json) },
                { status: 401 }
            );
        }

        const payload = json.data;
        if (!payload || typeof payload !== 'object') {
            return NextResponse.json(
                { message: 'Invalid response from auth service' },
                { status: 502 }
            );
        }
        const { user, accessToken, refreshToken } = payload as {
            user: unknown;
            accessToken?: string;
            refreshToken?: string;
        };

        const nextResponse = NextResponse.json(
            {
                message: typeof json.message === 'string' ? json.message : 'Login successful',
                user,
            },
            { status: 200 }
        );

        if (accessToken) {
            nextResponse.cookies.set('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 15,
                path: '/',
            });
        }

        if (refreshToken) {
            nextResponse.cookies.set('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });
        }

        return nextResponse;
    } catch (error) {
        console.error('[Login Route Error]', error);
        const err = error instanceof Error ? error : new Error(String(error));
        const m = `${err.name} ${err.message}`;
        const unreachable =
            /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|fetch failed|Failed to fetch|network|aborted|getaddrinfo/i.test(
                m,
            );
        if (unreachable || err.name === 'AbortError') {
            const base = getAuthServiceBaseUrl();
            return NextResponse.json(
                {
                    message: `Cannot reach the auth service at ${base}. Start MySQL on port 3306, then run: cd backend/auth-service && npm run start`,
                },
                { status: 503 },
            );
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}