import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExampleBlockProps {
  block: {
    example_id?: string;
    example_number?: string;
    title?: string;
    problem_text?: string;
    solution_steps?: string[];
    final_answer?: string;
  };
}

export function ExampleBlock({ block }: ExampleBlockProps) {
  return (
    <Card className="my-6">
      {block.title && (
        <CardHeader>
          <CardTitle className="text-lg">{block.example_number ? `Example ${block.example_number}: ` : ''}{block.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {block.problem_text && (
          <div>
            <h4 className="font-semibold mb-2">Problem:</h4>
            <p className="text-muted-foreground">{block.problem_text}</p>
          </div>
        )}
        {block.solution_steps && block.solution_steps.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Solution:</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              {block.solution_steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}
        {block.final_answer && (
          <div>
            <h4 className="font-semibold mb-2">Answer:</h4>
            <p className="text-muted-foreground font-medium">{block.final_answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
