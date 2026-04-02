import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import type { VendorSession } from '@/lib/vendorSession';

export type StoredVendorNotification = {
  id: string;
  vendorUserId: string;
  vendorId: string;
  type: 'lead' | 'booking' | 'review' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
  /** e.g. lead:${leadId} for deduplication / sync */
  refId?: string;
};

export async function readVendorNotifications(): Promise<StoredVendorNotification[]> {
  return readDataFile<StoredVendorNotification[]>('vendor-notifications.json', []);
}

export async function writeVendorNotifications(items: StoredVendorNotification[]) {
  await writeDataFile('vendor-notifications.json', items);
}

export function scopeNotificationsForVendor(
  items: StoredVendorNotification[],
  session: VendorSession,
): StoredVendorNotification[] {
  return items.filter(
    (n) =>
      String(n.vendorUserId || '') === session.userId ||
      String(n.vendorId || '') === session.vendorId,
  );
}

export async function appendVendorNotification(
  session: VendorSession,
  partial: Omit<
    StoredVendorNotification,
    'id' | 'vendorUserId' | 'vendorId' | 'isRead' | 'timestamp'
  > &
    Partial<Pick<StoredVendorNotification, 'id' | 'timestamp' | 'isRead'>>,
): Promise<StoredVendorNotification> {
  const all = await readVendorNotifications();
  const row: StoredVendorNotification = {
    id: partial.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    vendorUserId: session.userId,
    vendorId: session.vendorId,
    isRead: partial.isRead ?? false,
    timestamp: partial.timestamp || new Date().toISOString(),
    type: partial.type,
    title: partial.title,
    message: partial.message,
    priority: partial.priority,
    actionUrl: partial.actionUrl,
    actionText: partial.actionText,
    refId: partial.refId,
  };
  all.unshift(row);
  await writeVendorNotifications(all);
  return row;
}
