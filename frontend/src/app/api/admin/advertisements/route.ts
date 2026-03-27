import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

function readAdvertisements() {
  return readDataFile<any>('advertisements.json', {
    bannerAds: [],
    adSenseConfig: {},
  });
}

function readClickEvents() {
  return readDataFile<any[]>('advertisement-click-events.json', []);
}

function readBlocklist() {
  return readDataFile<any[]>('advertisement-click-blocklist.json', []);
}

function normalizeAdSenseConfig(input: any) {
  const raw = input && typeof input === 'object' ? input : {};
  const slots = raw.adSlots && typeof raw.adSlots === 'object' ? raw.adSlots : {};
  const toNumber = (v: any) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    enabled: Boolean(raw.enabled),
    clientId: typeof raw.clientId === 'string' ? raw.clientId : '',
    publisherId: typeof raw.publisherId === 'string' ? raw.publisherId : '',
    testMode: raw.testMode === undefined ? true : Boolean(raw.testMode),
    adsTxtSnippet: typeof raw.adsTxtSnippet === 'string' ? raw.adsTxtSnippet : '',
    scriptTag: typeof raw.scriptTag === 'string' ? raw.scriptTag : '',
    adSlots: {
      header: typeof slots.header === 'string' ? slots.header : '',
      sidebar: typeof slots.sidebar === 'string' ? slots.sidebar : '',
      footer: typeof slots.footer === 'string' ? slots.footer : '',
      content: typeof slots.content === 'string' ? slots.content : '',
    },
    revenue: toNumber(raw.revenue),
    impressions: toNumber(raw.impressions),
    clicks: toNumber(raw.clicks),
  };
}

function safeDateMs(raw: unknown): number | null {
  if (raw == null) return null;
  const d = new Date(String(raw));
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function computeFraudAudit() {
  // This endpoint is only for the admin ads module.
  // We compute totals + breakdown from stored click events and active blocks.
  return Promise.all([readClickEvents(), readBlocklist()]).then(([clickEvents, blocklist]) => {
    const nowMs = Date.now();
    const day24Ms = 24 * 60 * 60 * 1000;
    const blockedEvents = (clickEvents || []).filter((ev: any) => ev?.blocked === true);

    const blockedLast24h = blockedEvents.filter((ev: any) => {
      const t = safeDateMs(ev?.timestamp);
      return t != null && nowMs - t <= day24Ms;
    }).length;

    const blockedAllTime = blockedEvents.length;

    const countBy = (arr: any[], key: (ev: any) => string) => {
      const m = new Map<string, number>();
      for (const ev of arr) {
        const k = key(ev) || 'unknown';
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return Array.from(m.entries())
        .map(([k, count]) => ({ key: k, count }))
        .sort((a, b) => b.count - a.count);
    };

    const topIps = countBy(blockedEvents, (ev: any) => String(ev?.ip || 'unknown'));
    const topFingerprints = countBy(blockedEvents, (ev: any) => String(ev?.fingerprint || 'unknown'));
    const byReason = countBy(blockedEvents, (ev: any) => String(ev?.blockReason || ev?.reason || 'unknown'));

    const recentBlocked = blockedEvents
      .slice()
      .sort((a: any, b: any) => {
        const ta = safeDateMs(a?.timestamp) ?? 0;
        const tb = safeDateMs(b?.timestamp) ?? 0;
        return tb - ta;
      })
      .slice(0, 40)
      .map((ev: any) => ({
        id: String(ev?.id || `blocked_${Date.now()}`),
        adId: String(ev?.adId || ''),
        vendorId: String(ev?.vendorId || ev?.vendorUserId || ''),
        ip: String(ev?.ip || 'unknown'),
        fingerprint: String(ev?.fingerprint || ''),
        reason: String(ev?.blockReason || ev?.reason || ''),
        timestamp: String(ev?.timestamp || ''),
      }));

    const activeBlocks = (blocklist || [])
      .filter((entry: any) => {
        const t = safeDateMs(entry?.expiresAt);
        return t != null && t > nowMs;
      })
      .slice(0, 50)
      .map((entry: any) => ({
        id: String(entry?.id || `blk_${Date.now()}_${Math.random()}`),
        type: entry?.type === 'fingerprint' ? 'fingerprint' : 'ip',
        value: String(entry?.value || ''),
        reason: String(entry?.reason || entry?.blockReason || ''),
        createdAt: String(entry?.createdAt || entry?.created || ''),
        expiresAt: String(entry?.expiresAt || ''),
      }));

    return {
      totals: {
        blockedAllTime,
        blockedLast24h,
      },
      topFingerprints,
      topIps,
      byReason,
      recentBlocked,
      activeBlocks,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = String(searchParams.get('type') || '');

    const advertisements = await readAdvertisements();

    if (type === 'bannerAds') {
      return NextResponse.json({
        success: true,
        data: advertisements.bannerAds || [],
      });
    }

    if (type === 'adSenseConfig') {
      return NextResponse.json({
        success: true,
        data: normalizeAdSenseConfig(advertisements.adSenseConfig),
      });
    }

    if (type === 'fraudAudit') {
      const fraudAudit = await computeFraudAudit();
      return NextResponse.json({
        success: true,
        data: fraudAudit,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type parameter' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error in GET /api/admin/advertisements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advertisements' },
      { status: 500 },
    );
  }
}
