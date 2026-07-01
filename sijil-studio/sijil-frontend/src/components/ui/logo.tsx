import { BookOpen } from 'lucide-react';

/**
 * Atomic Logo Component matching platform presentation profiles.
 */
export function Logo() {
  return (
    <div className="flex items-center space-x-2 text-primary">
      <BookOpen className="h-6 w-6 stroke-[2.5]" />
      <span className="font-serif text-xl font-bold tracking-tight text-foreground">
        Sijil
      </span>
    </div>
  );
}
