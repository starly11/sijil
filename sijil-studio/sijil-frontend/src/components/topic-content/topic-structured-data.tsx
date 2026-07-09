interface TopicStructuredDataProps {
  topic: {
    meta?: {
      title?: string;
      url_path?: string;
      subject?: string;
      grade_numeric?: number;
      seo?: {
        meta_description?: string;
        breadcrumb?: string[];
        json_ld_types?: string[];
      };
      geo?: {
        llm_summary?: string;
        authoritative_source?: string;
        citation_format?: string;
      };
    };
    faq?: Array<{ question?: string; answer?: string }>;
  };
  baseUrl?: string;
}

export function TopicStructuredData({ topic, baseUrl = '' }: TopicStructuredDataProps) {
  const meta = topic.meta;
  const title = meta?.title || 'Topic';
  const description = meta?.seo?.meta_description || meta?.geo?.llm_summary || '';
  const url = meta?.url_path ? `${baseUrl}${meta.url_path}` : undefined;

  const article = {
    '@context': 'https://schema.org',
    '@type': meta?.seo?.json_ld_types?.[0] || 'LearningResource',
    name: title,
    description,
    url,
    educationalLevel: meta?.grade_numeric ? `Grade ${meta.grade_numeric}` : undefined,
    about: meta?.subject,
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Organization',
      name: 'Sijil',
    },
    citation: meta?.geo?.citation_format || meta?.geo?.authoritative_source,
  };

  const faqItems = (topic.faq || []).filter(f => f.question && f.answer);
  const faq = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  } : null;

  const breadcrumbItems = meta?.seo?.breadcrumb || [];
  const breadcrumb = breadcrumbItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((name, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: index === breadcrumbItems.length - 1 ? url : undefined,
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
      {faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
        />
      )}
      {breadcrumb && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
      )}
    </>
  );
}
