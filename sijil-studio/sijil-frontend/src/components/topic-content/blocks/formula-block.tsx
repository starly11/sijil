'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    katex?: {
      render: (
        math: string,
        element: HTMLElement,
        options?: {
          displayMode?: boolean;
          throwOnError?: boolean;
        }
      ) => void;
    };
  }
}

interface FormulaBlockProps {
  block: {
    latex?: string;
    display_mode?: boolean;
  };
}

export function FormulaBlock({ block }: FormulaBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && window.katex && block.latex) {
      try {
        window.katex.render(block.latex, ref.current, {
          displayMode: !!block.display_mode,
          throwOnError: false,
        });
      } catch (err) {
        console.error('KaTeX error:', err);
      }
    }
  }, [block.latex, block.display_mode]);

  return (
    <div
      ref={ref}
      className={`my-4 ${block.display_mode ? 'text-center' : ''}`}
    />
  );
}
