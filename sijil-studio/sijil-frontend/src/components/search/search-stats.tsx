interface SearchStatsProps {
  total: number;
  time: number;
  query: string;
}

export function SearchStats({ total, time, query }: SearchStatsProps) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{total.toLocaleString()}</span> results found for "<span className="font-medium">{query}</span>"
        {time > 0 && (
          <span className="ml-2 text-muted-foreground">({time.toFixed(2)} seconds)</span>
        )}
      </p>
    </div>
  );
}
