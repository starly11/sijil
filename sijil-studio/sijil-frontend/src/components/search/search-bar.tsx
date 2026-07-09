'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { useSearchSuggestions } from '@/hooks/use-search-suggestions';
import { SearchSuggestions } from './search-suggestions';
import { RecentSearches } from './recent-searches';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  defaultValue?: string;
}

export function SearchBar({ defaultValue = '' }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading } = useSearchSuggestions(query);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex]);
        } else if (query.trim()) {
          performSearch(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    setActiveIndex(-1);
  };

  const handleSelect = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
    setIsOpen(false);
  };

  const performSearch = (searchQuery: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('q', searchQuery);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto" ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center w-full px-4 py-2 border border-input rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-colors">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setIsOpen(true)}
            placeholder="Search across Quran, Hadith, Fiqh, and more..."
            className="flex-1 bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-lg"
            aria-label="Search"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={isOpen}
          />
          <Button
            type="submit"
            variant="primary"
            className="ml-2"
          >
            Search
          </Button>
        </div>
      </form>

      {(isOpen && (suggestions.length > 0 || isLoading)) && (
        <SearchSuggestions
          suggestions={suggestions}
          isLoading={isLoading}
          activeIndex={activeIndex}
          onSelect={handleSelect}
        />
      )}

      {!query && isOpen && <RecentSearches onSelect={handleSelect} />}
    </div>
  );
}
