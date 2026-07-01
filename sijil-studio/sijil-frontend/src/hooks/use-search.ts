'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SearchResult, SearchFilters } from '@/types/search';

const SEARCH_DEBOUNCE_MS = 300;

export function useSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || undefined;
  const subject = searchParams.get('subject') || undefined;
  const grade = searchParams.get('grade') || undefined;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        setTotal(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ q: query });
        if (type) params.set('type', type);
        if (subject) params.set('subject', subject);
        if (grade) params.set('grade', grade);
        params.set('page', page.toString());

        const response = await fetch(`/api/v1/search?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        setResults(data.data || []);
        setTotal(data.meta?.total || 0);
        setTotalPages(data.meta?.total_pages || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setIsLoading(false);
      }
    };

    timeoutId = setTimeout(fetchResults, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query, type, subject, grade, page]);

  const updateFilters = (newFilters: Partial<{ type?: string; subject?: string; grade?: string }>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    results,
    isLoading,
    error,
    total,
    page,
    totalPages,
    query,
    filters: { type, subject, grade },
    updateFilters,
    setPage,
  };
}
