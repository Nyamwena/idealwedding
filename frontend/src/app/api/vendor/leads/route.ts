import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
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

async function readWallets() {
  return readDataFile<any[]>('vendor-credit-wallets.json', []);
}

async function writeWallets(wallets: any[]) {
  await writeDataFile('vendor-credit-wallets.json', wallets);
}

async function readTransactions() {
  return readDataFile<any[]>('vendor-credit-transactions.json', []);
}

async function writeTransactions(transactions: any[]) {
  await writeDataFile('vendor-credit-transactions.json', transactions);
}

async function readVendors() {
  return readDataFile<any[]>('vendors.json', []);
}

async function writeVendors(vendors: any[]) {
  await writeDataFile('vendors.json', vendors);
}

function getToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get('token')?.value || null;
}

function getVendorUserId(request: NextRequest): string | null {
  const token = getToken(request);
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as {
      userId?: string | number;
      role?: string;
    };
    const role = String(payload.role || '').toUpperCase();
    if (!payload.userId || role !== 'VENDOR') return null;
    return String(payload.userId);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const vendorUserId = getVendorUserId(request);
    if (!vendorUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const data = await readLeads();
    const scoped = data.filter((lead: any) => String(lead.vendorUserId || '') === vendorUserId);
    
    return NextResponse.json({
      success: true,
      data: scoped
    });
  } catch (error) {
    console.error('Error reading vendor leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read vendor leads data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendorUserId = getVendorUserId(request);
    if (!vendorUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = await readLeads();
    const creditsRequired =
      typeof body.creditsUsed === 'number' && body.creditsUsed > 0 ? body.creditsUsed : 5;

    const wallets = await readWallets();
    const vendorId = `vendor_${vendorUserId}`;
    let walletIndex = wallets.findIndex(
      (w: any) =>
        String(w.vendorUserId || '') === vendorUserId ||
        String(w.vendorId || '') === vendorId,
    );
    if (walletIndex < 0) {
      wallets.push({
        key: vendorId,
        vendorId,
        vendorUserId,
        currentCredits: 0,
        totalPurchased: 0,
        totalUsed: 0,
        lastTopUp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      walletIndex = wallets.length - 1;
    }

    const wallet = wallets[walletIndex];
    if (Number(wallet.currentCredits || 0) < creditsRequired) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits' },
        { status: 400 },
      );
    }

    const created = {
      id: body.id || `lead_${Date.now()}`,
      coupleName: body.coupleName || 'Unknown Couple',
      coupleEmail: body.coupleEmail || '',
      couplePhone: body.couplePhone || '',
      weddingDate: body.weddingDate || '',
      location: body.location || '',
      serviceCategory: body.serviceCategory || '',
      budget: typeof body.budget === 'number' ? body.budget : Number(body.budget || 0),
      description: body.description || '',
      timestamp: body.timestamp || new Date().toISOString(),
      status: body.status || 'new',
      referralTag: body.referralTag || `REF-${Date.now()}`,
      creditsUsed: creditsRequired,
      responseDeadline:
        body.responseDeadline ||
        new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      vendorUserId,
      vendorId,
    };

    wallet.currentCredits = Number(wallet.currentCredits || 0) - creditsRequired;
    wallet.totalUsed = Number(wallet.totalUsed || 0) + creditsRequired;
    wallet.updatedAt = new Date().toISOString();
    wallets[walletIndex] = wallet;

    const transactions = await readTransactions();
    transactions.push({
      id: `tx_${Date.now()}`,
      key: wallet.key || vendorId,
      vendorId,
      vendorUserId,
      type: 'usage',
      amount: -creditsRequired,
      description: `Lead received from ${created.coupleName} - ${created.serviceCategory}`,
      timestamp: new Date().toISOString(),
      referenceId: created.id,
      source: 'lead_create',
    });

    data.push(created);
    await Promise.all([
      writeDataFile('vendor-leads.json', data),
      writeWallets(wallets),
      writeTransactions(transactions),
    ]);

    const vendors = await readVendors();
    let vendorChanged = false;
    for (let i = 0; i < vendors.length; i += 1) {
      if (
        String(vendors[i].id || '') === vendorId ||
        String(vendors[i].email || '').toLowerCase() === String(wallet.email || '').toLowerCase()
      ) {
        vendors[i] = { ...vendors[i], credits: wallet.currentCredits };
        vendorChanged = true;
      }
    }
    if (vendorChanged) {
      await writeVendors(vendors);
    }

    return NextResponse.json(
      {
        success: true,
        data: created,
        message: 'Lead created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating vendor lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor lead' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const vendorUserId = getVendorUserId(request);
    if (!vendorUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { leadId, status } = body;
    const data = await readLeads();
    
    // Find and update the lead
    const leadIndex = data.findIndex(
      (lead: any) => lead.id === leadId && String(lead.vendorUserId || '') === vendorUserId
    );
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
