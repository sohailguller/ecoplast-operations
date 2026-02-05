import React from 'react';
import { Button } from '@/components/ui/button';

export default function PageHeader({ title, subtitle, action, actionIcon: ActionIcon, onAction }) {
  return (
    <div className="px-4 pt-2 pb-4 bg-white border-b border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && (
          <Button 
            onClick={onAction}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-9 px-3"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4 mr-1.5" />}
            {action}
          </Button>
        )}
      </div>
    </div>
  );
}