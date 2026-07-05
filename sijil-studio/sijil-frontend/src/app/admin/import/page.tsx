'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportPreview } from '@/components/admin/import-preview';
import {
  useBatchImportPreview,
  useBatchImportStart,
} from '@/hooks/use-batch-import';

export default function ImportPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = React.useState('');
  const [branch, setBranch] = React.useState('main');
  const [path, setPath] = React.useState('');
  const [previewData, setPreviewData] = React.useState<any>(null);
  const previewMutation = useBatchImportPreview();
  const startMutation = useBatchImportStart();

  console.log('===== [FRONTEND] ImportPage RENDER =====');
  console.log('previewData:', previewData);
  console.log('previewData is truthy:', !!previewData);
  console.log('previewMutation:', previewMutation);
  console.log('previewMutation.isPending:', previewMutation.isPending);

  const handlePreview = async () => {
    try {
      console.log('===== [FRONTEND] handlePreview CALLED =====');
      console.log('Repo URL:', repoUrl);
      
      const response = await previewMutation.mutateAsync({
        repo_url: repoUrl,
        branch,
        path: path || undefined,
      });
      
      console.log('===== [FRONTEND] previewMutation SUCCESS =====');
      console.log('Full response:', response);
      console.log('typeof response:', typeof response);
      console.log('response keys:', Object.keys(response || {}));
      
      setPreviewData(response);
      console.log('previewData just set to:', response.data);
    } catch (error) {
      console.error('===== [FRONTEND] previewMutation FAILED =====');
      console.error('Error:', error);
    }
  };

  const handleStartImport = async () => {
    if (!previewData) return;
    try {
      await startMutation.mutateAsync({
        batch_id: previewData.batch_id,
      });
      router.push(`/admin/import/${previewData.batch_id}`);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Batch Import</h1>
        <p className="text-gray-500 mt-2">
          Import content from GitHub repositories
        </p>
      </div>

      {/* DEBUG UI */}
      <Card className="bg-yellow-50 border-yellow-300">
        <CardHeader>
          <CardTitle className="text-yellow-800">DEBUG INFO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-mono text-yellow-800">
            <p>previewData exists: {JSON.stringify(!!previewData)}</p>
            <p>previewMutation.isPending: {JSON.stringify(previewMutation.isPending)}</p>
            <p>previewData: {JSON.stringify(previewData, null, 2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repository Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repository URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="https://github.com/username/repo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Path (optional)
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="content/"
              />
            </div>
          </div>

          <Button
            onClick={handlePreview}
            disabled={!repoUrl || previewMutation.isPending}
          >
            {previewMutation.isPending ? 'Previewing...' : 'Preview Import'}
          </Button>
        </CardContent>
      </Card>

      {previewData && (
        <>
          <ImportPreview data={previewData} />
          <div className="flex gap-4">
            <Button onClick={handleStartImport} disabled={startMutation.isPending}>
              {startMutation.isPending ? 'Starting Import...' : 'Start Import'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
