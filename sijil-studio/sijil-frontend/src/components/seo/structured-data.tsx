'use client';

import * as React from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'Article' | 'Course';
  data: Record<string, any>;
}

export const StructuredData: React.FC<StructuredDataProps> = ({
  type,
  data,
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
