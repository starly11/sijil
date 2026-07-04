interface ComparisonViewBlockProps {
  block: {
    caption?: string;
    headers?: string[];
    rows?: string[][];
    design_hint?: string;
  };
}

export function ComparisonViewBlock({ block }: ComparisonViewBlockProps) {
  if (!block.headers || !block.rows || block.rows.length === 0) return null;

  return (
    <figure className="my-8 overflow-x-auto">
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted">
            {block.headers.map((header, i) => (
              <th key={i} className="border border-border p-2 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border border-border p-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {block.caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2">
          {block.caption}
        </figcaption>
      )}
      {block.design_hint && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          Design hint: {block.design_hint}
        </p>
      )}
    </figure>
  );
}
