'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportPreview } from '@/components/admin/import-preview';
import { RealTimeLogViewer } from '@/components/admin/real-time-log-viewer';
import {
  useBatchImportPreview,
  useBatchImportStart,
  useBatchImportStatus,
} from '@/hooks/use-batch-import';
import { Loader2, CheckCircle2, RefreshCw } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}

export default function ImportPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = React.useState('');
  const [branch, setBranch] = React.useState('main');
  const [path, setPath] = React.useState('');
  const [previewData, setPreviewData] = React.useState<any>(null);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [batchId, setBatchId] = React.useState<string | null>(null);

  const previewMutation = useBatchImportPreview();
  const startMutation = useBatchImportStart();

  // Load persisted state on mount
  React.useEffect(() => {
    const savedBatchId = localStorage.getItem('currentImportBatchId');
    const savedRepoUrl = localStorage.getItem('lastRepoUrl');
    const savedLogs = localStorage.getItem('importLogs');

    if (savedBatchId) {
      setBatchId(savedBatchId);
    }
    if (savedRepoUrl) {
      setRepoUrl(savedRepoUrl);
    }
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Failed to parse saved logs', e);
      }
    }
  }, []);

  // Persist logs to localStorage
  React.useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem('importLogs', JSON.stringify(logs));
    }
  }, [logs]);

  // Use the status hook if we have a batchId
  const { data: statusData } = useBatchImportStatus(batchId);

  // Sync status updates with logs
  React.useEffect(() => {
    if (statusData && batchId) {
      const status = statusData.status?.toLowerCase();

      if (status === 'scanning' && !logs.some(l => l.message.includes('Repository scan in progress'))) {
        addLog('info', 'Repository scan in progress...', statusData.counts);
      } else if (status === 'validating' && !logs.some(l => l.message.includes('Validating content'))) {
        addLog('info', 'Validating content structure...', statusData.counts);
      } else if (status === 'importing' && !logs.some(l => l.message.includes('Importing documents'))) {
        addLog('info', `Importing documents... ${statusData.counts?.imported_documents || 0}/${statusData.counts?.total_documents || 0}`, statusData.counts);
      } else if (status === 'indexing' && !logs.some(l => l.message.includes('Indexing content'))) {
        addLog('info', 'Indexing content for search...', statusData.counts);
      } else if (status === 'completed') {
        addLog('success', `Import completed successfully! ${statusData.counts?.imported_documents || 0} documents imported.`, statusData.counts);
        setIsStreaming(false);
        localStorage.removeItem('currentImportBatchId');
        localStorage.removeItem('importLogs');
      } else if (status === 'failed') {
        addLog('error', `Import failed: ${statusData.errors?.[0] || 'Unknown error'}`, statusData.errors);
        setIsStreaming(false);
      } else if (status === 'partial_success') {
        addLog('warn', `Import completed with warnings. ${statusData.counts?.failed_documents || 0} files failed.`, statusData);
        setIsStreaming(false);
      }
    }
  }, [statusData, batchId]);

  const addLog = (level: 'info' | 'warn' | 'error' | 'success', message: string, details?: any) => {
    setLogs(prev => {
      const newLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        details
      };
      return [...prev, newLog];
    });
  };

  const handlePreview = async () => {
    try {
      setLogs([]);
      setIsStreaming(true);
      addLog('info', 'Starting repository scan...', { repo: repoUrl, branch });

      console.log('=== Starting Preview ===');
      console.log('Request payload:', { repo_url: repoUrl, branch, path: path || undefined });

      const response = await previewMutation.mutateAsync({
        repo_url: repoUrl,
        branch,
        path: path || undefined,
      });

<<<<<<< HEAD
=======
      console.log('=== Preview Response ===');
      console.log('Full response:', response);
      console.log('response.data:', response.data);

>>>>>>> a31d2a5 (new)
      addLog('success', 'Repository scan completed!', {
        documents: response.data?.documents_found,
        topics: response.data?.topics_found,
        files: response.data?.files_preview?.length
      });

      setPreviewData(response.data);
      console.log('Set previewData to:', response.data);

      if (response.data?.batch_id) {
        const newBatchId = response.data.batch_id;
        setBatchId(newBatchId);
        localStorage.setItem('currentImportBatchId', newBatchId);
        localStorage.setItem('lastRepoUrl', repoUrl);
      }

      addLog('info', 'Ready to start import. Click "Start Import" to begin.');
      
      console.log('=== Preview Response ===');
      console.log('Full response:', response);
      console.log('response.data:', response.data);
      console.log('Set previewData to:', response.data);
    } catch (error: any) {
      console.error('=== Preview Failed ===');
      console.error('Error object:', error);
      console.error('Error message:', (error as Error).message);

      addLog('error', 'Preview failed', error.message || String(error));
      setIsStreaming(false);
      console.error('=== Preview Failed ===');
      console.error('Error object:', error);
      console.error('Error message:', (error as Error).message); 
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStartImport = async () => {
    if (!previewData && !batchId) return;
    try {
      const currentBatchId = batchId || previewData?.batch_id;
      addLog('info', 'Starting batch import process...', { batch_id: currentBatchId });
      setIsStreaming(true);

      await startMutation.mutateAsync({
        batch_id: currentBatchId,
      });

      addLog('success', 'Import started successfully! Monitoring progress...');

      setTimeout(() => {
        router.push(`/admin/import/${currentBatchId}`);
      }, 1500);
    } catch (error: any) {
      addLog('error', 'Import failed to start', error.message || String(error));
      setIsStreaming(false);
    }
  };

  const clearState = () => {
    setBatchId(null);
    setPreviewData(null);
    setLogs([]);
    setIsStreaming(false);
    localStorage.removeItem('currentImportBatchId');
    localStorage.removeItem('importLogs');
    localStorage.removeItem('lastRepoUrl');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Batch Import
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Import content from GitHub repositories with real-time progress tracking
          </p>
        </div>
        {(batchId || logs.length > 0) && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearState}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
        )}
      </div>

      {(logs.length > 0 || isStreaming) && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="ml-2">Live Operation Log</span>
              </CardTitle>
              {isStreaming && (
                <div className="flex items-center gap-2 text-green-400 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>LIVE</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <RealTimeLogViewer logs={logs} />
          </CardContent>
        </Card>
      )}

      {statusData && batchId && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                Current Import Status
              </CardTitle>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusData.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  statusData.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                {statusData.status}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {statusData.counts?.total_documents || 0}
                </div>
                <div className="text-xs text-gray-500">Total Documents</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {statusData.counts?.imported_documents || 0}
                </div>
                <div className="text-xs text-gray-500">Imported</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {statusData.counts?.failed_documents || 0}
                </div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {typeof statusData.progress === 'number' ? `${statusData.progress}%` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Repository Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repository URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={!!batchId && isStreaming}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="https://github.com/username/repo "
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
                disabled={!!batchId && isStreaming}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
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
                disabled={!!batchId && isStreaming}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                placeholder="content/"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handlePreview}
              disabled={!repoUrl || previewMutation.isPending || (!!batchId && isStreaming)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
            >
              {previewMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning Repository...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Import
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewData && !batchId && (
        <>
          <ImportPreview data={previewData} />
          <div className="flex gap-4">
            <Button
              onClick={handleStartImport}
              disabled={startMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-md"
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Import...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Start Import
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}