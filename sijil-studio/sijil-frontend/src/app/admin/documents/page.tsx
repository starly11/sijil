'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface Document {
  _id: string;
  document_metadata: {
    document_id: string;
    slug_global: string;
    title: string;
    created_at: string;
  };
  stats: {
    topic_count: number;
  };
  preview_url: string;
}

interface DocumentsResponse {
  success: boolean;
  data: {
    items: Document[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch(`/api/admin/documents?page=${page}&limit=20`);
        const data: DocumentsResponse = await res.json();
        
        if (data.success) {
          setDocuments(data.data.items);
          setTotalPages(data.data.pagination.totalPages);
          setTotalDocs(data.data.pagination.total);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [page]);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">All Documents</h1>
          <p className="text-gray-600">
            View and manage all ingested books and documents with preview links
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">
              Import a book or document to get started
            </p>
            <Link href="/admin/import">
              <Button>Import Document</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {documents.length} of {totalDocs} documents
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                      Title
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                      Slug
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                      Topics
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                      Created
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc._id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">{doc.document_metadata.title}</div>
                        <div className="text-xs text-gray-500">
                          ID: {doc.document_metadata.document_id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {doc.document_metadata.slug_global}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {doc.stats.topic_count} topics
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(doc.document_metadata.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={doc.preview_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </Link>
                          <Link href={`/admin/documents/${doc.document_metadata.document_id}`}>
                            <Button variant="outline" size="sm">
                              Details
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
