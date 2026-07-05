import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from './status-badge';
import { BatchImportStatus } from '@/types/api';

interface ImportProgressProps {
  status: BatchImportStatus;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({ status }) => {
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
            <span className="text-sm text-gray-500">{status.progress}%</span>
          </div>
          <Progress value={status.progress} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{status.counts.total_documents}</div>
            <div className="text-sm text-gray-500">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {status.counts.imported_documents}
            </div>
            <div className="text-sm text-gray-500">Imported</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {status.counts.failed_documents}
            </div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{status.counts.total_topics}</div>
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
                  <div className="text-red-600 dark:text-red-400">{JSON.stringify(error)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
