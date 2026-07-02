'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SearchFilters as SearchFiltersType } from '@/types/search';
import { Button } from '@/components/ui/button';

interface SearchFiltersProps {
  filters: {
    subjects: string[];
    grades: string[];
    types: string[];
  };
  currentFilters: {
    type?: string;
    subject?: string;
    grade?: string;
    page?: number;
  };
}

export function SearchFilters({ filters, currentFilters }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    params.set('page', '1'); // Reset to first page
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-6">
      {/* Content Type */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Content Type</h3>
        <div className="space-y-2">
          {filters.types.map(type => (
            <label key={type} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={currentFilters.type === type}
                onChange={() => handleFilterChange('type', currentFilters.type === type ? null : type)}
                className="h-4 w-4 text-primary focus:ring-ring border-input"
              />
              <span className="ml-2 text-sm text-muted-foreground capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Subject</h3>
        <div className="space-y-2">
          {filters.subjects.map(subject => (
            <label key={subject} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentFilters.subject === subject}
                onChange={() => handleFilterChange('subject', currentFilters.subject === subject ? null : subject)}
                className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
              />
              <span className="ml-2 text-sm text-muted-foreground">{subject}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Grade Level */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Grade Level</h3>
        <div className="space-y-2">
          {filters.grades.map(grade => (
            <label key={grade} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentFilters.grade === grade}
                onChange={() => handleFilterChange('grade', currentFilters.grade === grade ? null : grade)}
                className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
              />
              <span className="ml-2 text-sm text-muted-foreground">Grade {grade}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {(currentFilters.type || currentFilters.subject || currentFilters.grade) && (
        <Button
          variant="ghost"
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.delete('type');
            params.delete('subject');
            params.delete('grade');
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="w-full"
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
}
