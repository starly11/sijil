import Link from 'next/link';
import { SearchResult } from '@/types/search';
import { SearchHighlights } from './search-highlights';
import { BookOpen, Award, Book, GraduationCap, Zap } from 'lucide-react';

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
}

export function SearchResultCard({ result, query }: SearchResultCardProps) {
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-primary/10 text-primary';
      case 'topic': return 'bg-secondary/10 text-secondary';
      case 'quran': return 'bg-accent/10 text-accent';
      case 'hadith': return 'bg-amber-100 text-amber-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <BookOpen className="h-4 w-4 mr-1" />;
      case 'topic': return <Book className="h-4 w-4 mr-1" />;
      case 'quran': return <Book className="h-4 w-4 mr-1" />;
      case 'hadith': return <Award className="h-4 w-4 mr-1" />;
      default: return <Book className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <article className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <Link href={result.url} className="text-xl font-semibold text-primary hover:underline">
          <SearchHighlights text={result.title} query={query} />
        </Link>
        <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeBadgeColor(result.type)}`}>
          {result.type}
        </span>
      </div>

      {result.description && (
        <p className="text-muted-foreground mb-3">
          <SearchHighlights text={result.description} query={query} />
        </p>
      )}

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {result.subject && (
          <span className="flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            {result.subject}
          </span>
        )}
        {result.grade && (
          <span className="flex items-center">
            <GraduationCap className="h-4 w-4 mr-1" />
            Grade {result.grade}
          </span>
        )}
        {result.score && (
          <span className="flex items-center">
            <Zap className="h-4 w-4 mr-1" />
            {(result.score * 100).toFixed(0)}% match
          </span>
        )}
      </div>
    </article>
  );
}
