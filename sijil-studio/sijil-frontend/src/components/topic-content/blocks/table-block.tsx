interface TableBlockProps {
  block: {
    table_id?: string;
    caption?: string;
  };
  tables?: any[];
}

export function TableBlock({ block, tables }: TableBlockProps) {
  const table = tables?.find((t: any) => t._id === block.table_id);
  if (!table || !table.data) return null;

  return (
    <figure className="my-8 overflow-x-auto">
      <table className="w-full border-collapse border border-border">
        <tbody>
          {table.data.map((row: any, i: number) => (
            <tr key={i}>
              {row.map((cell: any, j: number) => (
                <td key={j} className="border border-border p-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {(table.caption || block.caption) && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2">
          {table.caption || block.caption}
        </figcaption>
      )}
    </figure>
  );
}
