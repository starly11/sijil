import { SubjectCard } from './subject-card';
import type { Subject } from '@/types/api';

interface CollectionsGridProps {
  subjects: Subject[];
}

export function CollectionsGrid({ subjects }: CollectionsGridProps) {
  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold mb-4 text-foreground">Browse by Subject</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our comprehensive collection organized by subject and grade level
          </p>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center p-12 border border-dashed rounded-xl bg-background">
            <p className="text-muted-foreground">No subjects found at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {subjects.map((subjectData) => (
              <SubjectCard 
                key={subjectData.slug} 
                subject={subjectData.subject}
                href={`/subjects/${subjectData.slug}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
