import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Structural wrapper composing standard app layout wireframes.
 * Set as Server Component by default to leverage zero bundling runtime overhead layouts.
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Skip Navigation option optimizing accessibility user tab mechanics flows */}
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <Header />

      <main id="main-content" className="flex-1 flex flex-col outline-none">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumbs />
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
