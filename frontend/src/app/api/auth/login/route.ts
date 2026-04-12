// COPY TO: frontend/src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://api-auth.idealweddings.space';

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

        const response = await fetchWithTimeout(`${AUTH_SERVICE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
            return NextResponse.json(
                { message: json.message || 'Invalid credentials' },
                { status: response.status }
            );
        }

        const { user, accessToken, refreshToken } = json.data;

        const nextResponse = NextResponse.json(
            { message: json.message || 'Login successful', user },
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
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}