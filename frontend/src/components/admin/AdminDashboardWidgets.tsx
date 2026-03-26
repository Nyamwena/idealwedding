'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export function StatCard({ title, value, change, changeType, icon, color }: StatCardProps) {
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

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return '↗️';
      case 'decrease':
        return '↘️';
      default:
        return '➡️';
    }
  };

  const getChangeColor = () => {
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
          <div className={`flex items-center mt-2 ${getChangeColor()}`}>
            <span className="text-sm font-medium">{getChangeIcon()} {change}</span>
            <span className="text-sm ml-1">vs last month</span>
          </div>
        </div>
        <div className={`p-3 rounded-full ${colors.bgLight}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

interface ChartWidgetProps {
  title: string;
  data: any[];
  type: 'line' | 'bar' | 'pie';
}

export function ChartWidget({ title, data, type }: ChartWidgetProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500">Chart placeholder</p>
          <p className="text-sm text-gray-400">Integration with Chart.js or similar</p>
        </div>
      </div>
    </div>
  );
}

interface RecentActivityProps {
  activities: Array<{
    id: string;
    user: string;
    action: string;
    resource: string;
    timestamp: string;
    avatar?: string;
  }>;
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {activity.user[0]}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user}</span> {activity.action.toLowerCase()}{' '}
                <span className="font-medium">{activity.resource}</span>
              </p>
              <p className="text-xs text-gray-500">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
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


