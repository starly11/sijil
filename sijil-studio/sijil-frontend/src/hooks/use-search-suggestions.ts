'use client';

import { useState, useEffect } from 'react';
import { getSearchSuggestions } from '@/lib/api';

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    
    const fetchSuggestions = async () => {
      setIsLoading(true);
      
      try {
        const data = await getSearchSuggestions(query);
        setSuggestions(data.data || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    timeoutId = setTimeout(fetchSuggestions, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  return { suggestions, isLoading };
}
