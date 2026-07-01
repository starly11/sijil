'use client';

import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

/**
 * Accessible toggle control updating local theme contextual settings.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} visual mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-200" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-200" />
      )}
    </Button>
  );
}
