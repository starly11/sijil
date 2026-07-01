import Document from '../../models/document.model.js';

/**
 * Checks if a document with the given content_hash already exists as latest version
 * @param {string} contentHash - SHA256 hash of document content
 * @returns {Promise<{isDuplicate: boolean, existingDocument?: object}>}
 */
export async function checkDuplicate(contentHash) {
  if (!contentHash) {
    throw new Error('Content hash is required for duplicate check');
  }

  // Find document with matching hash that is marked as latest (nested path)
  const existingDoc = await Document.findOne({
    'document_metadata.content_hash': contentHash,
    'document_metadata.is_latest': true
  }).lean();

  if (existingDoc) {
    return {
      isDuplicate: true,
      existingDocument: existingDoc,
      reason: 'exact_hash_match'
    };
  }

  // Check for same document_id with different hash (version update scenario)
  // This will be handled in buildDocumentRecord, not here
  
  return {
    isDuplicate: false,
    existingDocument: null
  };
}

/**
 * Finds the latest version of a document by document_id
 * @param {string} documentId - Logical document ID (e.g., doc_xxxxx)
 * @returns {Promise<object|null>} Latest document version or null
 */
export async function findLatestVersion(documentId) {
  if (!documentId) {
    return null;
  }

  const latestDoc = await Document.findOne({
    'document_metadata.document_id': documentId,
    'document_metadata.is_latest': true
  }).lean();

  return latestDoc || null;
}
