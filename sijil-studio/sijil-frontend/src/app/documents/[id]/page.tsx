import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Document, DocumentAggregates, Topic } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TopicCard } from '@/components/topics/topic-card';

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DocumentPageProps): Promise<Metadata> {
  const { id } = await params;
  const docRes = await api.get<Document>(API_ENDPOINTS.DOCUMENT(id));
  const doc = docRes.success ? docRes.data : null;

  return {
    title: doc?.title || 'Document Not Found',
    description: doc?.title ? `View ${doc.title}` : '',
  };
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  // Fetch all in parallel
  const [docRes, aggregatesRes, topicsRes] = await Promise.all([
    api.get<Document>(API_ENDPOINTS.DOCUMENT(id)),
    api.get<DocumentAggregates>(API_ENDPOINTS.DOCUMENT_AGGREGATES(id)),
    api.get<Topic[]>(API_ENDPOINTS.DOCUMENT_TOPICS(id)),
  ]);

  if (!docRes.success || !docRes.data) {
    notFound();
  }

  const document = docRes.data;
  const aggregates = aggregatesRes.success ? aggregatesRes.data : null;
  const topics = topicsRes.success ? topicsRes.data : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
          {document.title}
        </h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {document.subject && (
            <Badge variant="default">{document.subject}</Badge>
          )}
          {document.grade_numeric && (
            <Badge variant="outline">Grade {document.grade_numeric}</Badge>
          )}
        </div>
      </div>

      {/* Aggregates */}
      {aggregates && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{aggregates.topics}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Content Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{aggregates.content_blocks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Formulas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{aggregates.formulas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{aggregates.assessments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{aggregates.assets}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Topics */}
      <div>
        <h2 className="text-xl font-serif font-semibold text-foreground mb-6">
          Topics in this Document
        </h2>
        {!topics || topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No topics available for this document yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <TopicCard key={topic._id} topic={topic} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
