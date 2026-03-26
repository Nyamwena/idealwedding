import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function getTokenFromCookie(req: Request) {
    const cookie = req.headers.get('cookie');
    return cookie?.match(/token=([^;]+)/)?.[1];
}

export async function GET(req: Request) {
    try {
        const token = getTokenFromCookie(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        if (decoded.role !== 'ADMIN')
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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

        return NextResponse.json({ data: users });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }
}