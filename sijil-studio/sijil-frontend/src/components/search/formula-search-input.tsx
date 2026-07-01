'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface FormulaSearchInputProps {
  defaultValue?: string;
}

export function FormulaSearchInput({ defaultValue = '' }: FormulaSearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/search/formulas?s=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.data || []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error fetching formula suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}&type=formula`);
    }
  };

  const handleSelect = (suggestion: string) => {
    setQuery(suggestion);
    router.push(`/search?q=${encodeURIComponent(suggestion)}&type=formula`);
    setIsOpen(false);
  };

  return (
    <div className="relative max-w-2xl">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search formulas (e.g., E=mc², a²+b²=c²)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
          aria-label="Search formulas"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Search
        </button>
      </form>

      {(isOpen && (suggestions.length > 0 || isLoading)) && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto font-mono text-sm">
          {isLoading ? (
            <li className="px-4 py-3 text-gray-500">Searching...</li>
          ) : (
            suggestions.map((formula, index) => (
              <li
                key={index}
                onClick={() => handleSelect(formula)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-50"
              >
                {formula}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
