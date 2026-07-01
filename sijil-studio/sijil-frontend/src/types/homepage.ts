/**
 * Shared Data Model interfaces for the homepage context layers
 */

export interface Document {
  document_id: string;
  title: string;
  document_type: string;
  subject: string;
  grade_level: string;
  slug: string;
  url_path: string;
  arrived_at: string;
}

export interface HomepageStats {
  documents: number;
  topics: number;
  subjects: number;
  grades: number;
}
