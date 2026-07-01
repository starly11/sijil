'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';

interface CanonicalLinkProps {
  url?: string;
}

export const CanonicalLink: React.FC<CanonicalLinkProps> = ({ url }) => {
  const pathname = usePathname();
  const siteUrl = siteConfig.url;
  const canonicalUrl = url || `${siteUrl}${pathname}`;

  return <link rel="canonical" href={canonicalUrl} />;
};
