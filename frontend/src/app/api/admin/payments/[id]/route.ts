import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read payments from file
function readPayments() {
  return readDataFile<any[]>('payments.json', []);
}

// Helper function to write payments to file
function writePayments(payments: any[]) {
  return writeDataFile('payments.json', payments);
}

// GET /api/admin/payments/[id] - Get specific payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payments = await readPayments();
    const payment = payments.find((p: any) => p.id === params.id);
    
    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/payments/[id] - Update specific payment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const payments = await readPayments();
    const paymentIndex = payments.findIndex((p: any) => p.id === params.id);
    
    if (paymentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // Update the payment
    const updatedPayment = { 
      ...payments[paymentIndex], 
      ...body
    };
    
    // Update commission based on status
    if (body.status === 'refunded') {
      updatedPayment.commission = 0;
    } else if (body.status === 'completed' && payments[paymentIndex].commission === 0) {
      // Restore commission if payment is completed and was previously refunded
      updatedPayment.commission = Math.round(updatedPayment.amount * 0.1); // 10% commission
    }
    
    payments[paymentIndex] = updatedPayment;
    await writePayments(payments);
    
    return NextResponse.json({
      success: true,
      data: updatedPayment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payments/[id] - Delete specific payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payments = await readPayments();
    const paymentIndex = payments.findIndex((p: any) => p.id === params.id);
    
    if (paymentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    const deletedPayment = payments.splice(paymentIndex, 1)[0];
    await writePayments(payments);
    
    return NextResponse.json({
      success: true,
      data: deletedPayment
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
