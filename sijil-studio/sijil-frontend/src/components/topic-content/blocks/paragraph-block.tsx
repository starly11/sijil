interface ParagraphBlockProps {
  block: {
    text?: string;
    html?: string;
    contains_formula?: boolean;
    key_terms_in_text?: string[];
  };
}

export function ParagraphBlock({ block }: ParagraphBlockProps) {
  const html = block.html?.trim();
  const text = block.text?.trim();

  if (html) {
    return (
      <div
        className="mb-4 leading-relaxed [&_p]:mb-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (text) {
    return <p className="mb-4 leading-relaxed">{text}</p>;
  }

  return null;
}
