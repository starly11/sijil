import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  validating: { label: 'Validating', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  downloading: { label: 'Downloading', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  importing: { label: 'Importing', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  indexing: { label: 'Indexing', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  partial_success: { label: 'Partial Success', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusLower = String(status).toLowerCase();
  const config = statusConfig[statusLower] || {
    label: String(status),
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
