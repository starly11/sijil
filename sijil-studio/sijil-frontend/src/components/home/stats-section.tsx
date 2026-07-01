import { HomepageStats } from '@/types/homepage';

interface StatsSectionProps {
  data: HomepageStats;
}

export function StatsSection({ data }: StatsSectionProps) {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const stats = [
    { label: 'Total Documents', value: data.documents },
    { label: 'Total Topics', value: data.topics },
    { label: 'Available Subjects', value: data.subjects },
    { label: 'Grade Levels', value: data.grades },
  ];

  return (
    <section aria-labelledby="stats-heading" className="py-16 border-y bg-background">
      <h2 id="stats-heading" className="sr-only">Platform Statistics</h2>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-serif font-bold text-primary">
                {formatNumber(stat.value)}
              </div>
              <div className="text-sm md:text-base text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
