import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read payments from file
function readPayments() {
  return readDataFile<any[]>('payments.json', [
    {
      id: 'p1',
      customerName: 'Sarah Johnson',
      vendorName: 'Elegant Flowers',
      serviceType: 'Florist',
      amount: 2500,
      status: 'completed',
      paymentMethod: 'credit_card',
      transactionDate: '2024-09-20',
      bookingId: 'b1',
      commission: 250
    }
  ]);
}

// Helper function to write payments to file
function writePayments(payments: any[]) {
  return writeDataFile('payments.json', payments);
}

// GET /api/admin/payments - Get all payments
export async function GET() {
  try {
    const payments = await readPayments();
    return NextResponse.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/payments - Create new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate new ID
    const payments = await readPayments();
    const newId = `p${Date.now()}`;
    
    const newPayment = {
      id: newId,
      ...body,
      transactionDate: new Date().toISOString().split('T')[0]
    };
    
    payments.push(newPayment);
    await writePayments(payments);
    
    return NextResponse.json({
      success: true,
      data: newPayment
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
