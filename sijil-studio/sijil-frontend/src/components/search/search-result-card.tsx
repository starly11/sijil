import Link from 'next/link';
import { SearchResult } from '@/types/search';
import { SearchHighlights } from './search-highlights';

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
}

export function SearchResultCard({ result, query }: SearchResultCardProps) {
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'topic': return 'bg-green-100 text-green-800';
      case 'quran': return 'bg-purple-100 text-purple-800';
      case 'hadith': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <article className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <Link href={result.url} className="text-xl font-semibold text-blue-600 hover:underline">
          <SearchHighlights text={result.title} query={query} />
        </Link>
        <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeBadgeColor(result.type)}`}>
          {result.type}
        </span>
      </div>

      {result.description && (
        <p className="text-gray-600 mb-3">
          <SearchHighlights text={result.description} query={query} />
        </p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500">
        {result.subject && (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {result.subject}
          </span>
        )}
        {result.grade && (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Grade {result.grade}
          </span>
        )}
        {result.score && (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {(result.score * 100).toFixed(0)}% match
          </span>
        )}
      </div>
    </article>
  );
}
