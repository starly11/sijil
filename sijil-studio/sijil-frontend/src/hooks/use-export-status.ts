'use client';

import { useQuery, Query } from '@tanstack/react-query';
import { apiFetchClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ExportJobStatus } from '@/types/api';

export const useExportStatus = (jobId: string | null) => {
  return useQuery({
    queryKey: ['exportStatus', jobId],
    queryFn: async (): Promise<ExportJobStatus> => {
      if (!jobId) {
        throw new Error('No job ID');
      }
      const resp = await apiFetchClient<ExportJobStatus>(API_ENDPOINTS.EXPORT_JOB(jobId));
      if (!resp.data) {
        throw new Error('No data from API');
      }
      return resp.data;
    },
    enabled: !!jobId,
    refetchInterval: (query: Query<ExportJobStatus>) => {
      const data = query.state.data;
      if (!data) return 1000;
      if (data.status === 'complete' || data.status === 'failed' || data.status === 'cancelled') {
        return false;
      }
      return 2000;
    },
    refetchIntervalInBackground: false,
  });
};
