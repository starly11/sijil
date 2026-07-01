interface SearchStatsProps {
  total: number;
  time: number;
  query: string;
}

export function SearchStats({ total, time, query }: SearchStatsProps) {
  return (
    <div className="mb-6 pb-4 border-b border-gray-200">
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> results found for "<span className="font-medium">{query}</span>"
        {time > 0 && (
          <span className="ml-2 text-gray-500">({time.toFixed(2)} seconds)</span>
        )}
      </p>
    </div>
  );
}
