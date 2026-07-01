'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetchClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import {
  IngestionJob,
  IngestionRequest,
  IngestionResponse,
} from '@/types/api';

export const useIngestion = () => {
  const queryClient = useQueryClient();

  const ingestMutation = useMutation({
    mutationFn: async (data: IngestionRequest): Promise<IngestionResponse> => {
      const resp = await apiFetchClient<IngestionResponse>(API_ENDPOINTS.INGEST_JSON, {
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
      queryClient.invalidateQueries({ queryKey: ['ingestion'] });
    },
  });

  return ingestMutation;
};

export const useIngestionStatus = (trackingId: string | null) => {
  return useQuery({
    queryKey: ['ingestionStatus', trackingId],
    queryFn: async (): Promise<IngestionJob> => {
      if (!trackingId) {
        throw new Error('No tracking ID');
      }
      const resp = await apiFetchClient<IngestionJob>(API_ENDPOINTS.INGEST_STATUS(trackingId));
      if (!resp.data) {
        throw new Error('No data from API');
      }
      return resp.data;
    },
    enabled: !!trackingId,
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
