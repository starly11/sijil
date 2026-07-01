'use client';

import { useState, useEffect } from 'react';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recent-searches');
      if (stored) {
        const searches = JSON.parse(stored);
        // Ensure it's an array of objects with query and timestamp
        const parsed = Array.isArray(searches) 
          ? searches.map((s: string | SearchHistoryItem) => 
              typeof s === 'string' ? { query: s, timestamp: Date.now() } : s
            )
          : [];
        setRecentSearches(parsed.slice(0, 10)); // Keep last 10
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  const addSearch = (query: string) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
    };

    const updated = [
      newItem,
      ...recentSearches.filter(item => item.query !== query.trim())
    ].slice(0, 10);

    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const clearSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  const removeSearch = (query: string) => {
    const updated = recentSearches.filter(item => item.query !== query);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  return {
    recentSearches,
    addSearch,
    clearSearches,
    removeSearch,
  };
}
