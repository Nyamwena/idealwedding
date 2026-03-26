// COPY TO: frontend/src/app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://api-auth.idealweddings.space';

export async function POST(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('accessToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;

        if (accessToken) {
            await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ refreshToken }),
            }).catch(() => {});
        }

        const response = NextResponse.json(
            { message: 'Logged out successfully' },
            { status: 200 }
        );

        response.cookies.set('accessToken', '', { httpOnly: true, maxAge: 0, path: '/' });
        response.cookies.set('refreshToken', '', { httpOnly: true, maxAge: 0, path: '/' });

        return response;
    } catch (error) {
        console.error('[Logout Route Error]', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}