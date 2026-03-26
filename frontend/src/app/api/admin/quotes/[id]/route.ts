import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read quotes from file
function readQuotes() {
  return readDataFile<any[]>('quotes.json', []);
}

// Helper function to write quotes to file
function writeQuotes(quotes: any[]) {
  return writeDataFile('quotes.json', quotes);
}

// GET /api/admin/quotes/[id] - Get specific quote
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quotes = await readQuotes();
    const quote = quotes.find((q: any) => q.id === params.id);
    
    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/quotes/[id] - Update specific quote
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const quotes = await readQuotes();
    const quoteIndex = quotes.findIndex((q: any) => q.id === params.id);
    
    if (quoteIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    // Update the quote
    const updatedQuote = { 
      ...quotes[quoteIndex], 
      ...body,
      responseDate: new Date().toISOString().split('T')[0]
    };
    quotes[quoteIndex] = updatedQuote;
    await writeQuotes(quotes);
    
    return NextResponse.json({
      success: true,
      data: updatedQuote
    });
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quote' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/quotes/[id] - Delete specific quote
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quotes = await readQuotes();
    const quoteIndex = quotes.findIndex((q: any) => q.id === params.id);
    
    if (quoteIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    const deletedQuote = quotes.splice(quoteIndex, 1)[0];
    await writeQuotes(quotes);
    
    return NextResponse.json({
      success: true,
      data: deletedQuote
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}
