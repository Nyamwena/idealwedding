// COPY TO: frontend/src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://api-auth.idealweddings.space';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, firstName, lastName, role } = body;

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { message: 'Email, password, firstName and lastName are required' },
                { status: 400 }
            );
        }

        const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName, role }),
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
            return NextResponse.json(
                { message: json.message || 'Registration failed' },
                { status: response.status }
            );
        }

        const { user, accessToken, refreshToken } = json.data;

        const nextResponse = NextResponse.json(
            { message: json.message || 'Registration successful', user },
            { status: 201 }
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
        console.error('[Register Route Error]', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}