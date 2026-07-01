interface ParagraphBlockProps {
  block: {
    content?: string;
  };
}

export function ParagraphBlock({ block }: ParagraphBlockProps) {
  return <p className="mb-4">{block.content}</p>;
}
