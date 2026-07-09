import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BatchImportPreviewResponse } from '@/types/api';
import { FileJson, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ImportPreviewProps {
  data: BatchImportPreviewResponse['data'] | null;
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({ data }) => {
  console.log('=== ImportPreview Component Received Data ===');
  console.log('data:', data);
  
  if (!data) {
    console.log('ImportPreview: No data provided');
    return null;
  }

  console.log('Documents found:', data.documents_found);
  console.log('Topics found:', data.topics_found);
  console.log('Files preview:', data.files_preview);

  // Count valid and invalid files
  const validCount = data.files_preview?.filter(f => f.status === 'valid').length || 0;
  const invalidCount = data.files_preview?.filter(f => f.status === 'invalid').length || 0;

  return (
    <Card className="border-l-4 border-l-blue-500 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <FileJson className="w-6 h-6" />
          Import Preview - {data.documents_found} Documents Ready
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {data.documents_found}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Documents</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {data.topics_found}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Topics</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {data.assets_found || 0}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">Assets</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {data.assessments_found || 0}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Assessments</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
              {validCount}/{data.documents_found}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Valid Files</div>
          </div>
        </div>

        {/* Errors & Warnings */}
        {((data.errors && data.errors.length > 0) || (data.warnings && data.warnings.length > 0)) && (
          <div className="space-y-2">
            {data.errors && data.errors.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold mb-2">
                  <XCircle className="w-5 h-5" />
                  {data.errors.length} Validation Error{data.errors.length > 1 ? 's' : ''}
                </div>
                <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                  {data.errors.slice(0, 5).map((error: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-xs mt-0.5">•</span>
                      <span>{error.file}: {error.message}</span>
                    </li>
                  ))}
                  {data.errors.length > 5 && (
                    <li className="text-xs italic">...and {data.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
            
            {data.warnings && data.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-semibold mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  {data.warnings.length} Warning{data.warnings.length > 1 ? 's' : ''}
                </div>
                <ul className="space-y-1 text-sm text-yellow-600 dark:text-yellow-400">
                  {data.warnings.slice(0, 5).map((warning: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-xs mt-0.5">•</span>
                      <span>{warning.file}: {warning.message}</span>
                    </li>
                  ))}
                  {data.warnings.length > 5 && (
                    <li className="text-xs italic">...and {data.warnings.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Files List */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FileJson className="w-4 h-4" />
            Files to Import ({data.files_preview?.length || 0})
          </h3>
          {data.files_preview && data.files_preview.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {data.files_preview.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    file.status === 'valid'
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:border-green-300'
                      : file.status === 'invalid'
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:border-red-300'
                      : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {file.status === 'valid' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : file.status === 'invalid' ? (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                        {file.path}
                      </div>
                      {file.error && (
                        <div className="text-xs text-red-600 dark:text-red-400 truncate mt-0.5">
                          {file.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 ${
                      file.status === 'valid'
                        ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : file.status === 'invalid'
                        ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileJson className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No files found to import</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
