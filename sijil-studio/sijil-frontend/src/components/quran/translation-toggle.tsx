'use client';

import { Button } from '@/components/ui/button';

interface TranslationToggleProps {
  showTranslation: boolean;
  onToggle: () => void;
  currentLang: 'en' | 'ur';
  onLangChange: (lang: 'en' | 'ur') => void;
}

export default function TranslationToggle({
  showTranslation,
  onToggle,
  currentLang,
  onLangChange,
}: TranslationToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant={showTranslation ? 'primary' : 'outline'}
        onClick={onToggle}
        aria-pressed={showTranslation}
      >
        {showTranslation ? 'Hide Translation' : 'Show Translation'}
      </Button>

      {showTranslation && (
        <div className="flex items-center gap-2">
          <Button
            variant={currentLang === 'en' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onLangChange('en')}
          >
            English
          </Button>
          <Button
            variant={currentLang === 'ur' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onLangChange('ur')}
          >
            اردو
          </Button>
        </div>
      )}
    </div>
  );
}
