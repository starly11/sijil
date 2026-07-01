import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Document } from '@/types/homepage';
import { DocumentCard } from '@/components/documents/document-card';

export const metadata = {
  title: 'Documents | Sijil',
  description: 'Browse all documents in the Sijil collection',
};

export default async function DocumentsPage() {
  let documents: Document[] = [];
  try {
    const response = await api.get<{ success: boolean; data: any[] }>(API_ENDPOINTS.DOCUMENTS);
    if (response.data?.success) {
      documents = (response.data?.data || []).map((doc) => ({
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
    console.error('Failed to fetch documents:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-8 text-foreground">Documents</h1>
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No documents available yet.</p>
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
