interface ActivityBlockProps {
  block: {
    title?: string;
    activity_type?: string;
    apparatus?: string[];
    procedure_steps?: string[];
    precautions?: string[];
    expected_result?: string;
  };
}

export function ActivityBlock({ block }: ActivityBlockProps) {
  if (!block.title) return null;

  return (
    <div className="my-6 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-md">
      <h4 className="font-semibold text-lg mb-3 text-purple-800 dark:text-purple-200">
        {block.activity_type ? `${block.activity_type}: ` : ''}{block.title}
      </h4>
      
      {block.apparatus && block.apparatus.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold mb-2">Apparatus:</h5>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            {block.apparatus.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {block.procedure_steps && block.procedure_steps.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold mb-2">Procedure:</h5>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            {block.procedure_steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      
      {block.precautions && block.precautions.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold mb-2">Precautions:</h5>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            {block.precautions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {block.expected_result && (
        <div>
          <h5 className="font-semibold mb-2">Expected Result:</h5>
          <p className="text-muted-foreground">{block.expected_result}</p>
        </div>
      )}
    </div>
  );
}
