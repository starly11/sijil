import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiFetchClient } from '@/lib/api/client';

export function useApiQuery<T>(
  queryKey: unknown[],
  endpoint: string,
  options?: Omit<UseQueryOptions<T, Error, T, unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, Error, T, unknown[]>({
    queryKey,
    queryFn: async () => {
      const resp = await apiFetchClient<T>(endpoint);
      if (resp.data !== undefined) {
        return resp.data;
      }
      throw new Error('No data received from API');
    },
    ...options,
  });
}
