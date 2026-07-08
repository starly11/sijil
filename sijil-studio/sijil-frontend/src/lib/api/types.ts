import { HealthResponse as BaseHealth, PlatformStats as BaseStats } from '@/types/api';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Document {
  _id: string;
  title: string;
  slug: string;
  document_id: string;
  subject?: string;
  grade_numeric?: number;
  language: string;
  topic_refs: any[];
  created_at: string;
  updated_at: string;
}

export interface DocumentAggregates {
  document_id: string;
  topics: number;
  content_blocks: number;
  formulas: number;
  assessments: number;
  assets: number;
}

export interface Topic {
  _id: string;
  title: string;
  slug_global: string;
  slug: string;
  url_path: string;
  document_id: string;
  chapter_id?: string;
  display_order: number;
  section_number?: string;
  topic_type?: string;
  difficulty?: string;
  subject?: string;
  grade_numeric?: number;
  language: string;
  locale?: string;
  publishing_status?: string;
  keywords?: string[];
  key_terms_preview?: string[];
  seo?: {
    meta_title?: string;
    meta_description?: string;
    canonical_url?: string;
    focus_keyword?: string;
    keywords?: string[];
    breadcrumb?: string[];
    json_ld_types?: string[];
  };
  geo?: {
    llm_summary?: string;
    authoritative_source?: string;
    citation_format?: string;
    entity_name?: string;
    entity_type?: string;
    trustworthiness_signals?: string[];
  };
  design_meta?: {
    primary_color_theme?: string;
    icon_suggestion?: string;
    layout_template?: string;
    animation_complexity?: string;
  };
  word_count?: number;
  formula_count?: number;
  figure_count?: number;
  mcq_count?: number;
  has_interactive?: boolean;
}

export interface TopicFull {
  meta: Topic;
  content_blocks: any[];
  raw_text?: string;
  clean_html?: string;
  formulas?: any[];
  key_terms?: any[];
  faq?: any[];
  ai_answer_hub?: any[];
  callouts?: any[];
  examples?: any[];
  downloadable_outputs?: Record<string, unknown>;
  figures: any[];
  tables: any[];
  assessments: {
    mcqs?: any[];
    flashcards?: any[];
    short_questions?: any[];
    book_problems?: any[];
    activities?: any[];
  };
  related_topics?: Array<{
    target_entity: string;
    resolved_url: string;
    relationship_type?: string;
    context?: string;
  }>;
}

export interface TopicPage {
  topic: Topic;
  navigation: {
    prev?: { _id: string; title: string; slug: string; url_path: string };
    next?: { _id: string; title: string; slug: string; url_path: string };
    chapter_topics: Array<{
      _id: string;
      title: string;
      slug: string;
      display_order: number;
      url_path: string;
    }>;
  };
  counts: {
    has_content: boolean;
    formulas: number;
    assessments: number;
    assets: number;
  };
}

export interface Surah {
  id: number;
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
}

export interface QuranSurahResponse {
  surah: {
    surah_number: number;
    name_arabic: string;
    name_english: string;
    name_urdu: string;
    name_transliteration: string;
    total_ayahs: number;
    revelation_type: string;
    juz_start?: number;
  };
  ayahs: Array<{
    number: number;
    text: string;
    translation?: { en?: string; ur?: string };
  }>;
}

export type HealthCheckPayload = BaseHealth;
export type PlatformStatsPayload = BaseStats;
