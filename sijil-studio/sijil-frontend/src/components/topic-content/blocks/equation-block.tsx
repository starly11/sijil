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

interface EquationBlockProps {
  block: {
    latex?: string;
    text?: string;
  };
}

export function EquationBlock({ block }: EquationBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && window.katex && block.latex) {
      try {
        window.katex.render(block.latex, ref.current, {
          displayMode: false,
          throwOnError: false,
        });
      } catch (err) {
        console.error('KaTeX error:', err);
      }
    }
  }, [block.latex]);

  return (
    <div className="my-2 inline-block">
      <div ref={ref} className="inline" />
      {block.text && (
        <span className="ml-2 text-muted-foreground">{block.text}</span>
      )}
    </div>
  );
}
