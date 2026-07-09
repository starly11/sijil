import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'destructive' | 'outline' | 'secondary';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'border-transparent bg-primary text-primary-foreground': variant === 'default',
          'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400': variant === 'success',
          'border-transparent bg-destructive text-destructive-foreground': variant === 'destructive',
          'text-foreground border-border': variant === 'outline',
          'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-200 dark:border-amber-700': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  );
}
