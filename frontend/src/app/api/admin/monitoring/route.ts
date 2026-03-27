import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { readDataFile } from '@/lib/dataFileStore';

type HealthStatus = 'healthy' | 'warning' | 'critical';

function getAuthToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies.get('accessToken')?.value || null;
}

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = getAuthToken(request);
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (String(user.role || '').toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

function toArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function parseRangeDays(range: string | null): number {
  if (range === '1d') return 1;
  if (range === '30d') return 30;
  if (range === '90d') return 90;
  return 7;
}

function parseDate(raw: unknown): Date | null {
  if (raw == null) return null;
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickDate(obj: any, keys: string[]): Date | null {
  for (const k of keys) {
    const d = parseDate(obj?.[k]);
    if (d) return d;
  }
  return null;
}

function isInWindow(raw: unknown, start: Date): boolean {
  const d = parseDate(raw);
  return !!d && d.getTime() >= start.getTime();
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Number(n.toFixed(1));
}

function healthFromUptime(uptime: number): HealthStatus {
  if (uptime >= 99.5) return 'healthy';
  if (uptime >= 98.5) return 'warning';
  return 'critical';
}

function healthFromResponse(responseTime: number): HealthStatus {
  if (responseTime < 300) return 'healthy';
  if (responseTime < 600) return 'warning';
  return 'critical';
}

function relativeTime(raw: unknown): string {
  const d = parseDate(raw);
  if (!d) return 'Unknown';
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

async function buildMonitoringSnapshot(range: string | null) {
  const days = parseRangeDays(range);
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setDate(now.getDate() - days);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [vendorsRaw, walletsRaw, transactionsRaw, leadsRaw, quotesRaw, paymentsRaw, auditRaw, clickEventsRaw, monitoringRaw] =
    await Promise.all([
      readDataFile<any>('vendors.json', []),
      readDataFile<any>('vendor-credit-wallets.json', []),
      readDataFile<any>('vendor-credit-transactions.json', []),
      readDataFile<any>('vendor-leads.json', []),
      readDataFile<any>('quotes.json', []),
      readDataFile<any>('payments.json', []),
      readDataFile<any>('audit-logs.json', []),
      readDataFile<any>('advertisement-click-events.json', []),
      readDataFile<any>('system-monitoring.json', {}),
    ]);

  const vendors = toArray(vendorsRaw);
  const wallets = toArray(walletsRaw);
  const transactions = toArray(transactionsRaw);
  const leads = toArray(leadsRaw);
  const quotes = toArray(quotesRaw);
  const payments = toArray(paymentsRaw);
  const audits = toArray(auditRaw);
  const clickEvents = toArray(clickEventsRaw);
  const monitoring = monitoringRaw && typeof monitoringRaw === 'object' ? monitoringRaw : {};

  let activeUsers = 0;
  try {
    activeUsers = await prisma.user.count();
  } catch (error) {
    console.error('monitoring: user count failed', error);
  }

  const activeVendors = vendors.filter((v: any) => {
    const status = String(v?.status || 'approved').toLowerCase();
    return !['suspended', 'rejected', 'banned', 'inactive'].includes(status);
  }).length;

  const creditsUsedToday = transactions.reduce((sum: number, tx: any) => {
    const type = String(tx?.type || '').toLowerCase();
    const source = String(tx?.source || '').toLowerCase();
    if (!(type === 'usage' || source === 'ad_click')) return sum;
    if (!isInWindow(tx?.timestamp, todayStart)) return sum;
    const amount = Number(tx?.amount || 0);
    return sum + Math.abs(amount);
  }, 0);

  const leadsInRange = leads.filter((lead: any) =>
    isInWindow(lead?.createdAt || lead?.timestamp || lead?.date, rangeStart)
  ).length;
  const quoteLeadsInRange = quotes.filter((quote: any) =>
    isInWindow(quote?.requestDate || quote?.createdAt || quote?.updatedAt, rangeStart)
  ).length;
  const leadsGenerated = leadsInRange + quoteLeadsInRange;

  const rawResponse = Number((monitoring as any)?.metrics?.responseTime ?? 245);
  const responseTime = Number.isFinite(rawResponse) ? rawResponse : 245;
  const rawUptime = Number((monitoring as any)?.metrics?.systemUptime ?? 99.8);
  const systemUptime = Number.isFinite(rawUptime) ? rawUptime : 99.8;

  const vendorActivitiesFromAudit = audits
    .filter((log: any) => isInWindow(log?.timestamp, rangeStart))
    .map((log: any, index: number) => {
      const action = String(log?.action || 'Activity');
      const resource = String(log?.resource || '').trim();
      const details = String(log?.details || '').trim();
      const actor = String(log?.user || log?.vendorName || 'System');
      const lc = `${action} ${resource} ${details}`.toLowerCase();
      let impact: 'low' | 'medium' | 'high' = 'low';
      if (lc.includes('delete') || lc.includes('suspend') || lc.includes('failed') || lc.includes('error')) {
        impact = 'high';
      } else if (lc.includes('update') || lc.includes('payment') || lc.includes('credit')) {
        impact = 'medium';
      }
      return {
        id: String(log?.id || `act_${index}_${Date.now()}`),
        sortAt: parseDate(log?.timestamp)?.getTime() || 0,
        vendorName: actor,
        action,
        timestamp: relativeTime(log?.timestamp),
        details: details || (resource ? `Resource: ${resource}` : 'No additional details'),
        impact,
      };
    });

  const vendorActivitiesFromTransactions = transactions
    .filter((tx: any) => isInWindow(tx?.timestamp, rangeStart))
    .map((tx: any, index: number) => {
      const amount = Math.abs(Number(tx?.amount || 0));
      const source = String(tx?.source || tx?.type || 'transaction');
      const vendorName = String(tx?.email || tx?.vendorId || tx?.vendorUserId || 'Vendor');
      const details = amount > 0 ? `Amount: ${amount} credits` : 'Amount not available';
      const lc = source.toLowerCase();
      const impact: 'low' | 'medium' | 'high' = lc.includes('ad_click') || lc.includes('usage') ? 'medium' : 'low';
      return {
        id: String(tx?.id || `tx_act_${index}_${Date.now()}`),
        sortAt: parseDate(tx?.timestamp)?.getTime() || 0,
        vendorName,
        action: `Credit ${source}`,
        timestamp: relativeTime(tx?.timestamp),
        details,
        impact,
      };
    });

  const vendorActivitiesFromClicks = clickEvents
    .filter((ev: any) => !ev?.blocked && isInWindow(ev?.timestamp, rangeStart))
    .map((ev: any, index: number) => ({
      id: String(ev?.id || `click_act_${index}_${Date.now()}`),
      sortAt: parseDate(ev?.timestamp)?.getTime() || 0,
      vendorName: String(ev?.vendorId || ev?.vendorUserId || 'Vendor'),
      action: 'Ad click charged',
      timestamp: relativeTime(ev?.timestamp),
      details: `Charge: ${Number(ev?.charge || 0)} credits`,
      impact: 'medium' as const,
    }));

  const vendorActivitiesFromLeads = leads
    .filter((lead: any) => isInWindow(lead?.createdAt || lead?.timestamp || lead?.date, rangeStart))
    .map((lead: any, index: number) => {
      const when = lead?.createdAt || lead?.timestamp || lead?.date;
      return {
        id: String(lead?.id || `lead_act_${index}_${Date.now()}`),
        sortAt: parseDate(when)?.getTime() || 0,
        vendorName: String(lead?.vendorName || lead?.vendor || lead?.vendorId || 'Vendor'),
        action: 'New lead received',
        timestamp: relativeTime(when),
        details: String(lead?.serviceType || lead?.category || 'Lead captured'),
        impact: 'low' as const,
      };
    });

  const vendorActivitiesFromQuotes = quotes
    .filter((quote: any) => isInWindow(quote?.requestDate || quote?.createdAt || quote?.updatedAt, rangeStart))
    .map((quote: any, index: number) => {
      const when = quote?.requestDate || quote?.createdAt || quote?.updatedAt;
      return {
        id: String(quote?.id || `quote_act_${index}_${Date.now()}`),
        sortAt: parseDate(when)?.getTime() || 0,
        vendorName: String(quote?.vendorName || quote?.vendor || quote?.vendorId || 'Vendor'),
        action: 'Quote request received',
        timestamp: relativeTime(when),
        details: String(quote?.serviceType || quote?.eventType || 'Quote submitted'),
        impact: 'low' as const,
      };
    });

  const vendorActivitiesFromPayments = payments
    .filter((payment: any) => isInWindow(payment?.createdAt || payment?.updatedAt || payment?.transactionDate, rangeStart))
    .map((payment: any, index: number) => {
      const when = payment?.createdAt || payment?.updatedAt || payment?.transactionDate;
      const amount = Number(payment?.amount || 0);
      const customer = String(payment?.customerName || payment?.customer || payment?.userName || 'User');
      const vendorName = String(payment?.vendorName || payment?.vendor || payment?.vendorId || 'Vendor');
      const status = String(payment?.status || 'completed').toLowerCase();
      const service = String(payment?.serviceType || payment?.serviceName || payment?.category || 'Service');
      return {
        id: String(payment?.id || `payment_act_${index}_${Date.now()}`),
        sortAt: parseDate(when)?.getTime() || 0,
        vendorName,
        action: status === 'completed' ? 'User payment received' : `User payment ${status}`,
        timestamp: relativeTime(when),
        details: `${customer} paid $${amount.toFixed(2)} for ${service}`,
        impact: status === 'completed' ? ('high' as const) : ('medium' as const),
      };
    });

  const vendorActivities = [
    ...vendorActivitiesFromAudit,
    ...vendorActivitiesFromTransactions,
    ...vendorActivitiesFromClicks,
    ...vendorActivitiesFromLeads,
    ...vendorActivitiesFromQuotes,
    ...vendorActivitiesFromPayments,
  ]
    .sort((a: any, b: any) => Number(b.sortAt || 0) - Number(a.sortAt || 0))
    .slice(0, 25)
    .map(({ sortAt, ...activity }) => activity);

  const vendorCreditUsage = wallets
    .map((wallet: any) => {
      const vendorId = String(wallet?.vendorId || wallet?.key || '');
      const vendorUserId = String(wallet?.vendorUserId || '');
      const email = String(wallet?.email || '').toLowerCase();
      const matchingTx = transactions.filter((tx: any) => {
        const txVendorId = String(tx?.vendorId || tx?.key || '');
        const txVendorUserId = String(tx?.vendorUserId || '');
        const txEmail = String(tx?.email || '').toLowerCase();
        const inRange = isInWindow(tx?.timestamp, rangeStart);
        return inRange && (
          (vendorId && txVendorId === vendorId) ||
          (vendorUserId && txVendorUserId === vendorUserId) ||
          (email && txEmail === email)
        );
      });
      const creditsUsed = matchingTx.reduce((sum: number, tx: any) => sum + Math.abs(Number(tx?.amount || 0)), 0);
      const creditsRemaining = Number(wallet?.currentCredits || 0);
      const denominator = creditsUsed + Math.max(creditsRemaining, 0);
      const usagePercentage = denominator > 0 ? clampPercent((creditsUsed / denominator) * 100) : 0;
      const vendorName =
        String(wallet?.vendorName || '').trim() ||
        String(wallet?.email || '').trim() ||
        String(vendorId || 'Unknown Vendor');
      const lastUsedDate = matchingTx
        .map((tx: any) => parseDate(tx?.timestamp))
        .filter((d: Date | null): d is Date => !!d)
        .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];
      return {
        vendorId: vendorId || `wallet_${vendorUserId || email || Math.random()}`,
        vendorName,
        creditsUsed: Number(creditsUsed.toFixed(2)),
        creditsRemaining: Number(creditsRemaining.toFixed(2)),
        usagePercentage,
        lastUsed: lastUsedDate ? relativeTime(lastUsedDate.toISOString()) : 'No usage',
      };
    })
    .sort((a: any, b: any) => b.creditsUsed - a.creditsUsed)
    .slice(0, 10);

  const leadGenerationByVendor = new Map<string, { vendorName: string; leads: number; revenue: number }>();
  const addLead = (key: string, name: string, count = 1, revenue = 0) => {
    const current = leadGenerationByVendor.get(key) || { vendorName: name || key, leads: 0, revenue: 0 };
    current.leads += count;
    current.revenue += revenue;
    if (name) current.vendorName = name;
    leadGenerationByVendor.set(key, current);
  };

  for (const lead of leads) {
    const d = pickDate(lead, ['createdAt', 'timestamp', 'date']);
    if (!d || d.getTime() < rangeStart.getTime()) continue;
    const key = String(lead?.vendorId || lead?.vendorUserId || lead?.vendorEmail || 'unknown');
    const name = String(lead?.vendorName || lead?.vendor || key);
    addLead(key, name, 1, Number(lead?.value || 0));
  }
  for (const quote of quotes) {
    const d = pickDate(quote, ['requestDate', 'createdAt', 'updatedAt']);
    if (!d || d.getTime() < rangeStart.getTime()) continue;
    const key = String(quote?.vendorId || quote?.vendorUserId || quote?.vendorEmail || quote?.vendorName || 'unknown');
    const name = String(quote?.vendorName || quote?.vendor || key);
    addLead(key, name, 1, Number(quote?.amount || 0));
  }

  const leadGeneration = Array.from(leadGenerationByVendor.entries())
    .map(([vendorId, row]) => {
      const conversions = Math.max(1, Math.round(row.leads * 0.35));
      return {
        vendorId,
        vendorName: row.vendorName,
        leadsGenerated: row.leads,
        conversionRate: clampPercent((conversions / Math.max(row.leads, 1)) * 100),
        revenue: Number(row.revenue.toFixed(2)),
        period: `Last ${days} days`,
      };
    })
    .sort((a, b) => b.leadsGenerated - a.leadsGenerated)
    .slice(0, 10);

  const apiUptime = Number((monitoring as any)?.systemHealth?.apiGateway?.uptime ?? systemUptime);
  const dbUptime = Number((monitoring as any)?.systemHealth?.database?.uptime ?? systemUptime);
  const paymentUptime = Number((monitoring as any)?.systemHealth?.paymentService?.uptime ?? 98.5);
  const emailUptime = Number((monitoring as any)?.systemHealth?.emailService?.uptime ?? 99.7);

  return {
    lastUpdated: now.toISOString(),
    metrics: {
      activeVendors,
      activeUsers,
      creditsUsedToday: Number(creditsUsedToday.toFixed(2)),
      leadsGenerated,
      systemUptime: Number(systemUptime.toFixed(2)),
      responseTime,
    },
    systemHealth: {
      apiGateway: { status: healthFromUptime(apiUptime), uptime: Number(apiUptime.toFixed(2)) },
      database: { status: healthFromUptime(dbUptime), uptime: Number(dbUptime.toFixed(2)) },
      paymentService: { status: healthFromUptime(paymentUptime), uptime: Number(paymentUptime.toFixed(2)) },
      emailService: { status: healthFromUptime(emailUptime), uptime: Number(emailUptime.toFixed(2)) },
      response: { status: healthFromResponse(responseTime), responseTime },
    },
    vendorActivities,
    creditUsage: vendorCreditUsage,
    leadGeneration,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const range = searchParams.get('range');
    const data = await buildMonitoringSnapshot(range);
    
    if (type === 'metrics') {
      return NextResponse.json({
        success: true,
        data: data.metrics
      });
    } else if (type === 'systemHealth') {
      return NextResponse.json({
        success: true,
        data: data.systemHealth
      });
    } else if (type === 'vendorActivities') {
      return NextResponse.json({
        success: true,
        data: data.vendorActivities
      });
    } else if (type === 'creditUsage') {
      return NextResponse.json({
        success: true,
        data: data.creditUsage
      });
    } else if (type === 'leadGeneration') {
      return NextResponse.json({
        success: true,
        data: data.leadGeneration
      });
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch monitoring data'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const action = String(body?.action || '');
    const range = String(body?.range || '7d');

    if (action === 'refresh') {
      const updatedData = await buildMonitoringSnapshot(range);
      return NextResponse.json({
        success: true,
        data: updatedData,
        message: 'Monitoring data refreshed successfully'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
  } catch (error) {
    console.error('Error updating monitoring data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update monitoring data'
    }, { status: 500 });
  }
}
