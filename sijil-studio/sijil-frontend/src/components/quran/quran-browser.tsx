'use client';

import { useState } from 'react';
import { useQuranSurah, SurahData } from '@/hooks/use-quran-surah';
import QuranText from './quran-text';
import TranslationPanel from './translation-panel';
import TranslationToggle from './translation-toggle';
import AyahNavigator from './ayah-navigator';
import SurahSelector from './surah-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuranBrowserProps {
  initialSurahNumber: number;
}

export default function QuranBrowser({ initialSurahNumber }: QuranBrowserProps) {
  const [surahNumber, setSurahNumber] = useState(initialSurahNumber);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLang, setTranslationLang] = useState<'en' | 'ur'>('en');
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);

  const { data: surahData, loading, error } = useQuranSurah(surahNumber);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!surahData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Surah not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">
            {surahData.englishName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {surahData.englishNameTranslation} • {surahData.revelationType} • {surahData.numberOfAyahs} Ayahs
          </p>
        </div>
        <SurahSelector />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AyahNavigator
          surahNumber={surahNumber.toString()}
          totalAyahs={surahData.numberOfAyahs}
          currentAyah={highlightedAyah}
          onAyahChange={setHighlightedAyah}
        />
        <TranslationToggle
          showTranslation={showTranslation}
          onToggle={() => setShowTranslation(!showTranslation)}
          currentLang={translationLang}
          onLangChange={setTranslationLang}
        />
      </div>

      {/* Content */}
      <QuranText
        surahData={surahData}
        showTranslation={showTranslation}
        translationLang={translationLang}
        highlightedAyah={highlightedAyah}
      />

      {showTranslation && (
        <TranslationPanel
          surahData={surahData}
          language={translationLang}
          highlightedAyah={highlightedAyah}
        />
      )}
    </div>
  );
}
