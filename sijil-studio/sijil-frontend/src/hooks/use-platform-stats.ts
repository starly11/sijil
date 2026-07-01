'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { HomepageStats } from '@/types/homepage';

/**
 * React Query client hook tracking global system platform analytics metrics.
 */
export function usePlatformStats() {
  return useQuery<HomepageStats>({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const response = await api.get<{
        total_documents: number;
        total_topics: number;
        total_formulas: number;
        total_mcqs: number;
        total_assets: number;
      }>(API_ENDPOINTS.PLATFORM_STATS);
      const data = response.data;
      if (!data) {
        return { documents: 0, topics: 0, subjects: 0, grades: 0 };
      }
      return {
        documents: data.total_documents,
        topics: data.total_topics,
        subjects: 0, // Or fetch separately
        grades: 0,
      };
    },
    staleTime: 1000 * 60 * 15, // Consider data fresh for 15 minutes
    gcTime: 1000 * 60 * 30,    // Cache persistence window
  });
}
