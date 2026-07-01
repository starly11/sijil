'use client';

import { SearchResult } from '@/types/search';
import { SearchResultCard } from './search-result-card';
import { PaginationControls } from '../topics/pagination-controls';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface SearchResultsProps {
  results: SearchResult[];
  currentPage: number;
  totalPages: number;
  query: string;
}

export function SearchResults({ results, currentPage, totalPages, query }: SearchResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((result, index) => (
        <SearchResultCard key={`${result.id}-${index}`} result={result} query={query} />
      ))}

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
