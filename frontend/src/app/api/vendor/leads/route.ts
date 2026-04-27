import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { appendVendorNotification } from '@/lib/vendorNotificationsStore';
import { findVendorBySessionEmail, leadBelongsToVendor } from '@/lib/vendorLeadScope';
import { settleOutstandingLeadCredits } from '@/lib/vendorLeadCreditSettlement';
import { newVendorWalletBalanceFields } from '@/lib/vendorWalletStarter';

async function readLeads() {
  return readDataFile<any[]>('vendor-leads.json', []);
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

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    const vendorUserId = session?.userId;
    if (!vendorUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const vendors = await readVendors();
    const catalogVendor = findVendorBySessionEmail(vendors, session);
    await settleOutstandingLeadCredits(session, catalogVendor);
    const data = await readLeads();
    const scoped = data.filter((lead: any) => leadBelongsToVendor(lead, session, catalogVendor));

    return NextResponse.json({
      success: true,
      data: scoped,
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
    const session = await getVendorSession(request);
    const vendorUserId = session?.userId;
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
    const vendorId = session!.vendorId;
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
        ...newVendorWalletBalanceFields(),
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
      creditsSettled: true,
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

    try {
      await appendVendorNotification(session, {
        type: 'lead',
        title: 'New lead received',
        message: `${created.coupleName} — ${created.serviceCategory || 'Inquiry'} (${created.location || 'Location TBD'})`,
        priority: 'high',
        actionUrl: '/vendor/leads',
        actionText: 'View leads',
        refId: `lead:${created.id}`,
      });
    } catch (notifErr) {
      console.error('Failed to record lead notification:', notifErr);
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
    const session = await getVendorSession(request);
    const vendorUserId = session?.userId;
    const vendorId = session?.vendorId;
    if (!vendorUserId || !vendorId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized vendor access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { leadId, status } = body;
    const [data, vendors] = await Promise.all([readLeads(), readVendors()]);
    const catalogVendor = findVendorBySessionEmail(vendors, session);
    // Find and update the lead
    const leadIndex = data.findIndex(
      (lead: any) => lead.id === leadId && leadBelongsToVendor(lead, session, catalogVendor),
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
