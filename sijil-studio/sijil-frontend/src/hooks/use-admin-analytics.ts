'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetchClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { AnalyticsOverview } from '@/types/api';

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async (): Promise<AnalyticsOverview> => {
      const resp = await apiFetchClient<AnalyticsOverview>(API_ENDPOINTS.ADMIN_ANALYTICS_OVERVIEW);
      if (!resp.data) {
        throw new Error('No data from API');
      }
      return resp.data;
    },
  });
};
