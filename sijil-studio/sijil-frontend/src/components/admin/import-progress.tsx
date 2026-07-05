import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from './status-badge';
import { BatchImportStatus } from '@/types/api';

interface ImportProgressProps {
  status: BatchImportStatus;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({ status }) => {
  console.log('===== [ImportProgress] RENDER =====');
  console.log('status:', status);
  console.log('status.progress:', status.progress);
  console.log('typeof status.progress:', typeof status.progress);
  
  // Handle progress being an object (with scanning, validating, importing, indexing)
  let progressValue = 0;
  if (typeof status.progress === 'number') {
    progressValue = status.progress;
  } else if (status.progress && typeof status.progress === 'object') {
    // Calculate average progress from stages
    const stages = status.progress;
    const stageValues = Object.values(stages).map((stage: any) => 
      stage?.percentage || 0
    );
    progressValue = stageValues.length > 0 
      ? Math.round(stageValues.reduce((a, b) => a + b, 0) / stageValues.length)
      : 0;
  }
  
  // Safely access counts
  const counts = status.counts || {
    total_documents: 0,
    imported_documents: 0,
    failed_documents: 0,
    total_topics: 0
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Import Status</CardTitle>
          <StatusBadge status={status.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-500">{progressValue}%</span>
          </div>
          <Progress value={progressValue} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{counts.total_documents}</div>
            <div className="text-sm text-gray-500">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {counts.imported_documents}
            </div>
            <div className="text-sm text-gray-500">Imported</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {counts.failed_documents}
            </div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{counts.total_topics}</div>
            <div className="text-sm text-gray-500">Topics</div>
          </div>
        </div>

        {status.errors && status.errors.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Errors</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {status.errors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm"
                >
                  <div className="text-red-600 dark:text-red-400">
                    {typeof error === 'object' ? JSON.stringify(error) : String(error)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
