'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';

interface HreflangTag {
  lang: string;
  url: string;
}

interface HreflangTagsProps {
  tags?: HreflangTag[];
  defaultLang?: string;
}

export const HreflangTags: React.FC<HreflangTagsProps> = ({
  tags,
  defaultLang = 'en',
}) => {
  const pathname = usePathname();
  const siteUrl = siteConfig.url;

  // If no tags provided, return just x-default
  if (!tags || tags.length === 0) {
    return (
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${siteUrl}${pathname}`}
      />
    );
  }

  return (
    <>
      {tags.map((tag) => (
        <link
          key={tag.lang}
          rel="alternate"
          hrefLang={tag.lang}
          href={tag.url}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={tags.find((t) => t.lang === defaultLang)?.url || `${siteUrl}${pathname}`}
      />
    </>
  );
};
