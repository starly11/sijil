import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { QuranSurahResponse } from '@/lib/api/types';
import QuranBrowser from '@/components/quran/quran-browser';

interface QuranPageProps {
  params: Promise<{ surahNumber: string }>;
}

export async function generateMetadata({
  params,
}: QuranPageProps): Promise<Metadata> {
  const { surahNumber } = await params;
  const num = parseInt(surahNumber, 10);
  if (isNaN(num) || num < 1 || num > 114) {
    return {
      title: 'Surah Not Found',
      description: 'The requested surah could not be found'
    };
  }

  try {
    const res = await api.get<QuranSurahResponse>(API_ENDPOINTS.QURAN_SURAH(num));
    if (!res.success || !res.data?.surah) {
      return {
        title: 'Surah Not Found',
        description: 'The requested surah could not be found'
      };
    }

    const surah = res.data.surah;
    return {
      title: `${surah.name_english} - Quran`,
      description: `Read Surah ${surah.name_english} (${surah.name_transliteration}) with translation`,
    };
  } catch {
    return {
      title: 'Surah Not Found',
      description: 'The requested surah could not be found'
    };
  }
}

export default async function QuranPage({ params }: QuranPageProps) {
  const { surahNumber } = await params;
  const num = parseInt(surahNumber, 10);

  if (isNaN(num) || num < 1 || num > 114) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <QuranBrowser initialSurahNumber={num} />
    </div>
  );
}
