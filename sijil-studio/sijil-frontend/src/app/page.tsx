import { Metadata } from 'next';
import { HeroSection } from '@/components/home/hero-section';
import { StatsSection } from '@/components/home/stats-section';
import { CollectionsGrid } from '@/components/home/collections-grid';
import { FeaturedContent } from '@/components/home/featured-content';
import { CTASection } from '@/components/home/cta-section';
import { fetchStats, fetchSubjects, fetchRecentDocuments } from '@/lib/homepage-api';
import { siteConfig } from '@/config/site';

// Revalidate metrics every hour using standard Next.js Incremental Static Regeneration (ISR)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Sijil - Digital Textbook Platform for Pakistani Curriculum',
  description: 'Comprehensive digital textbooks for grades 9-12. Access physics, chemistry, biology, mathematics with interactive topics, assessments, and exportable content.',
  keywords: ['Pakistani curriculum', 'textbooks', 'education', 'PCTB', 'grade 9', 'grade 10', 'grade 11', 'grade 12', 'physics', 'chemistry', 'biology', 'mathematics'],
  openGraph: {
    title: 'Sijil - Modern Digital Learning',
    description: 'Free access to Pakistani curriculum textbooks',
    type: 'website',
    locale: 'en_PK',
    siteName: 'Sijil',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sijil - Digital Textbooks',
    description: 'Comprehensive educational content for Pakistani students',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function HomePage() {
  // Parallel execution prevents network waterfalls completely
  const [stats, subjects, recentDocs] = await Promise.all([
    fetchStats(),
    fetchSubjects(),
    fetchRecentDocuments()
  ]);

  // Structured Data Presentation injection
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Sijil',
    description: 'Digital textbook platform for Pakistani curriculum',
    url: siteConfig.url,
    hasCourse: subjects.map((subjectData) => ({
      '@type': 'Course',
      name: subjectData.subject,
      educationalLevel: 'Grades 9-12',
    })),
  };

  return (
    <>
      {/* Structural Structured Data Block */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <HeroSection />
      <StatsSection data={stats} />
      <CollectionsGrid subjects={subjects} />
      <FeaturedContent docs={recentDocs} />
      <CTASection />
    </>
  );
}
