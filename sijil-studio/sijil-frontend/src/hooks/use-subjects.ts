'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Subject } from '@/types/api';

/**
 * React Query client hook fetching the available subject/collection arrays.
 */
export function useSubjects() {
  return useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get<Subject[]>(API_ENDPOINTS.SUBJECTS);
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 1000 * 60 * 60, // Subjects change rarely, cache for 1 hour
  });
}
