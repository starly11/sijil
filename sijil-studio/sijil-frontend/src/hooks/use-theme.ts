'use client';

import { useContext } from 'react';
import { ThemeContext } from '@/lib/theme-provider';

/**
 * Custom hook providing secure client access to local workspace theme states.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be wrapped cleanly within a valid <ThemeProvider /> context.');
  }
  return context;
}
