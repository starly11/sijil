'use client';

import * as React from 'react';
import Link from 'next/link';

interface PrefetchLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  children: React.ReactNode;
  prefetchOnHover?: boolean;
  prefetchOnViewport?: boolean;
}

export const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  children,
  href,
  prefetchOnHover = true,
  prefetchOnViewport = true,
  ...props
}) => {
  const linkRef = React.useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (prefetchOnViewport && linkRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const router = require('next/navigation');
              if (typeof router.prefetch === 'function') {
                router.prefetch(href.toString());
              }
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(linkRef.current);

      return () => {
        if (linkRef.current) {
          observer.unobserve(linkRef.current);
        }
      };
    }
  }, [href, prefetchOnViewport]);

  const handleMouseEnter = () => {
    if (prefetchOnHover) {
      setIsHovered(true);
      try {
        const router = require('next/navigation');
        if (typeof router.prefetch === 'function') {
          router.prefetch(href.toString());
        }
      } catch (e) {
        console.error('Prefetch failed', e);
      }
    }
  };

  return (
    <Link
      ref={linkRef}
      href={href}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
};
