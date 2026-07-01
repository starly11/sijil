const axios = require('axios');

/**
 * PHASE 20C TASK 4: Import Report Generator
 * Generates comprehensive import report
 */
async function generateImportReport(importBatch) {
  const startedAt = new Date(importBatch.started_at);
  const completedAt = importBatch.completed_at ? new Date(importBatch.completed_at) : new Date();
  const durationSeconds = Math.floor((completedAt - startedAt) / 1000);

  const totals = {
    documents: importBatch.total_documents || 0,
    topics: importBatch.total_topics || 0,
    assets: importBatch.total_assets || 0,
    assessments: importBatch.total_assessments || 0
  };

  const imported = {
    documents: importBatch.imported_documents || 0,
    topics: importBatch.imported_topics || 0,
    assets: importBatch.imported_assets || 0,
    assessments: importBatch.imported_assessments || 0
  };

  const skipped = {
    documents: (importBatch.total_documents || 0) - imported.documents - (importBatch.failed_documents || 0),
    topics: 0, // Not tracked per-file
    assets: 0,
    assessments: 0
  };

  const failed = {
    documents: importBatch.failed_documents || 0,
    topics: 0,
    assets: 0,
    assessments: 0
  };

  // Calculate operational metrics
  const completedCount = importBatch.file_status ? importBatch.file_status.filter(f => f.status === 'completed').length : 0;
  const averageFileTime = completedCount > 0 ? durationSeconds / completedCount : 0;
  const filesPerMinute = completedCount > 0 ? (completedCount / durationSeconds) * 60 : 0;
  const remainingFiles = (importBatch.total_documents || 0) - completedCount - failed.documents;
  const estimatedRemainingTime = filesPerMinute > 0 ? remainingFiles / filesPerMinute * 60 : 0;

  return {
    batch_id: importBatch.batch_id,
    repository: importBatch.repo_url,
    commit_sha: importBatch.commit_sha,
    status: importBatch.status,
    totals,
    imported,
    skipped,
    failed,
    warnings: importBatch.warnings || [],
    errors: importBatch.errors || [],
    failed_files: importBatch.failed_files || [],
    duration_seconds: durationSeconds,
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    metrics: {
      average_file_time_seconds: parseFloat(averageFileTime.toFixed(2)),
      files_per_minute: parseFloat(filesPerMinute.toFixed(2)),
      estimated_remaining_seconds: parseFloat(estimatedRemainingTime.toFixed(2))
    }
  };
}

module.exports = { generateImportReport };
