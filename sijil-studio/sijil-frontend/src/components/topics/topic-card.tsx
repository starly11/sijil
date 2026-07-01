import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Topic } from '@/lib/api/types';

interface TopicCardProps {
  topic: Topic;
}

export function TopicCard({ topic }: TopicCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex-1">
        {topic.subject && (
          <div className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground uppercase tracking-wide mb-3">
            {topic.subject}
          </div>
        )}
        <h3 className="text-lg font-serif font-bold text-foreground mb-2">
          {topic.title}
        </h3>
        {topic.grade_numeric && (
          <p className="text-xs text-muted-foreground">
            Grade {topic.grade_numeric}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Link href={`/topics/${topic.slug_global || topic.slug}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            Read Topic
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
