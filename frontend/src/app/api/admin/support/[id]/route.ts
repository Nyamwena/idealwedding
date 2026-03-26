import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read support tickets
function readSupportTickets() {
  return readDataFile<any[]>('support-tickets.json', []);
}

// Helper function to write support tickets
function writeSupportTickets(tickets: any[]) {
  return writeDataFile('support-tickets.json', tickets);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tickets = await readSupportTickets();
    const ticket = tickets.find(t => t.id === params.id);
    
    if (!ticket) {
      return NextResponse.json({
        success: false,
        error: 'Support ticket not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch support ticket'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, status, priority, assignedTo, reply } = body;
    
    const tickets = await readSupportTickets();
    const ticketIndex = tickets.findIndex(t => t.id === params.id);
    
    if (ticketIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Support ticket not found'
      }, { status: 404 });
    }
    
    const ticket = tickets[ticketIndex];
    
    // Update ticket based on action
    switch (action) {
      case 'update_status':
        if (!status) {
          return NextResponse.json({
            success: false,
            error: 'Status is required for update_status action'
          }, { status: 400 });
        }
        ticket.status = status;
        ticket.lastUpdated = new Date().toISOString();
        break;
        
      case 'update_priority':
        if (!priority) {
          return NextResponse.json({
            success: false,
            error: 'Priority is required for update_priority action'
          }, { status: 400 });
        }
        ticket.priority = priority;
        ticket.lastUpdated = new Date().toISOString();
        break;
        
      case 'assign':
        if (!assignedTo) {
          return NextResponse.json({
            success: false,
            error: 'AssignedTo is required for assign action'
          }, { status: 400 });
        }
        ticket.assignedTo = assignedTo;
        ticket.status = 'in-progress';
        ticket.lastUpdated = new Date().toISOString();
        break;
        
      case 'reply':
        if (!reply) {
          return NextResponse.json({
            success: false,
            error: 'Reply message is required for reply action'
          }, { status: 400 });
        }
        
        const newReply = {
          id: `r${Date.now()}`,
          message: reply,
          author: 'admin@idealweddings.com',
          timestamp: new Date().toISOString()
        };
        
        ticket.replies = ticket.replies || [];
        ticket.replies.push(newReply);
        ticket.lastUpdated = new Date().toISOString();
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
    
    tickets[ticketIndex] = ticket;
    await writeSupportTickets(tickets);
    
    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Support ticket updated successfully'
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update support ticket'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tickets = await readSupportTickets();
    const ticketIndex = tickets.findIndex(t => t.id === params.id);
    
    if (ticketIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Support ticket not found'
      }, { status: 404 });
    }
    
    const deletedTicket = tickets[ticketIndex];
    tickets.splice(ticketIndex, 1);
    await writeSupportTickets(tickets);
    
    return NextResponse.json({
      success: true,
      data: deletedTicket,
      message: 'Support ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete support ticket'
    }, { status: 500 });
  }
}
