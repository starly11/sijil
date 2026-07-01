'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Metadata } from 'next';
import { ExportStatus } from '@/components/export/export-status';
import { useExportStatus } from '@/hooks/use-export-status';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ExportJobStatus } from '@/types/api';

export default function ExportStatusPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { data: jobStatus, isLoading, error } = useExportStatus(jobId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !jobStatus) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Export Not Found</h2>
          <p className="text-muted-foreground">The export job you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ExportStatus jobStatus={jobStatus} jobId={jobId} />
    </div>
  );
}
