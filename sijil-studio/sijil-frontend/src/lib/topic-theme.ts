const THEME_RING: Record<string, string> = {
  blue: 'ring-blue-200 dark:ring-blue-800',
  green: 'ring-green-200 dark:ring-green-800',
  purple: 'ring-purple-200 dark:ring-purple-800',
  orange: 'ring-orange-200 dark:ring-orange-800',
  red: 'ring-red-200 dark:ring-red-800',
  teal: 'ring-teal-200 dark:ring-teal-800',
};

const THEME_HEADER: Record<string, string> = {
  blue: 'text-blue-900 dark:text-blue-100',
  green: 'text-green-900 dark:text-green-100',
  purple: 'text-purple-900 dark:text-purple-100',
  orange: 'text-orange-900 dark:text-orange-100',
  red: 'text-red-900 dark:text-red-100',
  teal: 'text-teal-900 dark:text-teal-100',
};

export function getTopicThemeClasses(primaryColorTheme?: string) {
  const theme = (primaryColorTheme || 'blue').toLowerCase();
  return {
    container: `ring-1 ${THEME_RING[theme] || THEME_RING.blue} rounded-2xl p-6 md:p-8`,
    heading: THEME_HEADER[theme] || THEME_HEADER.blue,
  };
}
