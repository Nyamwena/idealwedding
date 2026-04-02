import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { createDefaultProfileForVendor } from '@/lib/vendorProfileDefaults';
import { findVendorProfileIndex } from '@/lib/vendorProfileScope';

export const dynamic = 'force-dynamic';

type VendorUiSettings = {
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    newBookingAlerts: boolean;
    quoteRequestAlerts: boolean;
    paymentAlerts: boolean;
    reviewAlerts: boolean;
  };
  privacy: {
    showContactInfo: boolean;
    showPricing: boolean;
    allowDirectContact: boolean;
    showAvailability: boolean;
  };
  business: {
    autoAcceptBookings: boolean;
    requireDeposit: boolean;
    depositPercentage: number;
    cancellationPolicy: string;
    refundPolicy: string;
  };
  account: {
    email: string;
    phone: string;
    timezone: string;
    currency: string;
    language: string;
  };
};

function defaultSettings(profile: any, sessionEmail: string): VendorUiSettings {
  const s = profile?.settings || {};
  return {
    notifications: {
      emailNotifications: s.leadNotificationEmail !== false,
      smsNotifications: Boolean(s.leadNotificationSMS),
      pushNotifications: true,
      newBookingAlerts: true,
      quoteRequestAlerts: true,
      paymentAlerts: true,
      reviewAlerts: true,
    },
    privacy: {
      showContactInfo: s.profileVisibility === 'public' || s.profileVisibility == null,
      showPricing: s.showPricing !== false,
      allowDirectContact: s.allowDirectBooking !== false,
      showAvailability: true,
    },
    business: {
      autoAcceptBookings: Boolean(s.autoAcceptLeads),
      requireDeposit: true,
      depositPercentage: 50,
      cancellationPolicy:
        'Describe your cancellation terms here (e.g. refunds by days before the event).',
      refundPolicy: 'Describe how and when you process refunds.',
    },
    account: {
      email: String(profile?.contactInfo?.email || sessionEmail || ''),
      phone: String(profile?.contactInfo?.phone || ''),
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'en',
    },
  };
}

function mergeSettingsIntoProfile(profile: any, ui: VendorUiSettings) {
  const contactInfo = {
    ...(profile.contactInfo || {}),
    email: ui.account.email,
    phone: ui.account.phone,
  };
  const settings = {
    ...(profile.settings || {}),
    autoAcceptLeads: ui.business.autoAcceptBookings,
    leadNotificationEmail: ui.notifications.emailNotifications,
    leadNotificationSMS: ui.notifications.smsNotifications,
    showPricing: ui.privacy.showPricing,
    allowDirectBooking: ui.privacy.allowDirectContact,
    profileVisibility: ui.privacy.showContactInfo ? 'public' : 'private',
  };
  return {
    ...profile,
    contactInfo,
    settings,
    vendorUiSettings: ui,
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const profiles = await readDataFile<any[]>('vendor-profiles.json', []);
    let profile = profiles[findVendorProfileIndex(profiles, session)];

    if (!profile) {
      const data = defaultSettings(
        { settings: {}, contactInfo: { email: session.email } },
        session.email,
      );
      return NextResponse.json({ success: true, data });
    }

    const defaults = defaultSettings(profile, session.email);
    const saved = profile.vendorUiSettings || {};
    const data: VendorUiSettings = {
      notifications: { ...defaults.notifications, ...(saved.notifications || {}) },
      privacy: { ...defaults.privacy, ...(saved.privacy || {}) },
      business: { ...defaults.business, ...(saved.business || {}) },
      account: { ...defaults.account, ...(saved.account || {}) },
    };

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('GET /api/vendor/settings:', e);
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getVendorSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized vendor access' }, { status: 401 });
    }

    const body = await request.json() as Partial<VendorUiSettings>;
    const profiles = await readDataFile<any[]>('vendor-profiles.json', []);
    let idx = findVendorProfileIndex(profiles, session);
    if (idx < 0) {
      const created = createDefaultProfileForVendor(session.userId, session.email);
      profiles.push(created);
      idx = profiles.length - 1;
    }

    const current = profiles[idx];
    const base = current.vendorUiSettings || defaultSettings(current, session.email);
    const merged: VendorUiSettings = {
      notifications: { ...base.notifications, ...(body.notifications || {}) },
      privacy: { ...base.privacy, ...(body.privacy || {}) },
      business: { ...base.business, ...(body.business || {}) },
      account: { ...base.account, ...(body.account || {}) },
    };

    profiles[idx] = mergeSettingsIntoProfile(current, merged);
    await writeDataFile('vendor-profiles.json', profiles);

    return NextResponse.json({ success: true, data: merged });
  } catch (e) {
    console.error('PUT /api/vendor/settings:', e);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
