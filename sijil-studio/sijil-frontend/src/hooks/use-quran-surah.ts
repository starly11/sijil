import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { QuranSurahResponse } from '@/lib/api/types';

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  translationEn?: string;
  translationUr?: string;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

export function useQuranSurah(surahNumber: number) {
  const [data, setData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchSurah() {
      if (!mounted) return;
      
      try {
        setLoading(true);
        setError(null);

        const res = await api.get<QuranSurahResponse>(API_ENDPOINTS.QURAN_SURAH(surahNumber));
        if (!res.success || !res.data) {
          throw new Error('Failed to load surah');
        }

        const surah = res.data.surah;
        const ayahs = res.data.ayahs || [];

        const transformedData: SurahData = {
          number: surah.surah_number,
          name: surah.name_arabic,
          englishName: surah.name_english,
          englishNameTranslation: surah.name_transliteration,
          revelationType: surah.revelation_type,
          numberOfAyahs: surah.total_ayahs,
          ayahs: ayahs.map((a: any, idx: number) => ({
            number: a.ayah,
            numberInSurah: idx + 1,
            text: a.text_uthmani,
            translationEn: a.translation_en,
            translationUr: a.translation_ur
          }))
        };

        setData(transformedData);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSurah();

    return () => {
      mounted = false;
    };
  }, [surahNumber]);

  return { data, loading, error };
}
