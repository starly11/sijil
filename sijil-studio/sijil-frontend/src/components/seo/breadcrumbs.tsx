'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { structuredData } from '@/lib/seo/schema-generators';

export function Breadcrumbs() {
  const pathname = usePathname();
  const [items, setItems] = useState<{ label: string; href: string }[]>([]);

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/' }];
    
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Pretty print labels
      let label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      if (segment === 'admin') label = 'Admin';
      if (segment === 'quran') label = 'Quran';
      if (segment === 'subjects') label = 'Subjects';
      if (segment === 'documents') label = 'Documents';
      if (segment === 'topics') label = 'Topics';
      if (segment === 'search') label = 'Search';
      if (segment === 'exports') label = 'Exports';
      if (segment === 'status') label = 'Status';
      
      // Handle dynamic routes
      if (segment.match(/^\[.*\]$/)) {
        label = 'Details';
      }
      
      breadcrumbs.push({ label, href: currentPath });
    });

    setItems(breadcrumbs);
  }, [pathname]);

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-muted-foreground/50">/</span>
            )}
            {index === items.length - 1 ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <a 
                href={item.href} 
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
      {/* Structured Data for Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData.breadcrumbList(items.map(i => ({ name: i.label, item: `https://sijil.com${i.href}` }))))
        }}
      />
    </nav>
  );
}
