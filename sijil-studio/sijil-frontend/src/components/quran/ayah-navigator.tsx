'use client';

import { Button } from '@/components/ui/button';

interface AyahNavigatorProps {
  surahNumber: string;
  totalAyahs: number;
  currentAyah: number | null;
  onAyahChange: (ayahNumber: number | null) => void;
}

export default function AyahNavigator({
  surahNumber,
  totalAyahs,
  currentAyah,
  onAyahChange,
}: AyahNavigatorProps) {
  const goToPrevious = () => {
    if (currentAyah === null) {
      onAyahChange(totalAyahs);
    } else if (currentAyah > 1) {
      onAyahChange(currentAyah - 1);
    }
  };

  const goToNext = () => {
    if (currentAyah === null) {
      onAyahChange(1);
    } else if (currentAyah < totalAyahs) {
      onAyahChange(currentAyah + 1);
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-muted/30 border-b border-border">
      <Button
        variant="outline"
        onClick={goToPrevious}
        disabled={currentAyah === 1}
        aria-label="Previous Ayah"
      >
        ← Previous Ayah
      </Button>

      <span className="text-sm font-medium text-muted-foreground">
        {currentAyah ? `Ayah ${currentAyah} of ${totalAyahs}` : `All ${totalAyahs} Ayahs`}
      </span>

      <Button
        variant="outline"
        onClick={goToNext}
        disabled={currentAyah === totalAyahs}
        aria-label="Next Ayah"
      >
        Next Ayah →
      </Button>
    </div>
  );
}
