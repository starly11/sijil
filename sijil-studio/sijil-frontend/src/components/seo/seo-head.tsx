'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'profile';
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  type = 'website',
  canonicalUrl,
  noindex,
  nofollow,
}) => {
  const pathname = usePathname();
  const siteName = 'Sijil';
  const defaultTitle = 'Sijil - Digital Textbook Platform';
  const defaultDescription = 'Explore topics, documents, and assessments on Sijil';
  const fullTitle = title ? `${title} | ${siteName}` : defaultTitle;

  return (
    <>
      <title>{fullTitle}</title>
      <meta
        name="description"
        content={description || defaultDescription}
      />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      {(noindex || nofollow) && (
        <meta
          name="robots"
          content={
            noindex && nofollow
              ? 'noindex, nofollow'
              : noindex
                ? 'noindex'
                : 'nofollow'
          }
        />
      )}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta
        property="og:description"
        content={description || defaultDescription}
      />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta
        name="twitter:description"
        content={description || defaultDescription}
      />
      {image && <meta name="twitter:image" content={image} />}
    </>
  );
};
