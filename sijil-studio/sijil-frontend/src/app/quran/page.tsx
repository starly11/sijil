import { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Surah } from '@/lib/api/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'The Holy Quran - Read with Translation',
  description: 'Read all 114 Surahs of the Holy Quran with English and Urdu translations. Beautiful typography, easy navigation, and scholarly insights.',
};

export default async function QuranIndexPage() {
  const res = await api.get<Surah[]>(API_ENDPOINTS.QURAN_SURAHS);
  
  if (!res.success || !Array.isArray(res.data)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600">Unable to load Quran chapters. Please try again later.</p>
        </div>
      </div>
    );
  }

  const chapters = res.data;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          The Holy Quran
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-slate-100">
          Read the Noble Quran
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          All 114 Surahs with beautiful Arabic typography, translations in English and Urdu, 
          and insightful commentary for deeper understanding.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">114</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Surahs</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">6,236</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">Ayahs</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">30</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Juz&apos;</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">2</p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Translations</p>
          </CardContent>
        </Card>
      </div>

      {/* Surah Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {chapters.map((chapter) => (
          <Link key={chapter.id} href={`/quran/${chapter.id}`}>
            <Card className="group h-full hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center">
                    <span className="text-emerald-800 dark:text-emerald-200 font-bold font-arabic">
                      {chapter.id.toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                    {chapter.revelationType === 'Meccan' ? 'Meccan' : 'Medinan'}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                  {chapter.englishName}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {chapter.englishNameTranslation}
                </p>
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {chapter.numberOfAyahs} Ayahs
                  </span>
                  <BookOpen className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
