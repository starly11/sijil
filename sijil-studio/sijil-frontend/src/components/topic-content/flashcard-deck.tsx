'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Flashcard {
  _id?: string;
  front?: string;
  back?: string;
  cloze?: string;
  difficulty?: string;
}

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  title?: string;
}

export function FlashcardDeck({ flashcards, title = 'Flashcards' }: FlashcardDeckProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!flashcards.length) return null;

  const card = flashcards[index];

  const prev = () => {
    setFlipped(false);
    setIndex(i => (i > 0 ? i - 1 : flashcards.length - 1));
  };

  const next = () => {
    setFlipped(false);
    setIndex(i => (i < flashcards.length - 1 ? i + 1 : 0));
  };

  return (
    <section className="my-10 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-6 dark:border-violet-800 dark:from-violet-950/40 dark:to-purple-950/30">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-violet-900 dark:text-violet-100">{title}</h2>
        <span className="text-sm text-violet-700 dark:text-violet-300">
          {index + 1} / {flashcards.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped(f => !f)}
        className="min-h-[160px] w-full rounded-lg border border-violet-300 bg-white p-6 text-left shadow-sm transition hover:shadow-md dark:border-violet-700 dark:bg-violet-950/50"
      >
        <p className="text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
          {flipped ? 'Answer' : 'Question'}
        </p>
        <p className="mt-3 text-lg font-medium text-foreground">
          {flipped ? card.back || card.cloze : card.front}
        </p>
        {card.difficulty && (
          <p className="mt-4 text-xs capitalize text-muted-foreground">Difficulty: {card.difficulty}</p>
        )}
      </button>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={prev}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setFlipped(false)}>
          <RotateCcw className="mr-1 h-4 w-4" />
          Reset
        </Button>
        <Button variant="outline" size="sm" onClick={next}>
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
