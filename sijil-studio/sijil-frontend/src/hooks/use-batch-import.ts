'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetchClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import {
  BatchImportPreviewRequest,
  BatchImportPreviewResponse,
  BatchImportRequest,
  BatchImportStatus,
} from '@/types/api';

export const useBatchImportPreview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: BatchImportPreviewRequest
    ): Promise<BatchImportPreviewResponse> => {
      const resp = await apiFetchClient<BatchImportPreviewResponse>(API_ENDPOINTS.IMPORT_PREVIEW, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!resp.data) {
        throw new Error('No data from API');
      }
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] });
    },
  });
};

export const useBatchImportStart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BatchImportRequest) => {
      const resp = await apiFetchClient(API_ENDPOINTS.IMPORT_START, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] });
    },
  });
};

export const useBatchImportStatus = (batchId: string | null) => {
  return useQuery({
    queryKey: ['importStatus', batchId],
    queryFn: async (): Promise<BatchImportStatus> => {
      if (!batchId) {
        throw new Error('No batch ID');
      }
      const resp = await apiFetchClient<BatchImportStatus>(API_ENDPOINTS.IMPORT_STATUS(batchId));
      if (!resp.data) {
        throw new Error('No data from API');
      }
      return resp.data;
    },
    enabled: !!batchId,
    refetchInterval: (query) => {
      const queryData = query.state.data;
      if (!queryData) return 2000;
      if (
        queryData.status === 'completed' ||
        queryData.status === 'failed' ||
        queryData.status === 'cancelled'
      ) {
        return false;
      }
      return 2000;
    },
  });
};
