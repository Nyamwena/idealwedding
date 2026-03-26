import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Read users from file
const getUsers = () => {
  return readDataFile<any[]>('users.json', []);
};

// Write users to file
const saveUsers = (users: any[]) => {
  return writeDataFile('users.json', users);
};

// GET /api/admin/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id === params.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update specific user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, role, status } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !role || !status) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already used by another user
    const existingUser = users.find(u => u.email === email && u.id !== params.id);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email address is already in use by another user' },
        { status: 409 }
      );
    }

    // Update user
    users[userIndex] = {
      ...users[userIndex],
      firstName,
      lastName,
      email,
      phone,
      role,
      status,
    };

    // Save to file
    await saveUsers(users);

    return NextResponse.json({
      success: true,
      data: users[userIndex],
      message: 'User updated successfully',
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete specific user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove user from array
    const deletedUser = users.splice(userIndex, 1)[0];

    // Save to file
    await saveUsers(users);

    return NextResponse.json({
      success: true,
      data: deletedUser,
      message: 'User deleted successfully',
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
