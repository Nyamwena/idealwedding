'use client';

import React from 'react';

interface AdminLoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AdminLoadingState({ message = 'Loading...', size = 'md' }: AdminLoadingStateProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          spinner: 'h-6 w-6',
          text: 'text-sm',
        };
      case 'lg':
        return {
          spinner: 'h-16 w-16',
          text: 'text-lg',
        };
      default:
        return {
          spinner: 'h-12 w-12',
          text: 'text-base',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses.spinner}`}></div>
      <p className={`mt-4 text-gray-600 ${sizeClasses.text}`}>{message}</p>
    </div>
  );
}

export function AdminTableLoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 py-4">
          <div className="flex-shrink-0">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="flex-shrink-0">
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="flex-shrink-0">
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminCardLoadingState() {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}


