import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from './status-badge';
import { BatchImportStatus } from '@/types/api';

interface ImportProgressProps {
  status: BatchImportStatus;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({ status }) => {
  const counts = status.counts || {
    total_documents: 0,
    imported_documents: 0,
    failed_documents: 0,
    total_topics: 0
  };

  const importedCount =
    status.successful_files?.length ||
    counts.imported_documents ||
    0;

  const failedCount =
    status.failed_files?.length ||
    counts.failed_documents ||
    0;

  const totalProcessed = importedCount + failedCount;

  let progressValue = 0;
  if (typeof status.progress === 'number') {
    progressValue = status.progress;
  } else if (status.progress && typeof status.progress === 'object') {
    const stages = status.progress as Record<string, { percentage?: number }>;
    if (stages.importing && typeof stages.importing.percentage === 'number') {
      progressValue = stages.importing.percentage;
    } else {
      const stageValues = Object.values(stages).map((stage) => stage?.percentage || 0);
      progressValue = stageValues.length > 0
        ? Math.round(stageValues.reduce((a, b) => a + b, 0) / stageValues.length)
        : 0;
    }
  }

  if (status.status === 'COMPLETED' || status.status === 'PARTIAL_SUCCESS') {
    progressValue = 100;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Import Status</CardTitle>
          <StatusBadge status={status.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-500">{progressValue}%</span>
          </div>
          <Progress value={progressValue} />
        </div>

        {/* 4-Column Summary Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{counts.total_documents || 0}</div>
            <div className="text-sm text-gray-500">Total Files</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalProcessed}</div>
            <div className="text-sm text-gray-500">Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {importedCount}
            </div>
            <div className="text-sm text-gray-500">Imported</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {failedCount}
            </div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
        </div>

        {/* Successfully imported files */}
        {status.successful_files && status.successful_files.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Imported Files</h3>
            <div className="space-y-2">
              {status.successful_files.map((file, index) => (
                <div
                  key={index}
                  className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-medium">{file.file_path}</div>
                    {file.document_id && (
                      <div className="text-gray-500 text-xs mt-1">Document: {file.document_id}</div>
                    )}
                  </div>
                  {file.document_id && (
                    <a
                      href={`/documents/${file.document_id}`}
                      className="text-blue-600 hover:underline whitespace-nowrap text-xs"
                    >
                      View →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors Section */}
        {status.failed_files && status.failed_files.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Errors</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {status.failed_files.map((error, index) => (
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
        
        {/* Warnings Section */}
        {status.warnings && status.warnings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Warnings</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {status.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm"
                >
                  <div className="font-medium">{warning.file_path}</div>
                  <div className="text-yellow-600 dark:text-yellow-400">{warning.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};