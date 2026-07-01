'use client';

import React from 'react';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/lib/theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Unified Client-Side Providers Layer.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryProvider>
  );
}
