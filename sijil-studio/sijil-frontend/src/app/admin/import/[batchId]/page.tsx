'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useBatchImportStatus } from '@/hooks/use-batch-import';
import { ImportProgress } from '@/components/admin/import-progress';

export default function ImportStatusPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  const { data, isLoading, error } = useBatchImportStatus(batchId);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">Import Not Found</h2>
        <p className="text-gray-500">The batch ID you provided doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Status</h1>
        <p className="text-gray-500 mt-2">Batch ID: {batchId}</p>
      </div>

      <ImportProgress status={data} />
    </div>
  );
}
