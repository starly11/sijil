'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
}

export default function SurahSelector() {
  const router = useRouter();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSurahs() {
      try {
        const res = await api.get(API_ENDPOINTS.QURAN_SURAHS);
    if (res.success && res.data) {
      setSurahs(res.data as Surah[]);
    }
      } catch (err) {
        console.error('Failed to load surahs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSurahs();
  }, []);

  const handleSurahChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const surahNumber = parseInt(e.target.value, 10);
    if (!isNaN(surahNumber)) {
      router.push(`/quran/${surahNumber}`);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading surahs...</div>;
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <select
        onChange={handleSurahChange}
        className="w-[300px] px-3 py-2 rounded-md border border-border bg-background text-foreground"
      >
        <option value="">Select a Surah</option>
        {surahs.map((surah) => (
          <option key={surah.number} value={surah.number.toString()}>
            {surah.number}. {surah.englishName} — {surah.name}
          </option>
        ))}
      </select>
    </div>
  );
}
