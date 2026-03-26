import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import jwt from 'jsonwebtoken';

// Helper function to read advertisements
function readAdvertisements() {
  return readDataFile<any>('advertisements.json', {
    bannerAds: [],
    adSenseConfig: {
      enabled: false,
      clientId: '',
      publisherId: '',
      testMode: true,
      adSlots: {
        header: '',
        sidebar: '',
        footer: '',
        content: ''
      },
      adsTxtSnippet: '',
      scriptTag: '',
      revenue: 0,
      impressions: 0,
      clicks: 0,
      lastUpdated: new Date().toISOString()
    }
  });
}

// Helper function to write advertisements
function writeAdvertisements(data: any) {
  return writeDataFile('advertisements.json', data);
}
function readClickEvents() {
  return readDataFile<any[]>('advertisement-click-events.json', []);
}
function readBlocklist() {
  return readDataFile<any[]>('advertisement-click-blocklist.json', []);
}
function writeBlocklist(data: any[]) {
  return writeDataFile('advertisement-click-blocklist.json', data);
}

function getAuthToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get('token')?.value || null;
}

function requireAdmin(request: NextRequest): NextResponse | null {
  const token = getAuthToken(request);
  if (!token || !process.env.JWT_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as { role?: string };
    if (String(payload.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const data = await readAdvertisements();
    
    if (type === 'bannerAds') {
      const ranked = (data.bannerAds || []).slice().sort((a: any, b: any) => {
        const bidDelta = Number(b.bidPerClick || 0) - Number(a.bidPerClick || 0);
        if (bidDelta !== 0) return bidDelta;
        return Number(b.ctr || 0) - Number(a.ctr || 0);
      });
      return NextResponse.json({
        success: true,
        data: ranked
      });
    } else if (type === 'adSenseConfig') {
      return NextResponse.json({
        success: true,
        data: data.adSenseConfig || {
          enabled: false,
          clientId: '',
          publisherId: '',
          testMode: true,
          adSlots: { header: '', sidebar: '', footer: '', content: '' },
          adsTxtSnippet: '',
          scriptTag: '',
          revenue: 0,
          impressions: 0,
          clicks: 0,
          lastUpdated: new Date().toISOString(),
        }
      });
    } else if (type === 'fraudAudit') {
      const [clickEvents, blocklist] = await Promise.all([readClickEvents(), readBlocklist()]);
      const blocked = clickEvents.filter((ev: any) => Boolean(ev.blocked));
      const now = Date.now();
      const last24hBlocked = blocked.filter(
        (ev: any) => now - new Date(ev.timestamp).getTime() <= 24 * 60 * 60 * 1000,
      );
      const activeBlocks = blocklist
        .filter((entry: any) => new Date(entry.expiresAt || 0).getTime() > now)
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 50);

      const groupCounts = (items: any[], keyFn: (x: any) => string) => {
        const map = new Map<string, number>();
        items.forEach((item) => {
          const key = keyFn(item);
          if (!key) return;
          map.set(key, (map.get(key) || 0) + 1);
        });
        return Array.from(map.entries())
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count);
      };

      const topFingerprints = groupCounts(last24hBlocked, (e) => String(e.fingerprint || '')).slice(0, 10);
      const topIps = groupCounts(last24hBlocked, (e) => String(e.ip || '')).slice(0, 10);
      const byReason = groupCounts(last24hBlocked, (e) => String(e.blockReason || 'unknown'));
      const recentBlocked = blocked
        .slice()
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 25)
        .map((ev: any) => ({
          id: ev.id,
          adId: ev.adId,
          vendorId: ev.vendorId || '',
          ip: ev.ip || '',
          fingerprint: ev.fingerprint || '',
          reason: ev.blockReason || 'unknown',
          timestamp: ev.timestamp,
        }));

      return NextResponse.json({
        success: true,
        data: {
          totals: {
            blockedAllTime: blocked.length,
            blockedLast24h: last24hBlocked.length,
          },
          topFingerprints,
          topIps,
          byReason,
          recentBlocked,
          activeBlocks,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch advertisements'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { type, ...data } = body;
    
    const advertisements = await readAdvertisements();
    
    if (type === 'bannerAd') {
      const bidPerClick = Number(data.bidPerClick || data.cost || 0);
      const maxDailyBudget = Number(data.maxDailyBudget || 0);
      if (bidPerClick <= 0) {
        return NextResponse.json(
          { success: false, error: 'bidPerClick/cost must be greater than zero' },
          { status: 400 },
        );
      }
      if (maxDailyBudget > 0 && maxDailyBudget < bidPerClick) {
        return NextResponse.json(
          { success: false, error: 'maxDailyBudget must be 0 (unlimited) or >= bidPerClick' },
          { status: 400 },
        );
      }
      const newAd = {
        id: `a${Date.now()}`,
        ...data,
        vendorId: data.vendorId || null,
        vendorUserId: data.vendorUserId || null,
        bidPerClick,
        maxDailyBudget,
        totalSpent: Number(data.totalSpent || 0),
        clicks: 0,
        impressions: 0,
        ctr: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      advertisements.bannerAds = advertisements.bannerAds || [];
      advertisements.bannerAds.unshift(newAd);
      
      await writeAdvertisements(advertisements);
      
      return NextResponse.json({
        success: true,
        data: newAd,
        message: 'Banner ad created successfully'
      });
    } else if (type === 'adSenseConfig') {
      const publisherId = String(data.publisherId || '').trim();
      const clientId = String(data.clientId || '').trim();
      const effectivePublisherId = publisherId || clientId.replace(/^ca-pub-/, '');
      const effectiveClientId = clientId || (effectivePublisherId ? `ca-pub-${effectivePublisherId}` : '');

      advertisements.adSenseConfig = {
        ...advertisements.adSenseConfig,
        ...data,
        publisherId: effectivePublisherId,
        clientId: effectiveClientId,
        scriptTag: effectiveClientId
          ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${effectiveClientId}" crossorigin="anonymous"></script>`
          : '',
        adsTxtSnippet: effectivePublisherId
          ? `google.com, ${effectivePublisherId}, DIRECT, f08c47fec0942fa0`
          : '',
        lastUpdated: new Date().toISOString()
      };
      
      await writeAdvertisements(advertisements);
      
      return NextResponse.json({
        success: true,
        data: advertisements.adSenseConfig,
        message: 'AdSense configuration updated successfully'
      });
    } else if (type === 'blockClickSource') {
      const sourceType = String(data.sourceType || '').toLowerCase();
      const value = String(data.value || '').trim();
      const durationHours = Math.max(1, Number(data.durationHours || 24));
      if (!['ip', 'fingerprint'].includes(sourceType) || !value) {
        return NextResponse.json(
          { success: false, error: 'sourceType (ip|fingerprint) and value are required' },
          { status: 400 },
        );
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();
      const blocklist = await readBlocklist();
      const activeOrFuture = blocklist.filter(
        (entry: any) => new Date(entry.expiresAt || 0).getTime() > now.getTime(),
      );
      const withoutDuplicate = activeOrFuture.filter(
        (entry: any) =>
          !(String(entry.type || '') === sourceType && String(entry.value || '') === value),
      );
      const newEntry = {
        id: `blk_${Date.now()}`,
        type: sourceType,
        value,
        reason: String(data.reason || 'manual_admin_block'),
        createdAt: now.toISOString(),
        expiresAt,
      };
      withoutDuplicate.unshift(newEntry);
      await writeBlocklist(withoutDuplicate);

      return NextResponse.json({
        success: true,
        data: newEntry,
        message: `Blocked ${sourceType} for ${durationHours}h`,
      });
    } else if (type === 'unblockClickSource') {
      const blockId = String(data.blockId || '').trim();
      const sourceType = String(data.sourceType || '').toLowerCase();
      const value = String(data.value || '').trim();

      if (!blockId && (!['ip', 'fingerprint'].includes(sourceType) || !value)) {
        return NextResponse.json(
          { success: false, error: 'Provide blockId or sourceType/value to unblock' },
          { status: 400 },
        );
      }

      const blocklist = await readBlocklist();
      const next = blocklist.filter((entry: any) => {
        if (blockId) return String(entry.id || '') !== blockId;
        return !(
          String(entry.type || '') === sourceType &&
          String(entry.value || '') === value
        );
      });

      if (next.length === blocklist.length) {
        return NextResponse.json(
          { success: false, error: 'Block entry not found' },
          { status: 404 },
        );
      }

      await writeBlocklist(next);
      return NextResponse.json({
        success: true,
        message: 'Block removed successfully',
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid type'
    }, { status: 400 });
  } catch (error) {
    console.error('Error creating/updating advertisement:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create/update advertisement'
    }, { status: 500 });
  }
}
