interface QuranVerseBlockProps {
  block: {
    surah?: number;
    ayah?: number;
    textbook_urdu_translation?: string;
    word_alignments?: Array<{
      position: number;
      urdu_meaning: string;
      grammar_note?: string | null;
    }>;
    tafsir_snippet?: string;
  };
}

export function QuranVerseBlock({ block }: QuranVerseBlockProps) {
  if (!block.surah || !block.ayah) return null;

  return (
    <div className="my-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
      <div className="font-semibold mb-2 text-amber-800 dark:text-amber-200">
        Surah {block.surah}, Ayah {block.ayah}
      </div>
      {block.textbook_urdu_translation && (
        <p className="text-muted-foreground mb-4 dir-rtl">{block.textbook_urdu_translation}</p>
      )}
      {block.word_alignments && block.word_alignments.length > 0 && (
        <div className="mt-4">
          <h5 className="font-semibold mb-2">Word by Word:</h5>
          <div className="flex flex-wrap gap-2">
            {block.word_alignments.map((word, index) => (
              <span 
                key={index} 
                className="inline-flex flex-col items-center p-2 bg-white dark:bg-gray-800 rounded border"
              >
                <span className="text-xs text-muted-foreground">#{word.position}</span>
                <span>{word.urdu_meaning}</span>
                {word.grammar_note && (
                  <span className="text-xs text-blue-600 italic">{word.grammar_note}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
      {block.tafsir_snippet && (
        <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
          <p className="text-sm text-muted-foreground italic">{block.tafsir_snippet}</p>
        </div>
      )}
    </div>
  );
}
