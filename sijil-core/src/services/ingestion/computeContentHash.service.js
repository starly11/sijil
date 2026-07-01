import CryptoJS from 'crypto-js';

/**
 * Computes SHA256 hash of document content for duplicate detection
 * @param {string} text - Raw text content from PDF
 * @returns {string} SHA256 hash
 */
export function computeContentHash(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text provided for hashing');
  }
  
  // Normalize text: trim whitespace, normalize line endings
  const normalized = text
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ');
  
  return CryptoJS.SHA256(normalized).toString(CryptoJS.enc.Hex);
}

/**
 * Computes hash from file buffer (for future binary-based deduplication)
 * @param {Buffer} buffer - File buffer
 * @returns {string} SHA256 hash
 */
export function computeFileHash(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Invalid buffer provided for hashing');
  }
  return CryptoJS.SHA256(buffer.toString('binary')).toString(CryptoJS.enc.Hex);
}
