import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

export async function GET() {
  try {
    const notifications = await readDataFile<any[]>('notifications.json', []);
    
    return NextResponse.json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Error reading notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newNotification = await request.json();
    
    const notifications = await readDataFile<any[]>('notifications.json', []);
    
    // Generate new ID
    const newId = `n${Date.now()}`;
    
    // Create new notification item
    const notificationItem = {
      id: newId,
      ...newNotification,
      recipients: newNotification.status === 'sent' ? Math.floor(Math.random() * 200) + 10 : 0,
      openRate: newNotification.status === 'sent' ? Math.floor(Math.random() * 40) + 60 : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sendDate: newNotification.status === 'sent' ? new Date().toISOString().split('T')[0] : '',
      scheduledDate: newNotification.status === 'scheduled' ? newNotification.scheduledDate : null,
      tags: newNotification.tags || [],
      priority: newNotification.priority || 'normal',
      category: newNotification.category || 'general'
    };
    
    // Add to notifications array
    notifications.push(notificationItem);
    
    await writeDataFile('notifications.json', notifications);
    
    return NextResponse.json({
      success: true,
      data: notificationItem,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
