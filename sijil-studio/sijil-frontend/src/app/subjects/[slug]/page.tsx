import { Metadata } from 'next';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Subject, Grade } from '@/types/api';
import type { Document } from '@/lib/api/types';
import { DocumentCard } from '@/components/documents/document-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SubjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SubjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug.charAt(0).toUpperCase() + slug.slice(1),
    description: `Browse ${slug} textbooks, notes, and study materials organized by grade level`,
  };
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { slug } = await params;
  
  let subject: Subject | null = null;
  let grades: Grade[] = [];
  let documentsByGrade: Record<string, Document[]> = {};

  try {
    // Get subject info
    const subjectsRes = await api.get<{ success: boolean; data: Subject[] }>(API_ENDPOINTS.SUBJECTS);
    if (subjectsRes.data?.success) {
      subject = subjectsRes.data.data?.find((s) => s.slug === slug) || null;
    }

    // Get grades for this subject
    if (subject) {
      const gradesRes = await api.get<{ success: boolean; data: Grade[] }>(
        API_ENDPOINTS.SUBJECT_GRADES(subject.subject)
      );
      if (gradesRes.data?.success) {
        grades = gradesRes.data.data || [];
      }

      // Get all documents and organize by grade
      const docsRes = await api.get<{ success: boolean; data: any[] }>(API_ENDPOINTS.DOCUMENTS);
      if (docsRes.data?.success) {
        const allDocs = docsRes.data.data || [];
        
        // Initialize grade buckets
        grades.forEach((grade) => {
          const gradeKey = String(grade.grade);
          documentsByGrade[gradeKey] = [];
        });

        // Group documents by grade
        allDocs.forEach((doc: any) => {
          if (doc.document_metadata?.subject === subject?.subject) {
            const gradeKey = String(doc.document_metadata?.grade_level || 'Other');
            if (!documentsByGrade[gradeKey]) {
              documentsByGrade[gradeKey] = [];
            }
            documentsByGrade[gradeKey].push({
              _id: doc._id || '',
              title: doc.document_metadata?.title || '',
              slug: doc.seo_master?.slug || '',
              document_id: doc.document_metadata?.document_id || '',
              subject: doc.document_metadata?.subject || '',
              grade_numeric: doc.document_metadata?.grade_level,
              language: doc.document_metadata?.language || 'en',
              topic_refs: doc.topic_refs || [],
              created_at: doc.created_at || new Date().toISOString(),
              updated_at: doc.updated_at || new Date().toISOString(),
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch subject data:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
          {subject?.subject || slug.charAt(0).toUpperCase() + slug.slice(1)}
        </h1>
        <p className="text-muted-foreground">
          Browse textbooks and study materials organized by grade level
        </p>
      </div>

      {/* Grades Overview */}
      {grades.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Grades</h2>
          <div className="flex flex-wrap gap-2">
            {grades.map((grade) => (
              <Badge key={grade.grade} variant="outline" className="text-sm">
                Grade {grade.grade} ({grade.count} books)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Documents by Grade */}
      {Object.keys(documentsByGrade).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No documents available for this subject yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(documentsByGrade).map(([grade, docs]) => 
            docs.length > 0 && (
              <div key={grade}>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-2xl font-serif font-semibold text-foreground">
                    Grade {grade}
                  </h2>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {docs.map((doc) => (
                    <DocumentCard
                      key={doc.document_id || doc._id}
                      document={doc}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
