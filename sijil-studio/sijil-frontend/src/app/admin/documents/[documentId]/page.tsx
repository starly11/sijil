'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, BookOpen, FileText, Layers } from 'lucide-react';

interface Topic {
  _id: string;
  title: string;
  slug_global: string;
  display_order: number;
  preview_url: string;
}

interface DocumentDetails {
  success: boolean;
  data: {
    document: any;
    topics: Topic[];
    total_topics: number;
    preview_url: string;
  };
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DocumentDetails | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/admin/documents/${documentId}`);
        const result: DocumentDetails = await res.json();
        
        if (result.success) {
          setData(result);
        } else {
          router.push('/admin/documents');
        }
      } catch (error) {
        console.error('Failed to fetch document details:', error);
        router.push('/admin/documents');
      } finally {
        setLoading(false);
      }
    }

    if (documentId) {
      fetchDetails();
    }
  }, [documentId, router]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return null;
  }

  const { document: doc, topics, preview_url } = data.data;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <Link href="/admin/documents">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{doc.document_metadata.title}</h1>
              <p className="text-gray-600">
                Document ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{doc.document_metadata.document_id}</code>
              </p>
            </div>
            <Link href={preview_url} target="_blank" rel="noopener noreferrer">
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Book
              </Button>
            </Link>
          </div>
        </div>

        {/* Document Metadata */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Document Information
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-600">Global Slug</dt>
              <dd className="font-medium">{doc.document_metadata.slug_global}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Document Type</dt>
              <dd className="font-medium">{doc.document_metadata.type || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Created</dt>
              <dd className="font-medium">
                {new Date(doc.document_metadata.created_at).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Version</dt>
              <dd className="font-medium">{doc.document_metadata.version || 1}</dd>
            </div>
          </dl>
        </div>

        {/* Topics List */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-semibold flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              Topics ({topics.length})
            </h2>
          </div>
          
          {topics.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No topics found for this document
            </div>
          ) : (
            <ul className="divide-y">
              {topics.map((topic, index) => (
                <li key={topic._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-medium">{topic.title}</h3>
                        <p className="text-sm text-gray-500">
                          Slug: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{topic.slug_global}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={topic.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </Link>
                      <Link href={`/topics/${topic.slug_global}`}>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Topic
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
