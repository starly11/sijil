'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SearchFilters as SearchFiltersType } from '@/types/search';

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
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-6">
      {/* Content Type */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Content Type</h3>
        <div className="space-y-2">
          {filters.types.map(type => (
            <label key={type} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={currentFilters.type === type}
                onChange={() => handleFilterChange('type', currentFilters.type === type ? null : type)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Subject</h3>
        <div className="space-y-2">
          {filters.subjects.map(subject => (
            <label key={subject} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentFilters.subject === subject}
                onChange={() => handleFilterChange('subject', currentFilters.subject === subject ? null : subject)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{subject}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Grade Level */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Grade Level</h3>
        <div className="space-y-2">
          {filters.grades.map(grade => (
            <label key={grade} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentFilters.grade === grade}
                onChange={() => handleFilterChange('grade', currentFilters.grade === grade ? null : grade)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Grade {grade}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {(currentFilters.type || currentFilters.subject || currentFilters.grade) && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.delete('type');
            params.delete('subject');
            params.delete('grade');
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
