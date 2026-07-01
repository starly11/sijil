import { Card } from '@/components/ui/card';
import { formatNumericValue } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: LucideIcon;
  description?: string;
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between p-6 shadow-xs hover:border-primary/30 transition-all duration-200 group">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground tracking-tight group-hover:text-primary transition-colors">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{formatNumericValue(value)}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="p-2.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );
}
