export const createMockPlatformStats = () => ({
  documents_count: 100,
  topics_count: 50,
  subjects_count: 10,
  grades_count: 5,
  total_verses_mapped: 500,
});

export const createMockExportJob = () => ({
  export_job_id: 'exp-123',
  status: 'complete' as const,
  format: 'topic_pack' as const,
  topic_title: 'Sample Topic',
  package_url: '/downloads/test.zip',
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  progress: 100,
});

export const createMockIngestionJob = () => ({
  tracking_id: 'ing-456',
  status: 'processing' as const,
  created_at: new Date().toISOString(),
  message: 'Processing...',
});
