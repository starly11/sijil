export interface SearchResult {
  id: string;
  type: 'document' | 'topic' | 'quran' | 'hadith' | 'formula';
  title: string;
  description?: string;
  url: string;
  subject?: string;
  grade?: string;
  score?: number;
  collection?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SearchFilters {
  type?: string;
  subject?: string;
  grade?: string;
  page?: number;
}

export interface SearchResponse {
  data: SearchResult[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    time?: number;
  };
}

export interface SearchSuggestionsResponse {
  data: string[];
}

export interface SearchFiltersResponse {
  data: {
    subjects: string[];
    grades: string[];
    types: string[];
  };
}
