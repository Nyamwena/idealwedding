import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read quotes from file
function readQuotes() {
  return readDataFile<any[]>('quotes.json', [
    {
      id: '1',
      customerName: 'Sarah & Mike Johnson',
      customerEmail: 'sarah.mike@example.com',
      vendorName: 'Elegant Flowers',
      service: 'Wedding Flowers',
      status: 'pending',
      amount: 2500,
      requestDate: '2024-09-20',
      message: 'Looking for beautiful wedding flowers for our ceremony in October.'
    }
  ]);
}

// Helper function to write quotes to file
function writeQuotes(quotes: any[]) {
  return writeDataFile('quotes.json', quotes);
}

// GET /api/admin/quotes - Get all quotes
export async function GET() {
  try {
    const quotes = await readQuotes();
    return NextResponse.json({
      success: true,
      data: quotes
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/quotes - Create new quote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate new ID
    const quotes = await readQuotes();
    const newId = `q${Date.now()}`;
    
    const newQuote = {
      id: newId,
      ...body,
      requestDate: new Date().toISOString().split('T')[0]
    };
    
    quotes.push(newQuote);
    await writeQuotes(quotes);
    
    return NextResponse.json({
      success: true,
      data: newQuote
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}
