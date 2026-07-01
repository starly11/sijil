import QuranAyah from '../../models/quranAyah.model.js';
import * as logger from '../../utils/logger.js';

// Arabic Unicode range regex - matches 10+ consecutive chars to avoid false positives
const ARABIC_REGEX = /[\u0600-\u06FF]{10,}/;

// Reference detection patterns (case-insensitive)
const REFERENCE_PATTERNS = [
    // "Surah Al-Fatiha (1:1-7)" or "Surah 2 (2:255)" or "Surah Al-Baqarah 2:255"
    /surah\s+(?:al[-\s]?(\w+)|(\d+))\s*\((\d+):(\d+)(?:-(\d+))?\)/i,
    // "Quran 2:255" or "Quran 2:255-260"
    /quran\s+(\d+):(\d+)(?:-(\d+))?/i,
    // Urdu patterns: "آیت 255" or "سورہ 2"
    /آیت\s*(\d+)/i,
    /سورہ\s*(\d+)/i,
    // Tokenized format: "[QURAN:2:255]" or "[QURAN:2:255:260]"
    /\[QURAN:(\d+):(\d+)(?::(\d+))?\]/i
];

/**
 * Detects Quran references in content blocks and flags them for resolution.
 * @param {Array} contentBlocks - Array of content_block objects (post-Zod validation)
 * @returns {Array} Annotated blocks with detection flags
 */
export function detectQuranReferences(contentBlocks) {
    if (!Array.isArray(contentBlocks)) {
        return [];
    }

    return contentBlocks.map(block => {
        // Skip if already a valid quran_reference block
        if (block.type === 'quran_reference' && 
            typeof block.surah === 'number' && 
            typeof block.ayah_start === 'number' && 
            typeof block.ayah_end === 'number') {
            return { ...block, already_valid: true };
        }

        const content = block.content || block.html || block.text || '';
        const contentString = typeof content === 'string' ? content : JSON.stringify(content);

        let annotatedBlock = { ...block };

        // RULE 1: Arabic Unicode detection (10+ consecutive chars)
        if (ARABIC_REGEX.test(contentString)) {
            annotatedBlock.needs_quran_extraction = true;
            
            // Try to extract Urdu text following Arabic as candidate translation
            // This is a simple heuristic - look for Urdu after Arabic
            const urduMatch = contentString.match(/[\u0600-\u06FF]{10,}([\s\S]*?)[\u0600-\u06FF]{0,5}$/);
            if (urduMatch && urduMatch[1]) {
                annotatedBlock.candidate_urdu_translation = urduMatch[1].trim();
            }
        }

        // RULE 2: Explicit reference patterns
        for (const pattern of REFERENCE_PATTERNS) {
            const match = contentString.match(pattern);
            if (match) {
                let surah, ayahStart, ayahEnd;

                // Parse based on pattern type
                if (pattern.source.includes('QURAN:')) {
                    // [QURAN:2:255] or [QURAN:2:255:260]
                    surah = parseInt(match[1], 10);
                    ayahStart = parseInt(match[2], 10);
                    ayahEnd = match[3] ? parseInt(match[3], 10) : ayahStart;
                } else if (pattern.source.includes('surah')) {
                    // Surah patterns: surah\s+(?:al[-\s]?(\w+)|(\d+))\s*\((\d+):(\d+)(?:-(\d+))?\)/i
                    // Groups: 1=al-name, 2=number, 3=surah_num, 4=ayah_start, 5=ayah_end
                    surah = parseInt(match[3] || match[2], 10);
                    ayahStart = parseInt(match[4], 10);
                    ayahEnd = match[5] ? parseInt(match[5], 10) : ayahStart;
                } else if (pattern.source.includes('quran') && !pattern.source.includes('QURAN:')) {
                    // Quran N:M or N:M-P (not tokenized format)
                    surah = parseInt(match[1], 10);
                    ayahStart = parseInt(match[2], 10);
                    ayahEnd = match[3] ? parseInt(match[3], 10) : ayahStart;
                } else if (pattern.source.includes('آیت')) {
                    // Urdu ayat pattern - need to infer surah from context (not possible here)
                    // Mark as unresolved
                    annotatedBlock.extracted_reference = {
                        surah: 0,
                        ayah_start: parseInt(match[1], 10),
                        ayah_end: parseInt(match[1], 10),
                        needs_manual_review: true
                    };
                    continue;
                } else if (pattern.source.includes('سورہ')) {
                    // Urdu surah pattern - only gives surah number
                    annotatedBlock.extracted_reference = {
                        surah: parseInt(match[1], 10),
                        ayah_start: 0,
                        ayah_end: 0,
                        needs_manual_review: true
                    };
                    continue;
                }

                if (surah && ayahStart) {
                    annotatedBlock.extracted_reference = {
                        surah,
                        ayah_start: ayahStart,
                        ayah_end: ayahEnd || ayahStart
                    };
                }
                break;
            }
        }

        return annotatedBlock;
    });
}

