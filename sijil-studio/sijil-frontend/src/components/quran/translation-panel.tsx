'use client';

import { SurahData } from '@/hooks/use-quran-surah';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TranslationPanelProps {
  surahData: SurahData;
  language: 'en' | 'ur';
  highlightedAyah: number | null;
}

export default function TranslationPanel({
  surahData,
  language,
  highlightedAyah,
}: TranslationPanelProps) {
  if (!surahData.ayahs || surahData.ayahs.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border bg-muted/30">
      <Card className="border-0 rounded-none">
        <CardHeader className="pb-4 border-b border-border bg-muted/50">
          <CardTitle className="text-lg">
            Translation ({language === 'en' ? 'English' : 'Urdu'})
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {surahData.ayahs.map((ayah, index) => {
            const isHighlighted = highlightedAyah !== null && ayah.number === highlightedAyah;
            const translation = language === 'en' ? ayah.translationEn : ayah.translationUr;

            return (
              <div
                key={`translation-${ayah.number}`}
                className={`p-6 transition-colors ${
                  isHighlighted ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {ayah.numberInSurah || index + 1}
                  </span>
                  <p className={`text-lg leading-relaxed ${
                    language === 'ur' ? 'text-right' : ''
                  }`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                    {translation || 'Translation not available'}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
