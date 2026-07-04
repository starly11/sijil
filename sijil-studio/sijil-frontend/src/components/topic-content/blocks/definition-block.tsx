interface DefinitionBlockProps {
  block: {
    term?: string;
    definition_text?: string;
  };
}

export function DefinitionBlock({ block }: DefinitionBlockProps) {
  if (!block.term || !block.definition_text) return null;

  return (
    <div className="my-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
      <dt className="font-bold text-lg mb-2">{block.term}</dt>
      <dd className="text-muted-foreground">{block.definition_text}</dd>
    </div>
  );
}
