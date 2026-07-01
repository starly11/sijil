'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, Database, Server } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  icon: 'activity' | 'clock' | 'database' | 'server';
}

export function MetricCard({ title, value, status, icon }: MetricCardProps) {
  const icons = {
    activity: Activity,
    clock: Clock,
    database: Database,
    server: Server,
  };

  const statusColors = {
    good: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  };

  const Icon = icons[icon];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center mt-2">
          <Icon className="h-3 w-3 text-muted-foreground mr-1" />
          <span className="text-xs text-muted-foreground">
            {status === 'good' ? 'Optimal' : status === 'warning' ? 'Needs attention' : 'Critical'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
