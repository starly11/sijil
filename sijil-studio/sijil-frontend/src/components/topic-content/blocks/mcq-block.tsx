interface MCQBlockProps {
  block: {
    mcq_id?: string;
    question_number?: string;
    question_text?: string;
    options?: {
      a: string;
      b: string;
      c: string;
      d: string;
    };
    correct_answer?: "a" | "b" | "c" | "d";
    explanation?: string;
    difficulty?: "easy" | "medium" | "hard";
    bloom_level?: string;
    source_page?: number;
    past_paper_years?: string[];
  };
}

export function MCQBlock({ block }: MCQBlockProps) {
  if (!block.question_text) return null;

  const optionsArray = block.options 
    ? [
        { option_letter: 'a', option_text: block.options.a },
        { option_letter: 'b', option_text: block.options.b },
        { option_letter: 'c', option_text: block.options.c },
        { option_letter: 'd', option_text: block.options.d },
      ]
    : [];

  return (
    <div className="my-6 p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-md">
      <div className="flex items-start justify-between mb-4">
        <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
          {block.question_number ? `Question ${block.question_number}` : 'Multiple Choice Question'}
        </h4>
        {block.difficulty && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            block.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            block.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {block.difficulty}
          </span>
        )}
      </div>
      
      <p className="text-muted-foreground mb-4">{block.question_text}</p>
      
      {optionsArray.length > 0 && (
        <div className="space-y-2 mb-4">
          {optionsArray.map((option, index) => (
            <div 
              key={index}
              className={`p-3 rounded-md border ${
                option.option_letter === block.correct_answer 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                  : 'border-border'
              }`}
            >
              <span className="font-medium">{option.option_letter.toUpperCase()}.</span>{' '}
              <span>{option.option_text}</span>
            </div>
          ))}
        </div>
      )}
      
      {block.explanation && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h5 className="font-semibold mb-2">Explanation:</h5>
          <p className="text-sm text-muted-foreground">{block.explanation}</p>
        </div>
      )}
      
      {block.past_paper_years && block.past_paper_years.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          <strong>Past Papers:</strong> {block.past_paper_years.join(', ')}
        </div>
      )}
      
      {block.bloom_level && (
        <div className="mt-2 text-xs text-muted-foreground">
          <strong>Bloom Level:</strong> {block.bloom_level}
        </div>
      )}
      
      {block.source_page && (
        <div className="mt-1 text-xs text-muted-foreground">
          <strong>Source:</strong> Page {block.source_page}
        </div>
      )}
    </div>
  );
}
