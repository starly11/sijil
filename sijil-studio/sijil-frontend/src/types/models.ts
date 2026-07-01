export interface BasePagination {
  page: number;
  limit: number;
  total: number;
}

export interface DocumentMetadata {
  _id: string;
  document_id: string;
  title: string;
  subject?: string;
  subject_slug?: string;
  grade_numeric?: number;
  document_type?: string;
  language: string;
  script_direction: 'ltr' | 'rtl';
  access_control: {
    is_premium: boolean;
    allowed_roles: string[];
  };
}

export interface Document {
  _id: string; // nanoid prefixed with doc_
  title?: string;
  slug?: string;
  schema_version: string;
  schema_type: string;
  document_metadata: DocumentMetadata;
  ingest_metadata?: {
    ingest_id: string;
    status: 'pending' | 'processing' | 'complete' | 'error';
    zod_validation_passed: boolean;
  };
}

export interface Subject {
  _id: string;
  name: string;
  slug: string;
  document_count: number;
}

export interface Grade {
  _id: string;
  level: number;
  name: string;
  document_count: number;
}

// API Composite Envelope format matches rule definitions 
export interface APIResponseEnvelope<T> {
  success: boolean;
  data: T;
  pagination?: BasePagination;
}
