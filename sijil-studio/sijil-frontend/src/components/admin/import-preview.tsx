import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BatchImportPreviewResponse } from '@/types/api';

interface ImportPreviewProps {
  data: BatchImportPreviewResponse['data'] | null;
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({ data }) => {
  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Documents Found</div>
            <div className="text-2xl font-bold">{data.documents_found}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Topics Found</div>
            <div className="text-2xl font-bold">{data.topics_found}</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Files Preview</h3>
          <div className="space-y-2">
            {data.files_preview.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <div className="font-medium">{file.path}</div>
                  <div className="text-sm text-gray-500">{file.type}</div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    file.status === 'valid'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : file.status === 'invalid'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {file.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
