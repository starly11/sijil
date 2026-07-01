import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExampleBlockProps {
  block: {
    title?: string;
    content?: string;
  };
}

export function ExampleBlock({ block }: ExampleBlockProps) {
  return (
    <Card className="my-6">
      {block.title && (
        <CardHeader>
          <CardTitle className="text-lg">{block.title}</CardTitle>
        </CardHeader>
      )}
      {block.content && (
        <CardContent>{block.content}</CardContent>
      )}
    </Card>
  );
}
