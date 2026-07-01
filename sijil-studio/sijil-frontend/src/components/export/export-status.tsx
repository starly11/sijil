'use client';

import * as React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { getFormatConfig, getStatusColor, getStatusLabel } from '@/lib/export/formats';
import { ExportJobStatus as ExportJobStatusType } from '@/types/api';
import { DownloadButton } from './DownloadButton';
import { useRouter } from 'next/navigation';

interface ExportStatusProps {
  jobStatus: ExportJobStatusType;
  jobId: string;
}

export const ExportStatus: React.FC<ExportStatusProps> = ({ jobStatus, jobId }) => {
  const router = useRouter();
  const formatConfig = jobStatus.format ? getFormatConfig(jobStatus.format) : null;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Export Status</CardTitle>
          <Badge className={getStatusColor(jobStatus.status)}>
            {getStatusLabel(jobStatus.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          {jobStatus.topic_title && (
            <div className="text-lg font-medium">{jobStatus.topic_title}</div>
          )}
          {formatConfig && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xl">{formatConfig.icon}</span>
              <span>{formatConfig.label}</span>
            </div>
          )}
        </div>

        {(jobStatus.status === 'pending' || jobStatus.status === 'processing') && (
          <div className="space-y-3" role="status" aria-live="polite">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>{jobStatus.message || 'Processing your export...'}</span>
            </div>
            <Progress value={jobStatus.progress || 0} />
          </div>
        )}

        {jobStatus.status === 'complete' && jobStatus.package_url && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-8 w-8" />
              <div>
                <div className="font-medium">Export Complete!</div>
                <div className="text-sm text-muted-foreground">Your file is ready to download</div>
              </div>
            </div>
            <DownloadButton
              downloadUrl={jobStatus.package_url}
              topicTitle={jobStatus.topic_title}
              format={jobStatus.format}
              size="lg"
              className="w-full"
            />
          </div>
        )}

        {jobStatus.status === 'failed' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-8 w-8" />
              <div>
                <div className="font-medium">Export Failed</div>
                <div className="text-sm text-muted-foreground">
                  {jobStatus.message || 'Something went wrong. Please try again.'}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.refresh()} className="w-full">
              Try Again
            </Button>
          </div>
        )}

        {jobStatus.created_at && (
          <div className="text-sm text-muted-foreground">
            Started: {new Date(jobStatus.created_at).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
