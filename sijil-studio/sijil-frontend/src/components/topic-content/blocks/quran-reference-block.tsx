interface QuranReferenceBlockProps {
  block: {
    surah?: number;
    ayah_start?: number;
    ayah_end?: number;
    textbook_translation_ur?: string;
    curriculum_id?: string;
    display_note?: string;
  };
}

export function QuranReferenceBlock({ block }: QuranReferenceBlockProps) {
  if (!block.surah) return null;

  const ayahRange = block.ayah_end && block.ayah_end !== block.ayah_start 
    ? `${block.ayah_start}-${block.ayah_end}`
    : String(block.ayah_start);

  return (
    <div className="my-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
      <div className="font-semibold mb-2 text-emerald-800 dark:text-emerald-200">
        Quran Reference: Surah {block.surah}, Ayah {ayahRange}
      </div>
      {block.textbook_translation_ur && (
        <p className="text-muted-foreground mb-2">{block.textbook_translation_ur}</p>
      )}
      {block.display_note && (
        <p className="text-sm text-muted-foreground italic">{block.display_note}</p>
      )}
      {block.curriculum_id && (
        <p className="text-xs text-muted-foreground mt-2">
          Curriculum ID: {block.curriculum_id}
        </p>
      )}
    </div>
  );
}
