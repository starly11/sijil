import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors">
            Pakistani Curriculum
          </div>
          
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-foreground">
            Digital Textbooks for{' '}
            <span className="text-primary block sm:inline">Modern Learning</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Comprehensive educational content for grades 9-12. Access physics, chemistry, biology, and mathematics with interactive topics, assessments, and exports.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/documents">
              <Button size="lg" className="min-h-[44px]">Browse Documents</Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline" className="min-h-[44px]">Search Content</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
