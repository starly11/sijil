import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { breadcrumbSchema } from '@/lib/seo/schema-generators';

interface BreadcrumbItem {
  label: string;
  href: string;
}

// Get domain from environment or use default
const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://sijil.com';

export function Breadcrumbs() {
  const pathname = usePathname();
  const [items, setItems] = useState<BreadcrumbItem[]>([]);
  const [jsonLd, setJsonLd] = useState<string>('');

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always add Home
    breadcrumbs.push({ label: 'Home', href: '/' });

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip admin prefix in labels but keep path
      if (segment === 'admin' && index === 0) {
        breadcrumbs.push({ label: 'Admin', href: '/admin' });
        return;
      }

      // Format label: replace hyphens, capitalize
      let label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      
      // Special cases
      if (segment === 'documents') label = 'Documents';
      if (segment === 'subjects') label = 'Subjects';
      if (segment === 'quran') label = 'Quran';
      if (segment === 'search') label = 'Search';
      if (segment === 'exports') label = 'Exports';
      if (segment === 'status') label = 'Status';
      if (segment === 'topics') label = 'Topics';
      if (segment === 'formulas') label = 'Formulas';
      if (segment === 'ingest') label = 'Ingestion';
      if (segment === 'import') label = 'Batch Import';
      if (segment === 'analytics') label = 'Analytics';
      if (segment === 'performance') label = 'Performance';

      breadcrumbs.push({ label, href: currentPath });
    });

    setItems(breadcrumbs);

    // Generate Schema.org JSON-LD
    const schema = breadcrumbSchema(breadcrumbs.map((item, idx) => ({
      position: idx + 1,
      name: item.label,
      item: `${SITE_DOMAIN}${item.href}`
    })));
    setJsonLd(JSON.stringify(schema));
  }, [pathname]);

  if (items.length <= 1) return null; // Don't show on home

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <div key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
              )}
              
              {isLast ? (
                <span 
                  className="font-medium text-primary"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Button
                  variant="link"
                  className="h-auto p-0 font-normal text-muted-foreground hover:text-primary"
                  asChild
                >
                  <a href={item.href}>{item.label}</a>
                </Button>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
