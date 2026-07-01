import { siteConfig } from '@/config/site';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Subject, Grade } from '@/types/api';

// Search API functions
export const searchContent = async (
  query: string,
  filters: { type?: string; subject?: string; grade?: string; page?: number }
) => {
  const params = new URLSearchParams({ q: query });
  if (filters.subject) params.set('subject', filters.subject);
  if (filters.grade) params.set('grade', filters.grade);
  if (filters.page) params.set('page', filters.page.toString());

  const response = await fetch(`${siteConfig.apiBaseUrl}/search?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  const data = await response.json();
  // Transform backend response to match frontend expected SearchResponse
  const transformedResults = (data?.data?.results || []).map((result: any) => ({
    id: result.id || result._id,
    type: 'topic',
    title: result.title,
    description: result.key_terms_preview,
    url: `/topics/${result.slug_global}`,
    subject: result.subject,
    grade: result.grade_numeric?.toString(),
    score: result.searchScore,
  }));
  return {
    data: transformedResults,
    meta: {
      total: data?.data?.count || 0,
      page: filters.page || 1,
      per_page: 20,
      total_pages: Math.ceil((data?.data?.count || 0) / 20),
    },
  };
};

export const getSearchSuggestions = async (prefix: string) => {
  const response = await fetch(`${siteConfig.apiBaseUrl}/search/suggest?prefix=${encodeURIComponent(prefix)}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch suggestions');
  }

  const data = await response.json();
  return {
    data: data?.data?.suggestions || [],
  };
};

export const getSearchFilters = async () => {
  // Use existing /subjects, /grades, and /policies endpoints for filters
  const [subjectsRes, gradesRes] = await Promise.allSettled([
    api.get<{ success: boolean; data: Subject[] }>(API_ENDPOINTS.SUBJECTS),
    api.get<{ success: boolean; data: Grade[] }>(API_ENDPOINTS.GRADES),
  ]);

  const subjects = subjectsRes.status === 'fulfilled' ? (subjectsRes.value.data?.data || []).map((s: any) => s.subject) : [];
  const grades = gradesRes.status === 'fulfilled' ? (gradesRes.value.data?.data || []).map((g: any) => g.grade?.toString()) : [];
  // Use known document types as fallback
  const types = ['textbook', 'reference', 'manual', 'research_paper', 'curriculum', 'course'];

  return {
    data: {
      subjects,
      grades,
      types,
    },
  };
};

export const trackSearch = async (query: string, resultId?: string) => {
  try {
    await fetch(`${siteConfig.apiBaseUrl}/analytics/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        result_id: resultId,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to track search:', error);
  }
};
