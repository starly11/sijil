import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { TopicFull, TopicPage as TopicPageType } from '@/lib/api/types';
import type { Question } from '@/types/assessment';
import { ContentBlockRenderer } from '@/components/topic-content/content-block-renderer';
import { RelatedTopicsBlock } from '@/components/topic-content/related-topics-block';
import { FlashcardDeck } from '@/components/topic-content/flashcard-deck';
import { FaqSection } from '@/components/topic-content/faq-section';
import QuizContainer from '@/components/assessment/quiz-container';
import { ExportTrigger } from '@/components/export/export-trigger';
import { getTopicThemeClasses } from '@/lib/topic-theme';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TopicPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const isQuiz = slug.length > 0 && slug.at(-1) === 'quiz';
  const topicSlug = isQuiz ? slug.slice(0, -1).join('/') : slug.join('/');
  const topicRes = await api.get<TopicFull>(API_ENDPOINTS.TOPIC_BY_SLUG(topicSlug));
  const topic = topicRes.success ? topicRes.data : null;

  if (isQuiz) {
    return {
      title: topic?.meta?.title ? `${topic.meta.title} Quiz` : 'Topic Quiz',
      description: topic?.meta?.title ? `Take the ${topic.meta.title} assessment quiz` : '',
    };
  }

  const seo = topic?.meta?.seo;
  return {
    title: seo?.meta_title || topic?.meta?.title || 'Topic Not Found',
    description: seo?.meta_description || (topic?.meta?.title ? `Learn about ${topic.meta.title}` : ''),
    keywords: seo?.keywords || topic?.meta?.keywords,
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const isQuiz = slug.length > 0 && slug.at(-1) === 'quiz';
  const topicSlug = isQuiz ? slug.slice(0, -1).join('/') : slug.join('/');
  const topicRes = await api.get<TopicFull>(API_ENDPOINTS.TOPIC_BY_SLUG(topicSlug));

  if (!topicRes.success || !topicRes.data) {
    notFound();
  }

  const topic = topicRes.data;
  let pageData: TopicPageType | null = null;
  if (topic.meta?._id) {
    const pageRes = await api.get<TopicPageType>(API_ENDPOINTS.TOPIC_PAGE(topic.meta._id));
    if (pageRes.success && pageRes.data) {
      pageData = pageRes.data;
    }
  }
  const navigation = pageData?.navigation || null;
  const theme = getTopicThemeClasses(topic.meta?.design_meta?.primary_color_theme);
  const flashcards = topic.assessments?.flashcards || [];
  const faq = topic.faq || [];

  if (isQuiz) {
    const assessments = topic.assessments || {};
    const questions: Question[] = [
      ...(assessments.mcqs || []).map((q: any, idx: number) => {
        // Convert options from object options (a, b, c, d) to array
        const optionsArray = Object.entries(q.options || {}).map(([key, text]: [string, any]) => ({
          id: `opt-${idx}-${key}`,
          question_id: q._id || `mcq-${idx}`,
          option_text: text as string,
          is_correct: key === q.correct_answer
        }));

        return {
          id: q._id || `mcq-${idx}`,
          assessment_id: topic.meta?._id || 'assessment-1',
          question_text: q.question_text || q.question,
          question_type: 'mcq' as const,
          options: optionsArray,
          correct_answer_ids: optionsArray.filter(opt => opt.is_correct).map(opt => opt.id),
          explanation: q.explanation || '',
          points: q.points || 1,
          order: idx
        };
      })
    ];
    return (
      <div className="container mx-auto px-4 py-8">
        <QuizContainer
          questions={questions}
          title={topic.meta?.title ? `${topic.meta.title} Quiz` : 'Topic Quiz'}
          description="Test your knowledge with this assessment"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className={theme.container}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-serif font-bold ${theme.heading}`}>
            {topic.meta?.title}
          </h1>
          {topic.meta?.subject && (
            <p className="text-muted-foreground mt-2">
              {topic.meta.subject} • Grade {topic.meta.grade_numeric}
              {topic.meta.section_number ? ` • Section ${topic.meta.section_number}` : ''}
            </p>
          )}
          {topic.meta?.geo?.llm_summary && (
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground leading-relaxed">
              {topic.meta.geo.llm_summary}
            </p>
          )}
        </div>
        {topic.meta?._id && topic.meta?.title && (
          <ExportTrigger
            topicId={topic.meta._id}
            topicTitle={topic.meta.title}
          />
        )}
      </div>

      {/* Content Blocks */}
      <div className="prose prose-lg max-w-none">
        {topic.content_blocks && topic.content_blocks.length > 0 ? (
          topic.content_blocks.map((block: any, index: number) => (
            <ContentBlockRenderer
              key={block._id || block.block_id || `block-${index}`}
              block={block}
              figures={topic.figures}
              tables={topic.tables}
            />
          ))
        ) : (
          <div className="bg-muted p-8 rounded-lg text-center">
            <p className="text-muted-foreground">
              No content available for this topic yet.
            </p>
          </div>
        )}
      </div>

      {/* Related Topics */}
      <RelatedTopicsBlock related_topics={topic.related_topics} />
      
      <FlashcardDeck flashcards={flashcards} />
      <FaqSection faq={faq} />

      {/* Navigation */}
      {navigation && (
        <div className="flex items-center justify-between mt-12 pt-8 border-t">
          {navigation.prev ? (
            <Link href={`/topics/${navigation.prev.slug}`}>
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4 mr-2" />
                {navigation.prev.title}
              </Button>
            </Link>
          ) : (
            <div />
          )}
          {navigation.next ? (
            <Link href={`/topics/${navigation.next.slug}`}>
              <Button variant="outline">
                {navigation.next.title}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}
      </div>
    </div>
  );
}