import Link from 'next/link';
import { ArrowRight, Atom, FlaskConical, Dna, Calculator, Laptop, BookOpen, Type, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubjectCardProps {
  subject: string;
  href: string;
}

const subjectIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Biology: Dna,
  Mathematics: Calculator,
  ComputerScience: Laptop,
  English: BookOpen,
  Urdu: Type,
};

export function SubjectCard({ subject, href }: SubjectCardProps) {
  const IconComponent = subjectIcons[subject] || HelpCircle;

  return (
    <div className="group rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
      <div className="p-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
          <IconComponent className="h-6 w-6 stroke-[2]" />
        </div>
        <h3 className="text-xl font-serif font-bold text-foreground mb-1">{subject}</h3>
        <p className="text-sm text-muted-foreground">
          Grades 9-12 available
        </p>
      </div>
      <div className="p-6 pt-0 mt-auto">
        <Link href={href} className="w-full block">
          <Button 
            variant="ghost" 
            className="w-full justify-center group-hover:bg-primary group-hover:text-primary-foreground min-h-[44px]"
            aria-label={`Explore ${subject} core collection`}
          >
            Explore
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
