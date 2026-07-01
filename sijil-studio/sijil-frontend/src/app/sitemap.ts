import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { apiFetchClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface Subject {
  _id: string;
  subject: string;
  slug: string;
  description?: string;
}

interface Document {
  _id: string;
  title: string;
  slug_global?: string;
  updated_at?: string;
}

interface Topic {
  _id: string;
  title: string;
  slug_global: string;
  updated_at?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = siteConfig.url;
  const lastModified = new Date();
  
  // Static routes
  const staticRoutes = [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${siteUrl}/search`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/subjects`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/documents`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/quran`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/exports`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/status`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.3,
    },
  ];

  // Dynamic routes - fetch from API
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  
  try {
    // Fetch subjects
    const subjectsResponse = await apiFetchClient<{ success: boolean; data: Subject[] }>(API_ENDPOINTS.SUBJECTS);
    if (subjectsResponse.data?.data) {
      const subjectRoutes = subjectsResponse.data.data.map((subject) => ({
        url: `${siteUrl}/subjects/${subject.slug}`,
        lastModified: new Date(subject.updated_at || lastModified),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
      dynamicRoutes = [...dynamicRoutes, ...subjectRoutes];
    }
  } catch (error) {
    console.error('Failed to fetch subjects for sitemap:', error);
  }

  try {
    // Fetch documents
    const docsResponse = await apiFetchClient<{ success: boolean; data: Document[] }>(API_ENDPOINTS.DOCUMENTS);
    if (docsResponse.data?.data) {
      const documentRoutes = docsResponse.data.data.slice(0, 1000).map((doc) => ({
        url: `${siteUrl}/documents/${doc._id}`,
        lastModified: new Date(doc.updated_at || lastModified),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
      dynamicRoutes = [...dynamicRoutes, ...documentRoutes];
    }
  } catch (error) {
    console.error('Failed to fetch documents for sitemap:', error);
  }

  try {
    // Fetch topics (limit to prevent huge sitemaps)
    const topicsResponse = await apiFetchClient<{ success: boolean; data: Topic[] }>(API_ENDPOINTS.TOPICS);
    if (topicsResponse.data?.data) {
      const topicRoutes = topicsResponse.data.data.slice(0, 5000).map((topic) => ({
        url: `${siteUrl}/topics/${topic.slug_global}`,
        lastModified: new Date(topic.updated_at || lastModified),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }));
      dynamicRoutes = [...dynamicRoutes, ...topicRoutes];
    }
  } catch (error) {
    console.error('Failed to fetch topics for sitemap:', error);
  }

  try {
    // Fetch Quran surahs (1-114)
    const surahRoutes = Array.from({ length: 114 }, (_, i) => ({
      url: `${siteUrl}/quran/${i + 1}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
    dynamicRoutes = [...dynamicRoutes, ...surahRoutes];
  } catch (error) {
    console.error('Failed to generate surah routes:', error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
