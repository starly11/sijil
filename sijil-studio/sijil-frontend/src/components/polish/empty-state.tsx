'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      {icon && <div className="mb-4 text-gray-400 dark:text-gray-600">
        {icon}
      </div>}
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>}
      {action && <div>{action}</div>}
    </div>
  );
};
