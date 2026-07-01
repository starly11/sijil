'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'profile';
}

export const useSEOMetadata = () => {
  const pathname = usePathname();
  const siteName = 'Sijil';

  return React.useCallback((metadata: SEOMetadata) => {
    // Update title
    if (typeof document !== 'undefined') {
      if (metadata.title) {
        document.title = `${metadata.title} | ${siteName}`;
      } else {
        document.title = `${siteName} - Digital Textbook Platform`;
      }

      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', metadata.description || 'Explore topics, documents, and assessments on Sijil');
      } else {
        const newMetaDesc = document.createElement('meta');
        newMetaDesc.setAttribute('name', 'description');
        newMetaDesc.setAttribute('content', metadata.description || 'Explore topics, documents, and assessments on Sijil');
        document.head.appendChild(newMetaDesc);
      }

      // Update keywords
      if (metadata.keywords && metadata.keywords.length > 0) {
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        const keywordsString = metadata.keywords.join(', ');
        if (metaKeywords) {
          metaKeywords.setAttribute('content', keywordsString);
        } else {
          const newMetaKeywords = document.createElement('meta');
          newMetaKeywords.setAttribute('name', 'keywords');
          newMetaKeywords.setAttribute('content', keywordsString);
          document.head.appendChild(newMetaKeywords);
        }
      }

      // Update Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        const ogTitleContent = metadata.title ? `${metadata.title} | ${siteName}` : `${siteName} - Digital Textbook Platform`;
        ogTitle.setAttribute('content', ogTitleContent);
      }

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', metadata.description || 'Explore topics, documents, and assessments on Sijil');
      }

      if (metadata.image) {
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) {
          ogImage.setAttribute('content', metadata.image);
        } else {
          const newOgImage = document.createElement('meta');
          newOgImage.setAttribute('property', 'og:image');
          newOgImage.setAttribute('content', metadata.image);
          document.head.appendChild(newOgImage);
        }
      }
    }
  }, [pathname]);
};
