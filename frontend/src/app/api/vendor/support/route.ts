import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';

export const dynamic = 'force-dynamic';

const DEFAULT_FAQS = [
  {
    id: 'faq_1',
    question: 'How do I update my business profile?',
    answer:
      'Open Profile from the vendor dashboard and edit your details. Changes save to your vendor account.',
    category: 'account',
  },
  {
    id: 'faq_2',
    question: 'How do I respond to quote requests?',
    answer: 'Go to Quote Management to view scoped quotes and create quotes linked to your leads.',
    category: 'technical',
  },
  {
    id: 'faq_3',
    question: 'When do I receive payments?',
    answer:
      'Payments listed under Payments reflect entries tied to your vendor ID. Settlement timing depends on your processor configuration.',
    category: 'billing',
  },
  {
    id: 'faq_4',
    question: 'How do credits work?',
    answer: 'Credits are stored per vendor wallet. Leads can deduct credits when you accept or simulate incoming leads.',
    category: 'billing',
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const all = await readDataFile<any[]>('vendor-support-tickets.json', []);
    const tickets = all.filter(
      (t) =>
        String(t.vendorUserId || '') === session.userId ||
        String(t.vendorId || '') === session.vendorId,
    ).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

    return NextResponse.json({
      success: true,
      data: { tickets, faqs: DEFAULT_FAQS },
    });
  } catch (e) {
    console.error('GET /api/vendor/support:', e);
    return NextResponse.json({ success: false, error: 'Failed to load support' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const body = await request.json();
    const subject = String(body.subject || '').trim();
    const description = String(body.description || '').trim();
    const category = String(body.category || 'other');
    const priority = String(body.priority || 'medium');
    if (!subject || !description) {
      return NextResponse.json({ success: false, error: 'subject and description required' }, { status: 400 });
    }

    const all = await readDataFile<any[]>('vendor-support-tickets.json', []);
    const now = new Date().toISOString();
    const ticket = {
      id: `ticket_${Date.now()}`,
      vendorUserId: session.userId,
      vendorId: session.vendorId,
      subject,
      description,
      status: 'open',
      priority,
      category,
      createdAt: now.split('T')[0],
      updatedAt: now.split('T')[0],
    };
    all.unshift(ticket);
    await writeDataFile('vendor-support-tickets.json', all);
    return NextResponse.json({ success: true, data: ticket }, { status: 201 });
  } catch (e) {
    console.error('POST /api/vendor/support:', e);
    return NextResponse.json({ success: false, error: 'Failed to create ticket' }, { status: 500 });
  }
}
