/**
 * Removes markdown code fences from a string.
 * @param {string} str - Input string potentially containing markdown fences.
 * @returns {string} Clean string without markdown fences.
 */
export function stripMarkdownFences(str) {
  if (typeof str !== 'string') return '';
  
  let cleaned = str.trim();
  
  // Remove opening ```json or ``` fences
  cleaned = cleaned.replace(/^```json\s*/, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  
  // Remove closing ``` fences
  cleaned = cleaned.replace(/\s*```$/, '');
  
  return cleaned.trim();
}

/**
 * Performs a fast pre-Zod sanity check on raw Qwen output before JSON.parse.
 * @param {any} rawOutput - Raw output from Qwen API.
 * @param {'topic_array' | 'document'} expectedType - Expected type of parsed output.
 * @returns {{ valid: boolean, reason?: string, cleaned?: string, parsed?: any }} Validation result.
 */
export function validatePromptOutput(rawOutput, expectedType = 'topic_array') {
  // Step 1: Check rawOutput is a string with length > 10
  if (typeof rawOutput !== 'string' || rawOutput.length <= 10) {
    return { valid: false, reason: 'Empty output' };
  }
  
  // Step 2: Trim whitespace and strip markdown fences
  const trimmed = stripMarkdownFences(rawOutput);
  
  // Step 3: Try JSON.parse
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (parseError) {
    return { 
      valid: false, 
      reason: 'Invalid JSON: ' + parseError.message, 
      cleaned: trimmed 
    };
  }
  
  // Step 4: Validate based on expected type
  if (expectedType === 'topic_array') {
    // Must be an array
    if (!Array.isArray(parsed)) {
      return { valid: false, reason: 'Expected array but got ' + typeof parsed, cleaned: trimmed };
    }
    
    // Length must be > 0
    if (parsed.length === 0) {
      return { valid: false, reason: 'Empty array - no topics extracted', cleaned: trimmed };
    }
    
    // Each item must have: title, display_order, content_blocks
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (!item || typeof item !== 'object') {
        return { valid: false, reason: `Item at index ${i} is not an object`, cleaned: trimmed };
      }
      if (!item.title) {
        return { valid: false, reason: `Item at index ${i} missing 'title' field`, cleaned: trimmed };
      }
      if (typeof item.display_order !== 'number') {
        return { valid: false, reason: `Item at index ${i} missing or invalid 'display_order' field`, cleaned: trimmed };
      }
      if (!Array.isArray(item.content_blocks)) {
        return { valid: false, reason: `Item at index ${i} missing or invalid 'content_blocks' field`, cleaned: trimmed };
      }
    }
    
    return { valid: true, parsed, cleaned: trimmed };
  }
  
  // Step 5: Validate document type
  if (expectedType === 'document') {
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, reason: 'Expected object but got ' + typeof parsed, cleaned: trimmed };
    }
    
    if (!parsed.document_metadata) {
      return { valid: false, reason: "Missing 'document_metadata' field", cleaned: trimmed };
    }
    
    if (!parsed.chapters) {
      return { valid: false, reason: "Missing 'chapters' field", cleaned: trimmed };
    }
    
    return { valid: true, parsed, cleaned: trimmed };
  }
  
  // Unknown expected type - just return parsed result
  return { valid: true, parsed, cleaned: trimmed };
}
