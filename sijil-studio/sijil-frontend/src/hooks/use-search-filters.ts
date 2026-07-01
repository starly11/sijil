'use client';

import { useState, useEffect } from 'react';

export function useSearchFilters() {
  const [filters, setFilters] = useState<{
    subjects: string[];
    grades: string[];
    types: string[];
  }>({
    subjects: [],
    grades: [],
    types: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/v1/search/filters');
        
        if (!response.ok) {
          throw new Error('Failed to fetch filters');
        }

        const data = await response.json();
        setFilters(data.data || { subjects: [], grades: [], types: [] });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load filters');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilters();
  }, []);

  return {
    filters,
    isLoading,
    error,
  };
}
