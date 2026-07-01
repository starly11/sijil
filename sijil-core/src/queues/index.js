import { createQueue } from './createQueue.js';
import { QUEUE_NAMES } from './constants.js';

export const ingestionQueue = createQueue(QUEUE_NAMES.INGESTION);
export const imageUploadQueue = createQueue(QUEUE_NAMES.IMAGE_UPLOAD);
export const slugResolverQueue = createQueue(QUEUE_NAMES.SLUG_RESOLVER);
export const exportGenQueue = createQueue(QUEUE_NAMES.EXPORT_GEN);
export const searchIndexQueue = createQueue(QUEUE_NAMES.SEARCH_INDEX);

export const queuesContainer = Object.freeze({
    ingestionQueue,
    imageUploadQueue,
    slugResolverQueue,
    exportGenQueue,
    searchIndexQueue,
});