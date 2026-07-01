import { siteConfig } from '@/config/site';

/**
 * JSON-LD Schema Generators for SEO/AEO
 * Based on Schema.org vocabulary
 */

// Educational Organization Schema (Homepage)
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.github,
    ].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: siteConfig.email,
    },
  };
};

// Course Schema (Subject Pages)
export const generateCourseSchema = (subject: {
  name: string;
  description: string;
  slug: string;
  gradeCount?: number;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: subject.name,
    description: subject.description,
    url: `${siteConfig.url}/subjects/${subject.slug}`,
    provider: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      sameAs: siteConfig.url,
    },
    educationalLevel: subject.gradeCount ? `Grades 1-${subject.gradeCount}` : 'All Levels',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      inLanguage: 'en',
    },
  };
};

// Book Schema (Document Pages)
export const generateBookSchema = (book: {
  title: string;
  description?: string;
  id: string;
  subject?: string;
  grade?: number;
  author?: string;
  datePublished?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    description: book.description || book.title,
    url: `${siteConfig.url}/documents/${book.id}`,
    author: book.author
      ? {
          '@type': 'Person',
          name: book.author,
        }
      : {
          '@type': 'Organization',
          name: siteConfig.name,
        },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    educationalUse: book.subject || 'Educational',
    educationalLevel: book.grade ? `Grade ${book.grade}` : 'All Levels',
    datePublished: book.datePublished || new Date().toISOString(),
    inLanguage: 'en',
    isPartOf: {
      '@type': 'CreativeWorkSeries',
      name: book.subject || 'Educational Content',
    },
  };
};

// LearningResource Schema (Topic Pages)
export const generateLearningResourceSchema = (topic: {
  title: string;
  description?: string;
  slug: string;
  subject?: string;
  grade?: number;
  keywords?: string[];
  timeRequired?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: topic.title,
    description: topic.description || topic.title,
    url: `${siteConfig.url}/topics/${topic.slug}`,
    educationalLevel: topic.grade ? `Grade ${topic.grade}` : 'All Levels',
    educationalUse: topic.subject || 'Educational',
    learningResourceType: 'Text',
    inLanguage: 'en',
    keywords: topic.keywords?.join(', ') || topic.subject || 'education',
    typicalAgeRange: topic.grade ? `${topic.grade * 5 - 4}-${topic.grade * 5} years` : '5-18 years',
    timeRequired: topic.timeRequired || 'PT30M',
    provider: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      sameAs: siteConfig.url,
    },
    hasPart: topic.keywords?.map((keyword, index) => ({
      '@type': 'DefinedTerm',
      name: keyword,
      termCode: index.toString(),
      inDefinedTermSet: topic.subject || 'Educational Topics',
    })),
  };
};

// Article Schema (Blog/Content Pages)
export const generateArticleSchema = (article: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    url: article.url,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author,
        }
      : {
          '@type': 'Organization',
          name: siteConfig.name,
        },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
    image: article.image ? `${siteConfig.url}${article.image}` : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
};

// BreadcrumbList Schema (Navigation)
export const generateBreadcrumbSchema = (items: Array<{
  name: string;
  url: string;
}>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

// FAQPage Schema (FAQ Sections)
export const generateFAQSchema = (faqs: Array<{
  question: string;
  answer: string;
}>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

// SearchAction Schema (Site Search)
export const generateSearchActionSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
};

// Helper to serialize schema to JSON-LD script tag
export const serializeSchema = (schema: object): string => {
  return JSON.stringify(schema, null, 2);
};

// Combined schema generator for pages with multiple entities
export const generateCombinedSchema = (...schemas: object[]) => {
  if (schemas.length === 1) {
    return schemas[0];
  }
  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };
};
