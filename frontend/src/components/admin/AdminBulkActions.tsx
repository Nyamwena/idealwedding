'use client';

import React from 'react';

interface BulkAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  type?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

interface AdminBulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  actions: BulkAction[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  isVisible: boolean;
}

export function AdminBulkActions({
  selectedItems,
  totalItems,
  actions,
  onSelectAll,
  onClearSelection,
  isVisible,
}: AdminBulkActionsProps) {
  if (!isVisible || selectedItems.length === 0) return null;

  const getActionStyles = (type: string = 'secondary') => {
    switch (type) {
      case 'primary':
        return 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
      default:
        return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500';
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-96">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {selectedItems.length} of {totalItems} selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Select All
            </button>
            <button
              onClick={onClearSelection}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Clear
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              disabled={action.disabled}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${getActionStyles(action.type)} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="mr-2">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


