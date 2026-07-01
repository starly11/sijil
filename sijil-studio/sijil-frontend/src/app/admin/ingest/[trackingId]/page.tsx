'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useIngestionStatus } from '@/hooks/use-ingestion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/admin/status-badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function IngestStatusPage() {
  const params = useParams();
  const trackingId = params.trackingId as string;
  const { data, isLoading, error } = useIngestionStatus(trackingId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">Ingestion Not Found</h2>
        <p className="text-gray-500">The tracking ID you provided doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ingestion Status</h1>
        <p className="text-gray-500 mt-2">Tracking ID: {trackingId}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status</CardTitle>
            <StatusBadge status={data.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(data.status === 'pending' || data.status === 'processing') && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                  <div className="font-medium">Processing your ingestion...</div>
                  {data.message && (
                    <div className="text-sm text-gray-500">{data.message}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {data.status === 'completed' && (
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircle className="h-8 w-8" />
              <div>
                <div className="font-medium">Ingestion Complete!</div>
                {data.completed_at && (
                  <div className="text-sm text-gray-500">
                    Completed at: {new Date(data.completed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {data.status === 'failed' && (
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <XCircle className="h-8 w-8" />
              <div>
                <div className="font-medium">Ingestion Failed</div>
                {data.message && (
                  <div className="text-sm">{data.message}</div>
                )}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500">
            Started at: {new Date(data.created_at).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
