'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items?: BreadcrumbItem[];
}

export const BreadcrumbSchema: React.FC<BreadcrumbSchemaProps> = ({
  items,
}) => {
  const pathname = usePathname();
  const siteUrl = siteConfig.url;

  // Auto-generate from path if no items provided
  const defaultItems: BreadcrumbItem[] = React.useMemo(() => {
    if (items) return items;

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', url: siteUrl },
    ];

    let currentUrl = siteUrl;
    for (let i = 0; i < segments.length; i++) {
      currentUrl += `/${segments[i]}`;
      breadcrumbs.push({
        name: segments[i].charAt(0).toUpperCase() + segments[i].slice(1),
        url: currentUrl,
      });
    }

    return breadcrumbs;
  }, [pathname, items, siteUrl]);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: defaultItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
