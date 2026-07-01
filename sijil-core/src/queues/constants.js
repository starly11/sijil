/**
 * Frozen catalog of canonical queue naming spaces across the ingestion system.
 */
export const QUEUE_NAMES = Object.freeze({
    INGESTION: 'ingestion',
    IMAGE_UPLOAD: 'image-upload',
    SLUG_RESOLVER: 'slug-resolver',
    EXPORT_GEN: 'export-gen',
    SEARCH_INDEX: 'search-index',
});

/**
 * Universal infrastructure queue job options configuration.
 * Configured with standard exponential backoff delays and automatic job history pruning.
 */
export const DEFAULT_JOB_OPTIONS = Object.freeze({
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000, // Seed delay: 2s, 4s, 8s
    },
    removeOnComplete: {
        age: 3600, // Keep records for 1 hour to assist troubleshooting metrics
        count: 100, // Maximum capacity ceiling for completed job logs
    },
    removeOnFail: {
        age: 86400, // Retain failed tracking states for 24 hours to allow recovery analysis
        count: 1000,
    },
});
