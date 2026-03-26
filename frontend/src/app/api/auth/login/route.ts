import { NextResponse } from 'next/server';

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
  'http://localhost:3002';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const json = await response.json();
        if (!response.ok) {
            return NextResponse.json(
                { message: json.message || 'Login failed' },
                { status: response.status }
            );
        }

        const { user, accessToken, refreshToken } = json.data || {};
        const nextResponse = NextResponse.json({
            token: accessToken,
            user,
        });

        if (accessToken) {
            nextResponse.cookies.set('token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
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
    } catch {
        return NextResponse.json(
            { message: 'Server error' },
            { status: 500 }
        );
    }
}