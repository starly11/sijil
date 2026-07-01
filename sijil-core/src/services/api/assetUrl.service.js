import { config } from '../../config/env.js';

/**
 * Computes the full CDN URL for an asset at read-time.
 * This ensures we only store local_path in the database,
 * and can swap CDN providers by changing ASSET_BASE_URL env var.
 * @param {string} localPath - The relative path stored in database (e.g., "assets/physics/fig1.png")
 * @returns {string} Full URL to the asset
 */
export function buildAssetUrl(localPath) {
  if (!localPath) return '';
  
  // If it's already a full URL, return as-is (backward compatibility)
  if (localPath.startsWith('http://') || localPath.startsWith('https://')) {
    return localPath;
  }
  
  // Remove leading slash if present to avoid double-slash
  const cleanPath = localPath.replace(/^\/+/, '');
  
  // Construct full URL from base + path
  const baseUrl = config.ASSET_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  return `${baseUrl}/${cleanPath}`;
}

/**
 * Transforms a figures array by computing full URLs for each figure.
 * @param {Array} figures - Array of figure objects with image_path_local
 * @returns {Array} Array with image_url computed from image_path_local
 */
export function enrichFiguresWithUrls(figures) {
  if (!Array.isArray(figures)) return [];
  
  return figures.map(fig => ({
    ...fig,
    image_url: buildAssetUrl(fig.image_path_local)
  }));
}

/**
 * Transforms a tables array (placeholder for future table rendering URLs).
 * @param {Array} tables - Array of table objects
 * @returns {Array} Same tables array (no URL transformation needed currently)
 */
export function enrichTables(tables) {
  if (!Array.isArray(tables)) return [];
  return tables;
}
