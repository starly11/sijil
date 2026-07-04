interface ListBlockProps {
  block: {
    list_type?: 'ordered' | 'unordered';
    items?: string[];
  };
}

export function ListBlock({ block }: ListBlockProps) {
  if (!block.items || block.items.length === 0) return null;

  if (block.list_type === 'ordered') {
    return (
      <ol className="list-decimal list-inside space-y-2 my-4">
        {block.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
    );
  }

  return (
    <ul className="list-disc list-inside space-y-2 my-4">
      {block.items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
