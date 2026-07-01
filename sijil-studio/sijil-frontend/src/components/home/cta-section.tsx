import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
            Ready to Start Learning?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
            Access thousands of educational resources aligned with the Pakistani curriculum. Free for all students and educators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/documents">
              <Button size="lg" variant="secondary" className="min-h-[44px] bg-background text-foreground hover:bg-muted">
                Browse Collection
              </Button>
            </Link>
            <Link href="/search">
              <Button 
                size="lg" 
                variant="outline" 
                className="min-h-[44px] bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Advanced Search
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
