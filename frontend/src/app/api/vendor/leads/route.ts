import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

const defaultData = [
      {
        id: 'lead_001',
        coupleName: 'Sarah & John',
        coupleEmail: 'sarah.john@email.com',
        couplePhone: '+1 (555) 123-4567',
        weddingDate: '2024-12-15',
        location: 'New York, NY',
        serviceCategory: 'Photography',
        budget: 2500,
        description: 'Looking for a wedding photographer for our December wedding. We want both ceremony and reception coverage.',
        timestamp: '2024-09-24T10:30:00Z',
        status: 'new',
        referralTag: 'REF-2024-001',
        creditsUsed: 5,
        responseDeadline: '2024-09-26T10:30:00Z',
      },
      {
        id: 'lead_002',
        coupleName: 'Emily & Michael',
        coupleEmail: 'emily.michael@email.com',
        couplePhone: '+1 (555) 234-5678',
        weddingDate: '2025-03-20',
        location: 'Los Angeles, CA',
        serviceCategory: 'Wedding Planning',
        budget: 5000,
        description: 'Need a full-service wedding planner for our spring wedding. We have a specific vision in mind.',
        timestamp: '2024-09-24T09:15:00Z',
        status: 'contacted',
        referralTag: 'REF-2024-002',
        creditsUsed: 5,
        responseDeadline: '2024-09-26T09:15:00Z',
      },
      {
        id: 'lead_003',
        coupleName: 'Jessica & David',
        coupleEmail: 'jessica.david@email.com',
        couplePhone: '+1 (555) 345-6789',
        weddingDate: '2025-01-10',
        location: 'Chicago, IL',
        serviceCategory: 'Catering',
        budget: 3000,
        description: 'Looking for catering services for 150 guests. We prefer a mix of traditional and modern cuisine.',
        timestamp: '2024-09-20T11:45:00Z',
        status: 'quoted',
        referralTag: 'REF-2024-003',
        creditsUsed: 5,
        responseDeadline: '2024-09-22T11:45:00Z',
      },
      {
        id: 'lead_004',
        coupleName: 'Amanda & Robert',
        coupleEmail: 'amanda.robert@email.com',
        couplePhone: '+1 (555) 456-7890',
        weddingDate: '2024-11-30',
        location: 'Miami, FL',
        serviceCategory: 'Florist',
        budget: 1800,
        description: 'Need beautiful floral arrangements for our beach wedding. Tropical theme preferred.',
        timestamp: '2024-09-18T14:20:00Z',
        status: 'booked',
        referralTag: 'REF-2024-004',
        creditsUsed: 5,
        responseDeadline: '2024-09-20T14:20:00Z',
      },
      {
        id: 'lead_005',
        coupleName: 'Lisa & Mark',
        coupleEmail: 'lisa.mark@email.com',
        couplePhone: '+1 (555) 567-8901',
        weddingDate: '2025-05-15',
        location: 'Austin, TX',
        serviceCategory: 'Music & Entertainment',
        budget: 2200,
        description: 'Looking for a live band for our outdoor wedding. We love country and rock music.',
        timestamp: '2024-09-15T16:30:00Z',
        status: 'declined',
        referralTag: 'REF-2024-005',
        creditsUsed: 5,
        responseDeadline: '2024-09-17T16:30:00Z',
      },
    ];

async function readLeads() {
  return readDataFile<any[]>('vendor-leads.json', defaultData);
}

export async function GET(request: NextRequest) {
  try {
    const data = await readLeads();
    
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error reading vendor leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read vendor leads data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, status } = body;
    const data = await readLeads();
    
    // Find and update the lead
    const leadIndex = data.findIndex((lead: any) => lead.id === leadId);
    if (leadIndex !== -1) {
      data[leadIndex].status = status;
      
      await writeDataFile('vendor-leads.json', data);
      
      return NextResponse.json({
        success: true,
        data: data[leadIndex],
        message: 'Lead status updated successfully'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Lead not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error updating lead status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lead status' },
      { status: 500 }
    );
  }
}
