import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const notifications = await readDataFile<any[]>('notifications.json', []);
    
    // Find specific notification item
    const notificationItem = notifications.find((item: any) => item.id === id);
    
    if (!notificationItem) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: notificationItem,
      message: 'Notification retrieved successfully'
    });
  } catch (error) {
    console.error('Error reading notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notification' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    const notifications = await readDataFile<any[]>('notifications.json', []);
    
    // Find notification item index
    const notificationIndex = notifications.findIndex((item: any) => item.id === id);
    
    if (notificationIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Update notification item
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      sendDate: updates.status === 'sent' && !notifications[notificationIndex].sendDate 
        ? new Date().toISOString().split('T')[0] 
        : notifications[notificationIndex].sendDate,
      recipients: updates.status === 'sent' && notifications[notificationIndex].recipients === 0
        ? Math.floor(Math.random() * 200) + 10
        : notifications[notificationIndex].recipients,
      openRate: updates.status === 'sent' && notifications[notificationIndex].openRate === 0
        ? Math.floor(Math.random() * 40) + 60
        : notifications[notificationIndex].openRate
    };
    
    await writeDataFile('notifications.json', notifications);
    
    return NextResponse.json({
      success: true,
      data: notifications[notificationIndex],
      message: 'Notification updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const notifications = await readDataFile<any[]>('notifications.json', []);
    
    // Find notification item index
    const notificationIndex = notifications.findIndex((item: any) => item.id === id);
    
    if (notificationIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Remove notification item
    const deletedNotification = notifications.splice(notificationIndex, 1)[0];
    
    await writeDataFile('notifications.json', notifications);
    
    return NextResponse.json({
      success: true,
      data: deletedNotification,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
