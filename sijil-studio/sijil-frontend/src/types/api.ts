export interface HealthResponse {
  status: 'ok' | 'degraded';
  mongo: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  uptime_seconds: number;
}

export interface Subject {
  count: number;
  subject: string;
  slug: string;
}

export interface Grade {
  count: number;
  grade: string | number;
}

export interface PlatformStats {
  documents_count: number;
  topics_count: number;
  subjects_count: number;
  grades_count: number;
  total_verses_mapped?: number;
}

export interface APIErrorResponse {
  success: false;
  error: string;
  errors?: string[];
}

export type ExportFormat = 
  | 'formula_pack' 
  | 'mcq_pack' 
  | 'revision_pack' 
  | 'offline_html' 
  | 'flashcard_pack' 
  | 'topic_pack';

export type ExportStatus = 
  | 'pending' 
  | 'processing' 
  | 'complete' 
  | 'failed' 
  | 'cancelled';

export interface CreateExportRequest {
  topic_id: string;
  format: ExportFormat;
}

export interface CreateExportResponse {
  success: true;
  data: {
    export_job_id: string;
    status: ExportStatus;
  };
}

export interface ExportJobStatus {
  status: ExportStatus;
  package_url?: string;
  progress?: number;
  message?: string;
  created_at?: string;
  format?: ExportFormat;
  topic_id?: string;
  topic_title?: string;
}

export interface ExportPolicy {
  document_type: string;
  allowed_export_types: ExportFormat[];
  max_topics_per_export: number;
}

export interface StaleCheckResponse {
  is_stale: boolean;
  content_hash_match: boolean;
}

// Admin API types
export type IngestionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ImportStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled'
  | 'PENDING' 
  | 'SCANNING' 
  | 'VALIDATING' 
  | 'READY' 
  | 'IMPORTING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'PARTIAL_SUCCESS' 
  | 'CANCELLED';

export interface IngestionJob {
  tracking_id: string;
  status: IngestionStatus;
  created_at: string;
  completed_at?: string;
  message?: string;
}

export interface IngestionRequest {
  // Flexible JSON payload - depends on backend schema
  [key: string]: any;
}

export interface IngestionResponse {
  success: true;
  data: {
    tracking_id: string;
    status: IngestionStatus;
  };
}

export interface BatchImportPreviewRequest {
  repo_url: string;
  branch?: string;
  path?: string;
}

export interface BatchImportPreviewResponse {
  success: true;
  data: {
    batch_id: string;
    documents_found: number;
    topics_found: number;
    files_preview: Array<{
      path: string;
      type: string;
      status: 'valid' | 'invalid' | 'skipped';
      error?: string;
    }>;
  };
}

export interface BatchImportRequest {
  batch_id: string;
}

export interface BatchImportStatus {
  batch_id: string;
  status: ImportStatus;
  repo_url: string;
  commit_sha?: string;
  /** Overall progress 0–100 from API */
  progress: number;
  /** Per-stage breakdown when available */
  progress_stages?: {
    scanning: { status: string; percentage: number };
    validating: { status: string; percentage: number };
    importing: { status: string; percentage: number; documents?: number; topics?: number; assets?: number; assessments?: number };
    indexing: { status: string; percentage: number };
  };
  counts: {
    total_documents: number;
    total_topics: number;
    total_assets: number;
    total_assessments: number;
    imported_documents: number;
    imported_topics: number;
    imported_assets: number;
    imported_assessments: number;
    failed_documents: number;
    failed_topics: number;
    failed_assets: number;
    failed_assessments: number;
  };
  successful_files: Array<{ file_path: string; document_id?: string; ingested_at?: string }>;
  failed_files: Array<{ file_path: string; error: string; failed_at?: string; retry_count?: number }>;
  warnings?: Array<{ type: string; message: string; file_path: string; topic_id?: string }>;
  errors?: Array<{ type: string; message: string; file_path?: string; details?: unknown }>;
  report?: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsOverview {
  total_topics: number;
  total_documents: number;
  total_assessments: number;
  total_imports: number;
  import_success_rate: number;
  recent_activity: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  platform_stats: PlatformStats;
}
