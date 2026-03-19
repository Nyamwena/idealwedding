import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function getAuthToken(request: NextRequest): string | null {
    const header = request.headers.get('authorization');
    if (header?.startsWith('Bearer ')) return header.slice(7);
    return request.cookies.get('accessToken')?.value || null;
}

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
    const token = getAuthToken(request);
    if (!token) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role.toUpperCase() !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return null;
}

export async function GET(request: NextRequest) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ success: true, data: users });

    } catch (error) {
        console.error('Error in GET /api/admin/users:', error);
        return NextResponse.json({ success: false, error: 'Failed to load users' }, { status: 500 });
    }
}