/**
 * Resolves annotated Quran blocks to proper quran_reference blocks.
 * @param {Array} annotatedBlocks - Output from detectQuranReferences()
 * @returns {Promise<Array>} Clean content_blocks array ready for persistence
 */
export async function resolveQuranBlocks(annotatedBlocks) {
    if (!Array.isArray(annotatedBlocks)) {
        return [];
    }

    const resolvedBlocks = [];

    for (const block of annotatedBlocks) {
        try {
            // Case: Already valid - pass through unchanged, strip annotation fields
            if (block.already_valid) {
                const cleanBlock = { ...block };
                delete cleanBlock.already_valid;
                delete cleanBlock.needs_quran_extraction;
                delete cleanBlock.extracted_reference;
                delete cleanBlock.candidate_urdu_translation;
                resolvedBlocks.push(cleanBlock);
                continue;
            }

            // Case: Extracted reference exists (Rule 2 match) - verify in DB
            if (block.extracted_reference) {
                const { surah, ayah_start, ayah_end, needs_manual_review } = block.extracted_reference;

                // If marked for manual review, treat as unresolved
                if (needs_manual_review || surah === 0 || ayah_start === 0) {
                    const unresolvedBlock = {
                        type: 'quran_reference',
                        block_order: block.block_order,
                        surah: 0,
                        ayah_start: 0,
                        ayah_end: 0,
                        textbook_translation_ur: block.candidate_urdu_translation || '',
                        curriculum_id: '',
                        display_note: 'UNRESOLVED: Reference pattern detected but surah/ayah could not be determined. Review required.',
                        _raw_arabic: block.content || block.html || block.text || ''
                    };
                    resolvedBlocks.push(unresolvedBlock);
                    logger.warn({ 
                        original_content: block.content?.substring(0, 100),
                        reason: 'Manual review needed for Quran reference'
                    }, 'Unresolved Quran reference');
                    continue;
                }

                // Verify surah/ayah exists in DB
                const existingAyah = await QuranAyah.findOne({ 
                    surah, 
                    ayah: ayah_start 
                }).lean();

                if (existingAyah) {
                    // Found - create proper quran_reference block
                    const resolvedBlock = {
                        type: 'quran_reference',
                        block_order: block.block_order,
                        surah,
                        ayah_start,
                        ayah_end: ayah_end || ayah_start,
                        textbook_translation_ur: block.candidate_urdu_translation || block.textbook_translation_ur || '',
                        curriculum_id: '',
                        display_note: ''
                    };
                    resolvedBlocks.push(resolvedBlock);
                } else {
                    // Not found - keep original block unchanged (never silently drop)
                    logger.warn({ 
                        surah, 
                        ayah_start, 
                        ayah_end,
                        original_content: block.content?.substring(0, 100)
                    }, 'Quran reference not found in database - preserving original block');
                    
                    const cleanBlock = { ...block };
                    delete cleanBlock.needs_quran_extraction;
                    delete cleanBlock.extracted_reference;
                    delete cleanBlock.candidate_urdu_translation;
                    delete cleanBlock.already_valid;
                    resolvedBlocks.push(cleanBlock);
                }
                continue;
            }

            // Case: Arabic detected but no reference pattern (Rule 1 only)
            if (block.needs_quran_extraction) {
                const unresolvedBlock = {
                    type: 'quran_reference',
                    block_order: block.block_order,
                    surah: 0,
                    ayah_start: 0,
                    ayah_end: 0,
                    textbook_translation_ur: block.candidate_urdu_translation || '',
                    curriculum_id: '',
                    display_note: 'UNRESOLVED: Arabic text detected but surah/ayah could not be determined. Review required.',
                    _raw_arabic: block.content || block.html || block.text || ''
                };
                resolvedBlocks.push(unresolvedBlock);
                logger.warn({ 
                    content_snippet: (block.content || '').substring(0, 100),
                    reason: 'Arabic text detected without reference pattern'
                }, 'Unresolved Quran Arabic text');
                continue;
            }

            // Case: No flags - pass through unchanged
            const cleanBlock = { ...block };
            delete cleanBlock.needs_quran_extraction;
            delete cleanBlock.extracted_reference;
            delete cleanBlock.candidate_urdu_translation;
            delete cleanBlock.already_valid;
            resolvedBlocks.push(cleanBlock);

        } catch (error) {
            logger.error({ 
                error: error.message, 
                block_type: block.type,
                content_snippet: (block.content || '').substring(0, 100)
            }, 'Error processing Quran block - preserving original');
            
            // Never crash - preserve original block
            const cleanBlock = { ...block };
            delete cleanBlock.needs_quran_extraction;
            delete cleanBlock.extracted_reference;
            delete cleanBlock.candidate_urdu_translation;
            delete cleanBlock.already_valid;
            resolvedBlocks.push(cleanBlock);
        }
    }

    return resolvedBlocks;
}
