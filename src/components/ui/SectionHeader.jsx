import React from 'react';

export default function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      {action && (
        <button 
          onClick={onAction}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
        >
          {action}
        </button>
      )}
    </div>
  );
}