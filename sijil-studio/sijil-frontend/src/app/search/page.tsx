import { Metadata } from 'next';
import { Suspense } from 'react';
import { Search } from 'lucide-react';
import { SearchBar } from '@/components/search/search-bar';
import { SearchResults } from '@/components/search/search-results';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchStats } from '@/components/search/search-stats';
import { getSearchFilters, searchContent } from '@/lib/api';
import { SearchFilters as SearchFiltersType } from '@/types/search';

export const metadata: Metadata = {
  title: 'Search | Sijil',
  description: 'Search across all Islamic content including Quran, Hadith, Fiqh, and more.',
};

interface PageProps {
  searchParams: {
    q?: string;
    type?: string;
    subject?: string;
    grade?: string;
    page?: string;
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const filters: SearchFiltersType = {
    type: params.type,
    subject: params.subject,
    grade: params.grade,
    page: parseInt(params.page || '1'),
  };

  // Fetch search results and filters in parallel
  const [resultsData, availableFilters] = await Promise.all([
    query ? searchContent(query, filters) : Promise.resolve({ data: [], meta: { total: 0, page: 1, per_page: 20, total_pages: 0 } }),
    getSearchFilters(),
  ]).catch(() => [
    { data: [], meta: { total: 0, page: 1, per_page: 20, total_pages: 0 } },
    { data: { subjects: [], grades: [], types: [] } },
  ]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Search</h1>
        <SearchBar defaultValue={query} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <SearchFilters 
            filters={availableFilters.data as { subjects: string[]; grades: string[]; types: string[] }}
            currentFilters={filters}
          />
        </aside>

        {/* Results */}
        <main className="lg:col-span-3">
          {query && (
            <>
              <SearchStats 
                total={resultsData.meta?.total || 0}
                time={0}
                query={query}
              />
              <Suspense fallback={<div className="space-y-4">{[...Array(5)].map((_, i) => (<div key={i} className="h-32 bg-muted rounded animate-pulse" />))}</div>}>
                <SearchResults 
                  results={resultsData.data}
                  currentPage={resultsData.meta?.page || 1}
                  totalPages={resultsData.meta?.total_pages || 0}
                  query={query}
                />
              </Suspense>
            </>
          )}

          {!query && (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">Start searching</h3>
              <p className="mt-1 text-sm text-muted-foreground">Enter a query to search across all content.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
