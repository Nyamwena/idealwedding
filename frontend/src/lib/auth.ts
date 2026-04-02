// COPY TO: frontend/src/lib/auth.ts

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { readFirstLoginFlag } from './authFirstLogin';

export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    /** When true, auth service / JWT indicates the user’s first sign-in (show onboarding-style greeting). */
    isFirstLogin?: boolean;
}

function decodeJwtPayload(segment: string): Record<string, unknown> | null {
    try {
        let s = segment.replace(/-/g, '+').replace(/_/g, '/');
        const pad = s.length % 4;
        if (pad) s += '='.repeat(4 - pad);
        const json = Buffer.from(s, 'base64').toString('utf8');
        return JSON.parse(json) as Record<string, unknown>;
    } catch {
        return null;
    }
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
    try {
        const trimmed = String(token || '').trim();
        if (!trimmed) return null;

        const parts = trimmed.split('.');
        if (parts.length !== 3) return null;

        const payload = decodeJwtPayload(parts[1]);
        if (!payload) return null;

        const now = Math.floor(Date.now() / 1000);
        if (typeof payload.exp === 'number' && payload.exp < now) return null;

        const idRaw = payload.sub ?? payload.userId ?? payload.id;
        const emailRaw = payload.email ?? payload.userEmail;
        const roleRaw = payload.role ?? payload.userRole;

        if (idRaw === undefined || idRaw === null) return null;
        if (typeof emailRaw !== 'string' || !emailRaw) return null;
        if (typeof roleRaw !== 'string' || !roleRaw) return null;

        const base: AuthUser = {
            id: String(idRaw),
            email: emailRaw,
            firstName: typeof payload.firstName === 'string' ? payload.firstName : '',
            lastName: typeof payload.lastName === 'string' ? payload.lastName : '',
            role: roleRaw,
        };

        if (readFirstLoginFlag(payload)) {
            return { ...base, isFirstLogin: true };
        }

        return base;
    } catch {
        return null;
    }
}

export function extractBearerToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
}

/** User from `accessToken` cookie or `Authorization: Bearer` (API routes). */
export async function getAuthenticatedUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
    const cookieToken = request.cookies.get('accessToken')?.value;
    if (cookieToken) {
        const u = await verifyToken(cookieToken);
        if (u) return u;
    }
    const bearer = extractBearerToken(request);
    if (bearer) return verifyToken(bearer);
    return null;
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