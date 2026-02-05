import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function ListItem({ 
  title, 
  subtitle, 
  value, 
  valueSubtitle,
  icon: Icon, 
  iconBg = 'bg-gray-100',
  onClick,
  badge,
  badgeColor = 'bg-gray-100 text-gray-700'
}) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between py-3.5 px-4 bg-white ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {Icon && (
          <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
        {value && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{value}</p>
            {valueSubtitle && (
              <p className="text-xs text-gray-500">{valueSubtitle}</p>
            )}
          </div>
        )}
        {onClick && (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </div>
  );
}