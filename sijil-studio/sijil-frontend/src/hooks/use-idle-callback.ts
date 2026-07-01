'use client';

import * as React from 'react';

export const useIdleCallback = (callback: () => void, dependencies?: React.DependencyList) => {
  const callbackRef = React.useRef(callback);

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...(dependencies || [])]);

  React.useEffect(() => {
    let rafId: number;

    const execute = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          callbackRef.current();
        });
      } else {
        rafId = requestAnimationFrame(() => {
          setTimeout(() => {
            callbackRef.current();
          }, 1);
        });
      }
    };

    execute();

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, dependencies);
};
