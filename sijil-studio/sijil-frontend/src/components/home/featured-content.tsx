import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DocumentCard } from '@/components/documents/document-card';
import { Document } from '@/types/homepage';

interface FeaturedContentProps {
  docs: Document[];
}

export function FeaturedContent({ docs }: FeaturedContentProps) {
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold mb-2 text-foreground">Recently Added</h2>
            <p className="text-muted-foreground">Latest content from our education collection</p>
          </div>
          <Link href="/documents">
            <Button variant="ghost" className="group min-h-[44px]">
              View All <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
            </Button>
          </Link>
        </div>

        {docs.length === 0 ? (
          <div className="text-center p-12 border border-dashed rounded-xl">
            <h3 className="text-lg font-semibold text-foreground mb-1">No documents yet</h3>
            <p className="text-muted-foreground">Check back soon for new Pakistani curriculum records.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs.slice(0, 6).map((doc, index) => (
              <DocumentCard key={`${doc.document_id || 'doc'}-${index}`} document={doc} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
