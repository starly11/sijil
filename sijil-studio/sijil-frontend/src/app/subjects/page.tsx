import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Subject } from '@/types/api';
import { SubjectCard } from '@/components/home/subject-card';

export const metadata = {
  title: 'Subjects | Sijil',
  description: 'Browse subjects in the Sijil collection',
};

export default async function SubjectsPage() {
  let subjects: Subject[] = [];
  try {
    const response = await api.get<{ success: boolean; data: Subject[] }>(API_ENDPOINTS.SUBJECTS);
    if (response.data?.success) {
      subjects = response.data?.data || [];
    }
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-8 text-foreground">Subjects</h1>
      {subjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No subjects available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map((subject, index) => (
            <SubjectCard
              key={subject.slug || `subject-${index}`}
              subject={subject.subject}
              href={`/subjects/${subject.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
