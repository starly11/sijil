interface SearchHighlightsProps {
  text: string;
  query: string;
}

export function SearchHighlights({ text, query }: SearchHighlightsProps) {
  if (!query || !text) {
    return <>{text}</>;
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const terms = query.split(/\s+/).filter(term => term.length > 0);
  const regex = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = terms.some(term => 
          part.toLowerCase() === term.toLowerCase()
        );
        
        return isMatch ? (
          <mark key={index} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </>
  );
}
