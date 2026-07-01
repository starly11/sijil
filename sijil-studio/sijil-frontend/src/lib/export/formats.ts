import { ExportFormat } from '@/types/api';

export interface ExportFormatConfig {
  id: ExportFormat;
  label: string;
  description: string;
  icon: string;
  fileExtension: string;
}

export const EXPORT_FORMATS: ExportFormatConfig[] = [
  {
    id: 'topic_pack',
    label: 'Topic Pack',
    description: 'Complete topic with all content, formulas, and assessments',
    icon: '📚',
    fileExtension: 'zip',
  },
  {
    id: 'formula_pack',
    label: 'Formula Pack',
    description: 'All formulas from the topic in LaTeX and image formats',
    icon: '📐',
    fileExtension: 'zip',
  },
  {
    id: 'mcq_pack',
    label: 'MCQ Pack',
    description: 'Multiple-choice questions for practice and revision',
    icon: '❓',
    fileExtension: 'zip',
  },
  {
    id: 'revision_pack',
    label: 'Revision Pack',
    description: 'Key concepts, summaries, and quick reference notes',
    icon: '📝',
    fileExtension: 'zip',
  },
  {
    id: 'flashcard_pack',
    label: 'Flashcard Pack',
    description: 'Flashcards for active recall and spaced repetition',
    icon: '🃏',
    fileExtension: 'zip',
  },
  {
    id: 'offline_html',
    label: 'Offline HTML',
    description: 'Self-contained HTML file for offline viewing',
    icon: '🌐',
    fileExtension: 'html',
  },
];

export const getFormatConfig = (format: ExportFormat): ExportFormatConfig | undefined => {
  return EXPORT_FORMATS.find((f) => f.id === format);
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'processing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'complete':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'complete':
      return 'Complete';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};
