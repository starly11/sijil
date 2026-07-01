/**
 * SIJIL Design Tokens
 * Based on UI/UX Pro Max skill analysis
 * 
 * Color Psychology:
 * - Teal (#0D9488): Trust, Knowledge, Growth, Balance
 * - Orange (#EA580C): Action, Energy, Conversion, Enthusiasm
 * 
 * Typography:
 * - Inter (Headings): Clean, Modern, Professional
 * - Source Sans Pro (Body): Readable, Friendly, Accessible
 */

export const colors = {
  // Primary - Teal: Trust & Knowledge
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488', // Main primary
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  // Accent - Orange: Action & Conversion
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c', // Main accent
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const typography = {
  fonts: {
    heading: 'var(--font-sans)',
    body: 'var(--font-sans)',
    serif: 'var(--font-serif)',
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
};

export const transitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '350ms ease',
};

// Motion signatures based on context
export const motionSignatures = {
  // Subtle micro-interactions for buttons, links
  micro: {
    duration: 150,
    easing: 'ease',
  },
  // Card hovers, panel transitions
  component: {
    duration: 250,
    easing: 'ease-out',
  },
  // Page transitions, major state changes
  page: {
    duration: 350,
    easing: 'ease-in-out',
  },
};

// Design principles from UI/UX Pro Max
export const designPrinciples = {
  // Flat design with subtle depth
  style: 'flat-with-micro-depth',
  // High contrast for readability
  contrast: 'high',
  // Generous whitespace for clarity
  whitespace: 'generous',
  // Limited color palette (2 main colors)
  colorLimit: 2,
  // Extreme contrast hierarchy
  hierarchy: 'extreme',
  // Every detail finished
  finish: 'complete',
};
