'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, BookOpen, FileText, Eye } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: 'users' | 'documents' | 'topics' | 'views';
}

export function AdminStatCard({ title, value, change, icon }: StatCardProps) {
  const icons = {
    users: Users,
    documents: FileText,
    topics: BookOpen,
    views: Eye,
  };

  const Icon = icons[icon];
  const isPositive = change && change >= 0;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {isPositive ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
              {isPositive ? '+' : ''}{change}%
            </span>
            {' '}from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
