import * as React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getFormatConfig, getStatusColor, getStatusLabel } from '@/lib/export/formats';
import { ExportJobStatus } from '@/types/api';
import { DownloadButton } from './DownloadButton';

interface ExportJobCardProps {
  job: ExportJobStatus & { export_job_id: string };
}

export const ExportJobCard: React.FC<ExportJobCardProps> = ({ job }) => {
  const formatConfig = job.format ? getFormatConfig(job.format) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {formatConfig && (
              <span className="text-2xl">{formatConfig.icon}</span>
            )}
            <div>
              <div className="font-medium">{job.topic_title || 'Untitled'}</div>
              {formatConfig && (
                <div className="text-sm text-muted-foreground">{formatConfig.label}</div>
              )}
            </div>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {getStatusLabel(job.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          {job.created_at && new Date(job.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/exports/${job.export_job_id}`} className="inline-flex">
            <Button variant="outline" size="sm">
              <Eye className="mr-1 h-4 w-4" />
              View
            </Button>
          </Link>
          {job.status === 'complete' && job.package_url && (
            <DownloadButton
              downloadUrl={job.package_url}
              topicTitle={job.topic_title}
              format={job.format}
              size="sm"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
