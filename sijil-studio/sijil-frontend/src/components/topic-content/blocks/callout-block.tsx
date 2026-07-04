interface CalloutBlockProps {
  block: {
    callout_id?: string;
    variant?: string;
    title?: string;
    text?: string;
    icon?: string;
  };
}

const variantStyles: Record<string, string> = {
  // Primary variants
  'do-you-know': 'bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-950/30 dark:border-blue-400',
  'quick-quiz': 'bg-yellow-50 border-l-4 border-yellow-500 dark:bg-yellow-950/30 dark:border-yellow-400',
  'islamic-value': 'bg-green-50 border-l-4 border-green-500 dark:bg-green-950/30 dark:border-green-400',
  'note': 'bg-gray-50 border-l-4 border-gray-500 dark:bg-gray-900/30 dark:border-gray-400',
  
  // Information variants
  'for-your-information': 'bg-indigo-50 border-l-4 border-indigo-500 dark:bg-indigo-950/30 dark:border-indigo-400',
  'fun-fact': 'bg-pink-50 border-l-4 border-pink-500 dark:bg-pink-950/30 dark:border-pink-400',
  'career-link': 'bg-purple-50 border-l-4 border-purple-500 dark:bg-purple-950/30 dark:border-purple-400',
  'biography': 'bg-amber-50 border-l-4 border-amber-500 dark:bg-amber-950/30 dark:border-amber-400',
  'real-world-connection': 'bg-teal-50 border-l-4 border-teal-500 dark:bg-teal-950/30 dark:border-teal-400',
  
  // Warning/Safety variants
  'lab-safety': 'bg-orange-50 border-l-4 border-orange-500 dark:bg-orange-950/30 dark:border-orange-400',
  'caution': 'bg-yellow-50 border-l-4 border-yellow-600 dark:bg-yellow-950/30 dark:border-yellow-500',
  'warning': 'bg-red-50 border-l-4 border-red-500 dark:bg-red-950/30 dark:border-red-400',
  'danger': 'bg-red-100 border-l-4 border-red-700 dark:bg-red-950/50 dark:border-red-500',
  
  // Learning variants
  'activity': 'bg-emerald-50 border-l-4 border-emerald-500 dark:bg-emerald-950/30 dark:border-emerald-400',
  'think-about-it': 'bg-cyan-50 border-l-4 border-cyan-500 dark:bg-cyan-950/30 dark:border-cyan-400',
  'challenge': 'bg-rose-50 border-l-4 border-rose-500 dark:bg-rose-950/30 dark:border-rose-400',
  'revision': 'bg-violet-50 border-l-4 border-violet-500 dark:bg-violet-950/30 dark:border-violet-400',
  'misconception': 'bg-fuchsia-50 border-l-4 border-fuchsia-500 dark:bg-fuchsia-950/30 dark:border-fuchsia-400',
  'summary': 'bg-slate-50 border-l-4 border-slate-500 dark:bg-slate-950/30 dark:border-slate-400',
};

export function CalloutBlock({ block }: CalloutBlockProps) {
  const variant = block.variant || 'note';
  const style = variantStyles[variant] || variantStyles['note'];
  
  // Icon mapping for each variant
  const iconMap: Record<string, string> = {
    'do-you-know': '💡',
    'quick-quiz': '❓',
    'islamic-value': '☪️',
    'note': '📌',
    'for-your-information': 'ℹ️',
    'fun-fact': '🎉',
    'career-link': '💼',
    'biography': '👤',
    'real-world-connection': '🌍',
    'lab-safety': '⚠️',
    'caution': '⚡',
    'warning': '🚨',
    'danger': '☣️',
    'activity': '🔬',
    'think-about-it': '🤔',
    'challenge': '🏆',
    'revision': '📝',
    'misconception': '❌',
    'summary': '✅',
  };
  
  const icon = block.icon || iconMap[variant] || '📌';

  return (
    <div className={`my-6 p-5 rounded-lg border-l-4 shadow-sm ${style}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{icon}</span>
        <div className="flex-1">
          {block.title && (
            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-90">
              {block.title}
            </h4>
          )}
          {block.text && (
            <p className="text-muted-foreground leading-relaxed">{block.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
