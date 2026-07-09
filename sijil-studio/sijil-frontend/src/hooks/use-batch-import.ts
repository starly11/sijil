'use client';

import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
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
    ): Promise<any> => {
      console.log('===== [HOOK] useBatchImportPreview mutationFn called =====');
      console.log('Request data:', data);
      
      const resp = await apiFetchClient(API_ENDPOINTS.IMPORT_PREVIEW, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('===== [HOOK] useBatchImportPreview API response =====');
      console.log('Full response:', resp);
      console.log('resp.success:', resp.success);
      console.log('resp.data:', resp.data);
      
      return resp.data;
    },
    onSuccess: (data) => {
      console.log('===== [HOOK] useBatchImportPreview onSuccess =====');
      console.log('Success data:', data);
      queryClient.invalidateQueries({ queryKey: ['import'] });
    },
    onError: (error) => {
      console.error('===== [HOOK] useBatchImportPreview onError =====');
      console.error('Error:', error);
    }
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
      const statusLower = String(queryData.status).toLowerCase();
      // Stop polling on terminal states
      if (
        statusLower === 'completed' ||
        statusLower === 'failed' ||
        statusLower === 'cancelled' ||
        statusLower === 'partial_success'
      ) {
        return false;
      }
      return 2000;
    },
    // Stop polling on errors or terminal states
    retry: (failureCount, error: any) => {
      // Never retry on 401 unauthorized
      if (error?.status === 401 || error?.response?.status === 401) {
        console.warn('[useBatchImportStatus] Unauthorized access detected. Stopping polling.');
        return false;
      }
      // Stop after 5 failures to prevent infinite polling
      if (failureCount >= 5) {
        console.warn('[useBatchImportStatus] Max retries reached. Stopping polling.');
        return false;
      }
      return true;
    },
  });
};
