// COPY TO: frontend/src/lib/auth.ts

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf8')
        );

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) return null;
        if (!payload.sub || !payload.email || !payload.role) return null;

        return {
            id: String(payload.sub),
            email: payload.email,
            firstName: payload.firstName || '',
            lastName: payload.lastName || '',
            role: payload.role,
        };
    } catch {
        return null;
    }
}

export function extractBearerToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const cookieStore = cookies();
        const accessToken = cookieStore.get('accessToken')?.value;
        if (!accessToken) return null;
        return await verifyToken(accessToken);
    } catch {
        return null;
    }
}

export function getAccessToken(): string | undefined {
    const cookieStore = cookies();
    return cookieStore.get('accessToken')?.value;
}

export function authHeader(): Record<string, string> {
    const token = getAccessToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}