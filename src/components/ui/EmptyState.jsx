import React from 'react';
import { Button } from '@/components/ui/button';

export default function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="p-4 bg-gray-100 rounded-2xl mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-base font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>
      )}
      {action && (
        <Button 
          onClick={onAction}
          className="mt-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
        >
          {action}
        </Button>
      )}
    </div>
  );
}