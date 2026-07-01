/**
 * Safe version increment utility
 * Handles string, number, and undefined inputs
 * Never produces NaN or crashes
 * @param {string|number|undefined} version - Current version
 * @returns {number} Next version number
 */
export function incrementVersion(version) {
  if (version === undefined || version === null || version === '') {
    return 1;
  }
  
  // Convert to number, handling both "1", "2", 1, 2, etc.
  const numericVersion = typeof version === 'string' 
    ? parseInt(version, 10) 
    : Number(version);
  
  // If parsing fails, default to 1
  if (isNaN(numericVersion)) {
    return 1;
  }
  
  return numericVersion + 1;
}

/**
 * Parse version string to comparable number
 * @param {string|number} version 
 * @returns {number}
 */
export function parseVersion(version) {
  if (version === undefined || version === null || version === '') {
    return 0;
  }
  
  const numericVersion = typeof version === 'string' 
    ? parseInt(version, 10) 
    : Number(version);
  
  return isNaN(numericVersion) ? 0 : numericVersion;
}
