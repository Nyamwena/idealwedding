// COPY TO: frontend/src/app/api/auth/refresh/route.ts

import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://api-auth.idealweddings.space';

export async function POST(request: NextRequest) {
    try {
        const refreshToken = request.cookies.get('refreshToken')?.value;

        if (!refreshToken) {
            return NextResponse.json({ message: 'No refresh token found' }, { status: 401 });
        }

        const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

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