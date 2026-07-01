import { api } from './api/client';
import { API_ENDPOINTS } from './api/endpoints';
import { HomepageStats, Document } from '@/types/homepage';
import type { Subject } from '@/types/api';

/**
 * Parallel execution fallback targets gracefully mitigating breaking build 
 * runtime interfaces if downstream backend clusters drop active sockets.
 */

export async function fetchStats(): Promise<HomepageStats> {
  try {
    const response = await api.get<{
      total_documents: number;
      total_topics: number;
      total_formulas: number;
      total_mcqs: number;
      total_assets: number;
    }>(API_ENDPOINTS.PLATFORM_STATS);
    const data = response.data;
    if (!data) {
      return { documents: 0, topics: 0, subjects: 0, grades: 0 };
    }
    return {
      documents: data.total_documents,
      topics: data.total_topics,
      subjects: 0,
      grades: 0,
    };
  } catch (error) {
    console.error('Failed to fetch platform metrics:', error);
    // Safe schema-conforming fallback to respect Rule 001 safely during failure states
    return { documents: 0, topics: 0, subjects: 0, grades: 0 };
  }
}

export async function fetchSubjects(): Promise<Subject[]> {
  try {
    const response = await api.get<Subject[]>(API_ENDPOINTS.SUBJECTS);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch subjects config:', error);
    return [
      { count: 10, subject: 'Physics', slug: 'physics' },
      { count: 10, subject: 'Chemistry', slug: 'chemistry' },
      { count: 10, subject: 'Biology', slug: 'biology' },
      { count: 10, subject: 'Mathematics', slug: 'mathematics' },
    ];
  }
}

export async function fetchRecentDocuments(): Promise<Document[]> {
  try {
    const response = await api.get<Document[]>(API_ENDPOINTS.RECENT_DOCUMENTS);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch recent documents:', error);
    return [];
  }
}
