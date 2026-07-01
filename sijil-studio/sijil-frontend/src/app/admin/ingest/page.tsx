'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { IngestionForm } from '@/components/admin/ingestion-form';
import { useIngestion } from '@/hooks/use-ingestion';

export default function IngestPage() {
  const router = useRouter();
  const ingestMutation = useIngestion();

  const handleIngest = async (jsonText: string) => {
    try {
      const data = JSON.parse(jsonText);
      const response = await ingestMutation.mutateAsync(data);
      router.push(`/admin/ingest/${response.data.tracking_id}`);
    } catch (error) {
      console.error('Ingestion failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ingest JSON</h1>
        <p className="text-gray-500 mt-2">
          Upload JSON files to import content into Sijil
        </p>
      </div>

      <IngestionForm
        onSubmit={handleIngest}
        isLoading={ingestMutation.isPending}
      />
    </div>
  );
}
