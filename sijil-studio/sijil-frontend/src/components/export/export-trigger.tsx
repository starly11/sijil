'use client';

import * as React from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EXPORT_FORMATS } from '@/lib/export/formats';
import { useExport } from '@/hooks/use-export';
import { ExportFormat } from '@/types/api';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ExportTriggerProps {
  topicId: string;
  topicTitle?: string;
  className?: string;
}

export const ExportTrigger: React.FC<ExportTriggerProps> = ({
  topicId,
  topicTitle,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const exportMutation = useExport();
  const router = useRouter();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setIsOpen(false);
    try {
      const result = await exportMutation.mutateAsync({ topic_id: topicId, format });
      router.push(`/exports/${result.data.export_job_id}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={exportMutation.isPending}
      >
        <Download className="mr-2 h-4 w-4" />
        {exportMutation.isPending ? 'Exporting...' : 'Export'}
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80">
          <Card>
            <CardContent className="p-2">
              <div className="space-y-1">
                {EXPORT_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => handleExport(format.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{format.icon}</span>
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {format.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
