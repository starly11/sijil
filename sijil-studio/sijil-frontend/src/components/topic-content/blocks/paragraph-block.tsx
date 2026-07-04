interface ParagraphBlockProps {
  block: {
    text?: string;
    contains_formula?: boolean;
    key_terms_in_text?: string[];
  };
}

export function ParagraphBlock({ block }: ParagraphBlockProps) {
  return <p className="mb-4">{block.text}</p>;
}
