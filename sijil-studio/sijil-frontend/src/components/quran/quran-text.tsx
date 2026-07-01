'use client';

import { SurahData } from '@/hooks/use-quran-surah';
import { Card, CardContent } from '@/components/ui/card';

interface QuranTextProps {
  surahData: SurahData;
  showTranslation: boolean;
  translationLang: 'en' | 'ur';
  highlightedAyah: number | null;
}

export default function QuranText({
  surahData,
  highlightedAyah,
}: QuranTextProps) {
  if (!surahData.ayahs || surahData.ayahs.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No ayahs available</p>;
  }

  return (
    <div className="space-y-6">
      {surahData.ayahs.map((ayah, index) => {
        const isHighlighted = highlightedAyah !== null && ayah.number === highlightedAyah;
        
        return (
          <Card
            key={ayah.number}
            id={`ayah-${ayah.number}`}
            className={`relative transition-all duration-200 ${
              isHighlighted
                ? 'border-primary shadow-md'
                : 'hover:border-primary/50'
            }`}
          >
            <CardContent className="p-6">
              {/* Ayah Number */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  {ayah.numberInSurah || index + 1}
                </span>
              </div>

              {/* Bismillah for first ayah (except Surah 1 and 9) */}
              {index === 0 && surahData.number !== 1 && surahData.number !== 9 && (
                <div className="text-center py-4 mb-4 border-t border-border">
                  <p className="text-2xl font-arabic text-muted-foreground">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </p>
                </div>
              )}

              {/* Arabic Text */}
              <div 
                className="text-right mb-4 pr-12"
                dir="rtl"
                lang="ar"
              >
                <p className="text-3xl leading-loose">
                  {ayah.text}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
