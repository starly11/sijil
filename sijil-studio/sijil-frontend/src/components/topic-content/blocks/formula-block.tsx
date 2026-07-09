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
    formula_id?: string;
    name?: string;
    latex?: string;
    text?: string;
    formula_type?: "definition" | "derivation" | "law" | "empirical";
    variables?: Array<{
      symbol: string;
      name: string;
      unit?: string;
      description?: string;
    }>;
    source_page?: number;
    subject_area?: string;
    block_order_ref?: number;
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
    <div className="my-6 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-md">
      {block.name && (
        <h4 className="font-semibold text-lg mb-2 text-indigo-800 dark:text-indigo-200">
          {block.formula_type ? `${block.formula_type.charAt(0).toUpperCase() + block.formula_type.slice(1)}: ` : ''}
          {block.name}
        </h4>
      )}
      <div
        ref={ref}
        className={`my-4 ${block.display_mode ? 'text-center' : ''}`}
      />
      {block.text && (
        <p className="text-muted-foreground mt-2">{block.text}</p>
      )}
      {block.variables && block.variables.length > 0 && (
        <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
          <h5 className="font-semibold mb-2 text-sm">Variables:</h5>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {block.variables.map((variable, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{variable.symbol}</span>
                <span className="text-muted-foreground">
                  {variable.name}
                  {variable.unit && <span className="text-xs text-muted-foreground ml-1">({variable.unit})</span>}
                  {variable.description && <span className="block text-xs mt-1">{variable.description}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {block.source_page && (
        <p className="text-xs text-muted-foreground mt-2">Source: Page {block.source_page}</p>
      )}
    </div>
  );
}
