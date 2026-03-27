'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  /** When omitted, the “vs last month” row is hidden (use for live totals). */
  trend?: {
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
    label?: string;
  };
  /** Shown under the value when `trend` is omitted (e.g. data source hint). */
  sublabel?: string;
}

export function StatCard({ title, value, icon, color, trend, sublabel }: StatCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-600',
          bgLight: 'bg-blue-100',
        };
      case 'green':
        return {
          bg: 'bg-green-500',
          text: 'text-green-600',
          bgLight: 'bg-green-100',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-600',
          bgLight: 'bg-yellow-100',
        };
      case 'red':
        return {
          bg: 'bg-red-500',
          text: 'text-red-600',
          bgLight: 'bg-red-100',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500',
          text: 'text-purple-600',
          bgLight: 'bg-purple-100',
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-gray-600',
          bgLight: 'bg-gray-100',
        };
    }
  };

  const getChangeIcon = (changeType: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return '↗️';
      case 'decrease':
        return '↘️';
      default:
        return '➡️';
    }
  };

  const getChangeColor = (changeType: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const colors = getColorClasses();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend ? (
            <div className={`flex items-center mt-2 ${getChangeColor(trend.changeType)}`}>
              <span className="text-sm font-medium">
                {getChangeIcon(trend.changeType)} {trend.change}
              </span>
              <span className="text-sm ml-1">{trend.label ?? 'vs last month'}</span>
            </div>
          ) : sublabel ? (
            <p className="text-xs text-gray-500 mt-2">{sublabel}</p>
          ) : null}
        </div>
        <div className={`p-3 rounded-full ${colors.bgLight}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export interface ChartSeriesPoint {
  label: string;
  value: number;
}

interface ChartWidgetProps {
  title: string;
  /** Monthly or categorical points; values are summed revenue (or similar). */
  series: ChartSeriesPoint[];
  loading?: boolean;
  valuePrefix?: string;
}

export function ChartWidget({
  title,
  series,
  loading,
  valuePrefix = '$',
}: ChartWidgetProps) {
  const formatVal = (n: number) =>
    n.toLocaleString(undefined, {
      maximumFractionDigits: n >= 1000 ? 0 : 2,
    });

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg text-gray-500 text-sm">
          Loading chart…
        </div>
      </div>
    );
  }

  const values = series.map((s) => s.value);
  const max = Math.max(1, ...values);
  const n = Math.max(1, series.length);
  const w = 560;
  const h = 220;
  const padL = 44;
  const padR = 12;
  const padT = 8;
  const padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const coords = series.map((s, i) => {
    const x = padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padT + innerH - (s.value / max) * innerH;
    return { x, y, ...s };
  });

  const lineD = coords.length
    ? coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
    : '';
  const areaD =
    coords.length >= 2
      ? `${lineD} L ${coords[coords.length - 1]!.x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${coords[0]!.x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
      : '';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <p className="text-xs text-gray-500 mb-2">
        Completed payment totals by month (last {series.length || 12} months)
      </p>
      {series.length === 0 ? (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg text-center text-gray-500 text-sm px-4">
          No months to display yet.
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg overflow-x-auto">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full h-64 min-w-[280px]"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(147 51 234)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="rgb(147 51 234)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = padT + innerH * (1 - t);
              return (
                <line
                  key={t}
                  x1={padL}
                  y1={y}
                  x2={padL + innerW}
                  y2={y}
                  stroke="rgb(229 231 235)"
                  strokeWidth="1"
                />
              );
            })}
            {areaD ? (
              <path d={areaD} fill="url(#revenueFill)" stroke="none" />
            ) : null}
            {lineD ? (
              <path
                d={lineD}
                fill="none"
                stroke="rgb(126 34 206)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {coords.map((c) => (
              <g key={c.label}>
                <circle cx={c.x} cy={c.y} r="4" fill="white" stroke="rgb(126 34 206)" strokeWidth="2" />
                <title>{`${c.label}: ${valuePrefix}${formatVal(c.value)}`}</title>
              </g>
            ))}
            {coords.map((c, i) => (
              <text
                key={`${c.label}-${i}-x`}
                x={c.x}
                y={h - 8}
                textAnchor="middle"
                fill="rgb(107 114 128)"
                style={{ fontSize: '10px' }}
              >
                {c.label}
              </text>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}

export interface RecentActivityItem {
  id: string;
  message: string;
  timestamp: string;
  avatarLetter: string;
}

interface RecentActivityProps {
  activities: RecentActivityItem[];
  loading?: boolean;
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <p className="text-xs text-gray-500 mb-3">
        Latest from audit logs, payments, bookings, and quotes
      </p>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-500">
          No recent events in the last dataset. Create bookings, quotes, or payments—or check{' '}
          <a href="/admin/audit-logs" className="text-primary-600 hover:underline">
            audit logs
          </a>
          .
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {activity.avatarLetter}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface QuickActionsProps {
  actions: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    href: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }>;
}

export function QuickActions({ actions }: QuickActionsProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 hover:bg-blue-100 border-blue-200';
      case 'green':
        return 'bg-green-50 hover:bg-green-100 border-green-200';
      case 'yellow':
        return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200';
      case 'red':
        return 'bg-red-50 hover:bg-red-100 border-red-200';
      case 'purple':
        return 'bg-purple-50 hover:bg-purple-100 border-purple-200';
      default:
        return 'bg-gray-50 hover:bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            className={`p-4 rounded-lg border transition-colors ${getColorClasses(action.color)}`}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{action.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{action.title}</p>
                <p className="text-xs text-gray-600">{action.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

interface SystemStatusProps {
  services: Array<{
    name: string;
    status: 'online' | 'offline' | 'warning';
    uptime: string;
  }>;
}

export function SystemStatus({ services }: SystemStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'offline':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
      <div className="space-y-3">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2">{getStatusIcon(service.status)}</span>
              <span className="text-sm font-medium text-gray-900">{service.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                {service.status}
              </span>
              <span className="text-xs text-gray-500">{service.uptime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


