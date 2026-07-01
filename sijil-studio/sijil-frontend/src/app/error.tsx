'use client';

import { useEffect } from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Pipeline diagnostics to centralized monitoring systems can hook here
    console.error('Unhandled UI Shell Exception:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 py-16 text-center shadow-xs">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight">Core App Fault Detected</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        An unexpected execution exception occurred within this screen session. {error.message}
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
      >
        Re-hydrate System Instance
      </button>
    </div>
  );
}
