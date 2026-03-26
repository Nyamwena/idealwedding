import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read support tickets
function readSupportTickets() {
  return readDataFile<any[]>('support-tickets.json', [
    {
      id: 't1',
      subject: 'Welcome to Support',
      userEmail: 'admin@idealweddings.com',
      userName: 'System Admin',
      status: 'closed',
      priority: 'low',
      category: 'General',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      message: 'Welcome to the support system!',
      assignedTo: 'admin@idealweddings.com',
      replies: []
    }
  ]);
}

// Helper function to write support tickets
function writeSupportTickets(tickets: any[]) {
  return writeDataFile('support-tickets.json', tickets);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    
    let tickets = await readSupportTickets();
    
    // Apply filters
    if (status && status !== 'all') {
      tickets = tickets.filter(ticket => ticket.status === status);
    }
    
    if (priority && priority !== 'all') {
      tickets = tickets.filter(ticket => ticket.priority === priority);
    }
    
    if (category && category !== 'all') {
      tickets = tickets.filter(ticket => ticket.category === category);
    }
    
    // Sort by created date (newest first)
    tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json({
      success: true,
      data: tickets,
      total: tickets.length
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch support tickets'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, userEmail, userName, message, priority = 'medium', category = 'General' } = body;
    
    if (!subject || !userEmail || !userName || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: subject, userEmail, userName, message'
      }, { status: 400 });
    }
    
    const tickets = await readSupportTickets();
    const newTicket = {
      id: `t${Date.now()}`,
      subject,
      userEmail,
      userName,
      status: 'open',
      priority,
      category,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      message,
      assignedTo: null,
      replies: []
    };
    
    tickets.unshift(newTicket); // Add to beginning
    await writeSupportTickets(tickets);
    
    return NextResponse.json({
      success: true,
      data: newTicket,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create support ticket'
    }, { status: 500 });
  }
}
