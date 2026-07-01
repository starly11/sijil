'use client';

import { SurahData } from '@/hooks/use-quran-surah';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <div className="space-y-4">
      {surahData.ayahs.map((ayah, index) => {
        const isHighlighted = highlightedAyah !== null && ayah.number === highlightedAyah;
        const ayahNumber = ayah.numberInSurah || index + 1;
        
        return (
          <Card
            key={ayah.number}
            id={`ayah-${ayah.number}`}
            className={`group relative transition-all duration-300 ${
              isHighlighted
                ? 'border-emerald-400 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md'
            }`}
          >
            <CardContent className="p-6 md:p-8">
              {/* Ayah Number Ornament */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center shadow-md">
                    <span className="text-emerald-800 dark:text-emerald-200 font-bold font-arabic text-lg">
                      {ayahNumber.toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <div className="absolute inset-0 rounded-full border border-emerald-200 dark:border-emerald-800 scale-125 opacity-30" />
                </div>
              </div>

              {/* Arabic Text - Sacred Display */}
              <div 
                className="text-right mb-6 px-4 md:px-8"
                dir="rtl"
                lang="ar"
              >
                <p className="text-3xl md:text-4xl lg:text-5xl leading-[2.2] md:leading-[2.5] font-arabic text-slate-800 dark:text-slate-100">
                  {ayah.text}
                </p>
              </div>

              {/* Decorative Separator */}
              <div className="flex items-center justify-center my-6">
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-emerald-300 dark:via-emerald-700 to-transparent" />
                <div className="mx-3 w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-600" />
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-emerald-300 dark:via-emerald-700 to-transparent" />
              </div>

              {/* Action Badges (hover reveal) */}
              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Badge variant="outline" className="text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                  Ayah {ayahNumber}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
