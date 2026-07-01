'use client';

import * as React from 'react';

export const useOptimizedResize = (
  onResize: () => void,
  debounceDelay: number = 100
) => {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleResize = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onResize();
    }, debounceDelay);
  }, [onResize, debounceDelay]);

  React.useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleResize]);
};
