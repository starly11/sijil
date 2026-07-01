'use client';

import { useEffect, useState } from 'react';

interface RecentSearchesProps {
  onSelect: (query: string) => void;
}

export function RecentSearches({ onSelect }: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recent-searches');
    if (stored) {
      try {
        const searches = JSON.parse(stored);
        setRecentSearches(searches.slice(0, 5)); // Show last 5 searches
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  const handleSelect = (query: string) => {
    onSelect(query);
    // Move selected query to top
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
    setRecentSearches(updated);
  };

  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Searches</h3>
      <ul className="space-y-2">
        {recentSearches.map((search, index) => (
          <li key={index}>
            <button
              onClick={() => handleSelect(search)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center"
            >
              <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {search}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
