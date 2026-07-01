'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetchClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { CreateExportRequest, CreateExportResponse } from '@/types/api';

export const useExport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExportRequest): Promise<CreateExportResponse> => {
      const resp = await apiFetchClient<CreateExportResponse>(API_ENDPOINTS.EXPORTS, {
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
      queryClient.invalidateQueries({ queryKey: ['exports'] });
    },
  });
};
