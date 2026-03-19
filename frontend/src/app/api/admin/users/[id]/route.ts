import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { verifyToken } from '@/lib/auth';

const getUsers = () => readDataFile<any[]>('users.json', []);
const saveUsers = (users: any[]) => writeDataFile('users.json', users);

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

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const users = await getUsers();
        const user = users.find(u => u.id === params.id);

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error('Error in GET /api/admin/users/[id]:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const body = await request.json();
        const { firstName, lastName, email, phone, role, status } = body;

        if (!firstName || !lastName || !email || !phone || !role || !status) {
            return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
        }

        const users = await getUsers();
        const userIndex = users.findIndex(u => u.id === params.id);

        if (userIndex === -1) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const existingUser = users.find(u => u.email === email && u.id !== params.id);
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email address is already in use by another user' },
                { status: 409 }
            );
        }

        users[userIndex] = { ...users[userIndex], firstName, lastName, email, phone, role, status };
        await saveUsers(users);

        return NextResponse.json({ success: true, data: users[userIndex], message: 'User updated successfully' });
    } catch (error) {
        console.error('Error in PUT /api/admin/users/[id]:', error);
        return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const users = await getUsers();
        const userIndex = users.findIndex(u => u.id === params.id);

        if (userIndex === -1) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const deletedUser = users.splice(userIndex, 1)[0];
        await saveUsers(users);

        return NextResponse.json({ success: true, data: deletedUser, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/admin/users/[id]:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
    }
}