// COPY TO: frontend/src/app/api/auth/refresh/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://api-auth.idealweddings.space';

/** Avoids the route handler hanging if the auth service never responds (matches client-side auth timeout). */
const UPSTREAM_REFRESH_TIMEOUT_MS = 12_000;

function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}

export async function POST(request: NextRequest) {
    try {
        const refreshToken = request.cookies.get('refreshToken')?.value;

        if (!refreshToken) {
            return NextResponse.json({ message: 'No refresh token found' }, { status: 401 });
        }

        let response: Response;
        try {
            response = await fetchWithTimeout(
                `${AUTH_SERVICE_URL}/api/v1/auth/refresh`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                },
                UPSTREAM_REFRESH_TIMEOUT_MS,
            );
        } catch (error) {
            if (isAbortError(error)) {
                console.error('[Refresh Route Error] Upstream timeout');
                return NextResponse.json(
                    { message: 'Authentication service did not respond in time' },
                    { status: 504 },
                );
            }
            throw error;
        }

        const json = await response.json();

        if (!response.ok || !json.success) {
            const nextResponse = NextResponse.json(
                { message: json.message || 'Session expired, please login again' },
                { status: 401 }
            );
            nextResponse.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
            nextResponse.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
            return nextResponse;
        }

        const { accessToken, refreshToken: newRefreshToken } = json.data;

        const nextResponse = NextResponse.json({ message: 'Token refreshed' }, { status: 200 });

        if (accessToken) {
            nextResponse.cookies.set('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 15,
                path: '/',
            });
        }

        if (newRefreshToken) {
            nextResponse.cookies.set('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });
        }

        return nextResponse;
    } catch (error) {
        console.error('[Refresh Route Error]', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}