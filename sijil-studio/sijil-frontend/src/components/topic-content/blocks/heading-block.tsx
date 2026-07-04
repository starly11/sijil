import React from 'react';

interface HeadingBlockProps {
  block: {
    level?: number;
    text?: string;
    slug_anchor?: string;
  };
}

export function HeadingBlock({ block }: HeadingBlockProps) {
  const level = block.level || 2;
  const classNames = `font-serif font-bold ${
    level === 1 ? 'text-3xl mt-8 mb-4' :
    level === 2 ? 'text-2xl mt-6 mb-3' :
    level === 3 ? 'text-xl mt-5 mb-2' : 'text-lg mt-4 mb-2'
  }`;
  return React.createElement(`h${level}`, { 
    className: classNames,
    id: block.slug_anchor
  }, block.text);
}
