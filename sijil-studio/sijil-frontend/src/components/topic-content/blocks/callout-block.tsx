interface CalloutBlockProps {
  block: {
    variant?: string;
    title?: string;
    content?: string;
  };
}

const variantStyles: Record<string, string> = {
  'do-you-know': 'bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  'quick-quiz': 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800',
  'islamic-value': 'bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800',
  note: 'bg-gray-50 border border-gray-200 dark:bg-gray-900/30 dark:border-gray-800',
};

export function CalloutBlock({ block }: CalloutBlockProps) {
  return (
    <div className={`my-6 p-4 rounded-md border ${variantStyles[block.variant || 'note']}`}>
      {block.title && (
        <h4 className="font-semibold mb-2">
          {block.title}
        </h4>
      )}
      {block.content && (
        <p className="text-muted-foreground">{block.content}</p>
      )}
    </div>
  );
}
