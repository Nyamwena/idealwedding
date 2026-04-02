import { NextRequest, NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { leadBelongsToVendor } from '@/lib/vendorLeadScope';
import {
  appendVendorNotification,
  readVendorNotifications,
  scopeNotificationsForVendor,
  writeVendorNotifications,
  type StoredVendorNotification,
} from '@/lib/vendorNotificationsStore';

async function readLeadsScoped(session: NonNullable<Awaited<ReturnType<typeof getVendorSession>>>) {
  const leads = await readDataFile<any[]>('vendor-leads.json', []);
  return leads.filter((lead: any) => leadBelongsToVendor(lead, session));
}

async function syncLeadNotifications(session: NonNullable<Awaited<ReturnType<typeof getVendorSession>>>) {
  const [all, leads] = await Promise.all([readVendorNotifications(), readLeadsScoped(session)]);
  const scoped = scopeNotificationsForVendor(all, session);
  const refs = new Set(scoped.map((n) => n.refId).filter(Boolean) as string[]);
  let changed = false;
  for (const lead of leads) {
    const refId = `lead:${lead.id}`;
    if (refs.has(refId)) continue;
    const row: StoredVendorNotification = {
      id: `notif_${refId}_${Date.now()}`,
      vendorUserId: session.userId,
      vendorId: session.vendorId,
      type: 'lead',
      title: 'New lead',
      message: `${lead.coupleName || 'A couple'} — ${lead.serviceCategory || 'Inquiry'} (${lead.location || 'Location TBD'})`,
      timestamp: lead.timestamp || new Date().toISOString(),
      isRead: false,
      priority: 'high',
      actionUrl: '/vendor/leads',
      actionText: 'View leads',
      refId,
    };
    all.unshift(row);
    refs.add(refId);
    changed = true;
  }
  if (changed) {
    await writeVendorNotifications(all);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }
    await syncLeadNotifications(session);
    const all = await readVendorNotifications();
    const list = scopeNotificationsForVendor(all, session).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const total = list.length;
    const unread = list.filter((n) => !n.isRead).length;
    const byType = {
      lead: 0,
      booking: 0,
      review: 0,
      payment: 0,
      system: 0,
    };
    for (const n of list) {
      const k = (n.type in byType ? n.type : 'system') as keyof typeof byType;
      byType[k]++;
    }
    return NextResponse.json({
      success: true,
      data: list,
      stats: { total, unread, byType },
    });
  } catch (e) {
    console.error('GET /api/vendor/notifications:', e);
    return NextResponse.json({ success: false, error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }
    const body = await request.json();
    const type = (body.type || 'system') as StoredVendorNotification['type'];
    const title = String(body.title || 'Notification');
    const message = String(body.message || '');
    if (!message && !title) {
      return NextResponse.json({ success: false, error: 'title or message required' }, { status: 400 });
    }
    const row = await appendVendorNotification(session, {
      type,
      title,
      message: message || title,
      priority: body.priority || 'medium',
      actionUrl: body.actionUrl,
      actionText: body.actionText,
      refId: body.refId,
    });
    return NextResponse.json({ success: true, data: row }, { status: 201 });
  } catch (e) {
    console.error('POST /api/vendor/notifications:', e);
    return NextResponse.json({ success: false, error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }
    const body = await request.json();
    const action = String(body.action || '');
    const all = await readVendorNotifications();

    const ownedIndex = (id: string) =>
      all.findIndex(
        (n) =>
          n.id === id &&
          (String(n.vendorUserId || '') === session.userId ||
            String(n.vendorId || '') === session.vendorId),
      );

    if (action === 'markRead') {
      const id = String(body.id || '');
      const idx = ownedIndex(id);
      if (idx < 0) {
        return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
      }
      all[idx] = { ...all[idx], isRead: true };
      await writeVendorNotifications(all);
      return NextResponse.json({ success: true });
    }

    if (action === 'markAllRead') {
      const next = all.map((n) =>
        String(n.vendorUserId || '') === session.userId || String(n.vendorId || '') === session.vendorId
          ? { ...n, isRead: true }
          : n,
      );
      await writeVendorNotifications(next);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const id = String(body.id || '');
      const idx = ownedIndex(id);
      if (idx < 0) {
        return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
      }
      all.splice(idx, 1);
      await writeVendorNotifications(all);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('PATCH /api/vendor/notifications:', e);
    return NextResponse.json({ success: false, error: 'Failed to update notifications' }, { status: 500 });
  }
}
