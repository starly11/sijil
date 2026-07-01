interface NoResultsFoundProps {
  query: string;
}

export function NoResultsFound({ query }: NoResultsFoundProps) {
  return (
    <div className="text-center py-12">
      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-gray-900">No results found for "{query}"</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
        Try adjusting your search terms, checking spelling, or using different keywords. You can also try removing filters to see more results.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800">
          Clear all filters
        </button>
        <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800">
          Search tips
        </button>
      </div>
    </div>
  );
}
