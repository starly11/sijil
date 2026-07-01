'use client';

import { useState } from 'react';
import { useQuranSurah, SurahData } from '@/hooks/use-quran-surah';
import QuranText from './quran-text';
import TranslationPanel from './translation-panel';
import TranslationToggle from './translation-toggle';
import AyahNavigator from './ayah-navigator';
import SurahSelector from './surah-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles } from 'lucide-react';

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
    <div className="space-y-8">
      {/* Premium Header with Islamic Design */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-100/50 dark:bg-amber-900/20 rounded-full translate-y-12 -translate-x-12 blur-xl" />
        
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-200 dark:border-amber-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Chapter {surahData.number}
                </Badge>
                <Badge variant="outline" className="bg-white/50 dark:bg-black/20 border-emerald-300 dark:border-emerald-700">
                  {surahData.revelationType === 'Meccan' ? 'Meccan' : 'Medinan'}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-emerald-900 dark:text-emerald-100 tracking-tight">
                  {surahData.englishName}
                </h1>
                <p className="text-lg text-emerald-700 dark:text-emerald-300 font-medium">
                  {surahData.englishNameTranslation}
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {surahData.numberOfAyahs} Ayahs
                </span>
                <span>•</span>
                <span>{surahData.revelationType === 'Meccan' ? 'Revealed in Mecca' : 'Revealed in Medina'}</span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <SurahSelector />
            </div>
          </div>
          
          {/* Bismillah Display for non-Surah 1 & 9 */}
          {surahData.number !== 1 && surahData.number !== 9 && (
            <div className="mt-8 pt-6 border-t border-emerald-200 dark:border-emerald-800">
              <p className="text-center text-3xl md:text-4xl font-arabic text-emerald-800 dark:text-emerald-200 leading-relaxed">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Controls */}
      <div className="sticky top-4 z-40 backdrop-blur-md bg-background/80 dark:bg-background/60 border rounded-xl p-4 shadow-lg">
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
      </div>

      {/* Sacred Text Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-transparent to-amber-50/30 dark:from-emerald-950/20 dark:via-transparent dark:to-amber-950/10 pointer-events-none rounded-3xl" />
        <QuranText
          surahData={surahData}
          showTranslation={showTranslation}
          translationLang={translationLang}
          highlightedAyah={highlightedAyah}
        />
      </div>

      {/* Translation Panel */}
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
