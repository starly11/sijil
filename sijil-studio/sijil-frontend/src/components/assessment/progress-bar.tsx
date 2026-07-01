'use client';

import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  current: number;
  total: number;
  percentage?: number;
}

export default function ProgressBar({ 
  current, 
  total, 
  percentage 
}: ProgressBarProps) {
  const progressPercentage = percentage ?? (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Progress: {current} of {total}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          {progressPercentage.toFixed(0)}%
        </span>
      </div>
      <Progress value={progressPercentage} className="h-2.5" />
    </div>
  );
}
