interface NumericalBlockProps {
  block: {
    problem_text?: string;
    given?: Record<string, string>;
    required?: string;
    solution_steps?: string[];
    final_answer?: string;
  };
}

export function NumericalBlock({ block }: NumericalBlockProps) {
  if (!block.problem_text) return null;

  return (
    <div className="my-6 p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md">
      <h4 className="font-semibold text-lg mb-3 text-orange-800 dark:text-orange-200">
        Numerical Problem
      </h4>
      
      <div className="mb-4">
        <p className="text-muted-foreground">{block.problem_text}</p>
      </div>
      
      {block.given && Object.keys(block.given).length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold mb-2">Given:</h5>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            {Object.entries(block.given).map(([key, value]) => (
              <li key={key}><strong>{key}:</strong> {value}</li>
            ))}
          </ul>
        </div>
      )}
      
      {block.required && (
        <div className="mb-4">
          <h5 className="font-semibold mb-2">Required:</h5>
          <p className="text-muted-foreground">{block.required}</p>
        </div>
      )}
      
      {block.solution_steps && block.solution_steps.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold mb-2">Solution:</h5>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            {block.solution_steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      
      {block.final_answer && (
        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
          <h5 className="font-semibold mb-2">Answer:</h5>
          <p className="text-muted-foreground font-bold text-lg">{block.final_answer}</p>
        </div>
      )}
    </div>
  );
}
