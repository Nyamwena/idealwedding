// COPY TO: frontend/src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('accessToken')?.value;

        if (!accessToken) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        const user = await verifyToken(accessToken);

        if (!user) {
            return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('[Me Route Error]', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}