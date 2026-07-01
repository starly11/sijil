import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Subject } from '@/types/api';
import type { Document } from '@/types/homepage';
import { DocumentCard } from '@/components/documents/document-card';

export default async function SubjectPage({ params }: { params: { slug: string } }) {
  let subject: Subject | null = null;
  let documents: Document[] = [];

  try {
    // First get subjects to find our current subject
    const subjectsRes = await api.get<{ success: boolean; data: Subject[] }>(API_ENDPOINTS.SUBJECTS);
    if (subjectsRes.data?.success) {
      subject = subjectsRes.data.data?.find((s) => s.slug === params.slug) || null;
    }

    // Then get documents and filter by subject
    const docsRes = await api.get<{ success: boolean; data: any[] }>(API_ENDPOINTS.DOCUMENTS);
    if (docsRes.data?.success && subject) {
      documents = (docsRes.data.data || [])
        .filter((doc) => subject && doc.document_metadata?.subject === subject.subject)
        .map((doc) => ({
          document_id: doc.document_metadata?.document_id || '',
          title: doc.document_metadata?.title || '',
          document_type: doc.document_metadata?.document_type || '',
          subject: doc.document_metadata?.subject || '',
          grade_level: doc.document_metadata?.grade_level?.toString() || '',
          slug: doc.seo_master?.slug || '',
          url_path: doc.url_path || '',
          arrived_at: doc.created_at || new Date().toISOString(),
        }));
    }
  } catch (error) {
    console.error('Failed to fetch subject data:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-8 text-foreground">
        {subject?.subject || params.slug}
      </h1>
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No documents for this subject yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc, index) => (
            <DocumentCard
              key={doc.document_id || `doc-${index}`}
              document={doc}
            />
          ))}
        </div>
      )}
    </div>
  );
}
