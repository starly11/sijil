/**
 * SIJIL API Client
 * Centralized API communication layer with error handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'An unexpected error occurred',
        status: response.status,
      }));
      throw error;
    }
    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// API Endpoints
export const endpoints = {
  // Documents
  documents: '/documents',
  documentById: (id: string) => `/documents/${id}`,
  documentTopics: (id: string) => `/documents/${id}/topics`,
  
  // Topics
  topics: '/topics',
  topicById: (id: string) => `/topics/${id}`,
  topicHierarchy: (documentId: string) => `/topics/hierarchy/${documentId}`,
  
  // Subjects
  subjects: '/subjects',
  subjectBySlug: (slug: string) => `/subjects/${slug}`,
  
  // Search
  search: '/search',
  searchFormulas: '/search/formulas',
  
  // Quran
  quran: '/quran',
  surah: (surahNumber: number) => `/quran/${surahNumber}`,
  
  // Exports
  exports: '/exports',
  exportJob: (jobId: string) => `/exports/${jobId}`,
  
  // Admin
  adminIngest: '/admin/ingest',
  adminIngestStatus: (trackingId: string) => `/admin/ingest/${trackingId}`,
  adminImport: '/admin/import',
  adminImportStatus: (batchId: string) => `/admin/import/${batchId}`,
  adminAnalytics: '/admin/analytics',
  adminPerformance: '/admin/performance',
};
