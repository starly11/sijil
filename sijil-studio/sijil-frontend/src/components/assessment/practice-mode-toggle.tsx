'use client';

interface PracticeModeToggleProps {
  practiceMode: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function PracticeModeToggle({ 
  practiceMode, 
  onToggle 
}: PracticeModeToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-medium ${
        !practiceMode ? 'text-foreground' : 'text-muted-foreground'
      }`}>
        Graded
      </span>
      
      <button
        type="button"
        onClick={() => onToggle(!practiceMode)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          practiceMode ? 'bg-primary' : 'bg-secondary'
        }`}
        role="switch"
        aria-checked={practiceMode}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            practiceMode ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      
      <span className={`text-sm font-medium ${
        practiceMode ? 'text-foreground' : 'text-muted-foreground'
      }`}>
        Practice
      </span>
      
      <div className="ml-2 text-xs text-muted-foreground">
        {practiceMode 
          ? 'Get immediate feedback' 
          : 'No hints, shuffled questions'}
      </div>
    </div>
  );
}
