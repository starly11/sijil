import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumericValue(value: number | undefined): string {
  if (value === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}
