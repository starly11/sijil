import { createHash } from 'crypto';

/** Block types that indicate structured extraction (not flat paragraph dump). */
const TYPED_BLOCK_TYPES = new Set([
    'heading', 'formula', 'figure', 'table', 'callout', 'mcq', 'example',
    'list', 'definition', 'learning_outcomes', 'comparison_view', 'quran_verse',
    'quran_reference', 'activity', 'equation', 'numerical',
]);

/** Valid section_number patterns for content topics. */
const VALID_SECTION_RE = /^\d+\.\d+([a-z])?$/i;
const INTRO_SECTION_RE = /^0(\.0)?$/;
const EXERCISE_SECTION_RE = /^999$/;

/**
 * Build a stable hash of a topic's content for duplicate detection.
 * @param {Object} topic
 * @returns {string}
 */
function hashTopicContent(topic) {
    const blocks = topic?.content_blocks || [];
    const payload = blocks.map(b => `${b.type}:${b.text || b.html || ''}`).join('|');
    return createHash('sha256').update(payload).digest('hex');
}

/**
 * Count block types across all topics.
 * @param {Array} topics
 * @returns {{ total: number, paragraph: number, typed: number, byType: Record<string, number> }}
 */
function summarizeBlockTypes(topics) {
    const byType = {};
    let total = 0;
    let paragraph = 0;

    for (const topic of topics) {
        for (const block of topic?.content_blocks || []) {
            total += 1;
            const type = block?.type || 'unknown';
            byType[type] = (byType[type] || 0) + 1;
            if (type === 'paragraph') paragraph += 1;
        }
    }

    const typed = total - paragraph;
    return { total, paragraph, typed, byType };
}

/**
 * Returns true if section_number is valid for a content topic.
 * @param {string} sectionNumber
 * @param {string} topicType
 */
function isValidSectionNumber(sectionNumber, topicType = 'content') {
    if (!sectionNumber) return topicType === 'intro';
    const s = String(sectionNumber).trim();
    if (INTRO_SECTION_RE.test(s) || EXERCISE_SECTION_RE.test(s)) return true;
    if (topicType === 'exercise') return EXERCISE_SECTION_RE.test(s);
    return VALID_SECTION_RE.test(s);
}

/**
 * Hard structural quality gate — runs for ALL imports (including batch).
 * Blocks ingest when extraction quality is too poor to be useful.
 * @param {Object} payload - Tier-2 repaired payload
 * @returns {{ passed: boolean, errors: Array, warnings: Array }}
 */
export function checkStructuralQuality(payload) {
    const errors = [];
    const warnings = [];
    const topics = payload?.topics || payload?.container?.topics || [];

    if (!Array.isArray(topics) || topics.length === 0) {
        return { passed: false, errors: [{ message: 'No topics found in payload.' }], warnings };
    }

    const { total, paragraph, typed, byType } = summarizeBlockTypes(topics);

    // 1. Paragraph-only dump detection
    if (total > 0) {
        const paragraphRatio = paragraph / total;
        if (paragraphRatio >= 0.95 && total >= 10) {
            errors.push({
                code: 'paragraph_only_extraction',
                message: `${Math.round(paragraphRatio * 100)}% of blocks are type "paragraph" (${paragraph}/${total}). Expected typed blocks: figure, table, formula, heading, callout, learning_outcomes, etc.`,
            });
        } else if (paragraphRatio >= 0.8 && total >= 10) {
            warnings.push({
                code: 'high_paragraph_ratio',
                message: `${Math.round(paragraphRatio * 100)}% paragraph blocks — structured extraction may be incomplete.`,
            });
        }
    }

    // 2. Zero typed blocks in large chapters
    if (total >= 20 && typed === 0) {
        errors.push({
            code: 'no_typed_blocks',
            message: `Chapter has ${total} blocks but zero typed blocks (figure, table, formula, heading, callout, etc.). Re-extract with structured block types.`,
        });
    }

    // 3. Duplicate content across topics (same chapter blob copied to every topic)
    const contentHashes = new Map();
    for (const topic of topics) {
        const hash = hashTopicContent(topic);
        if (!contentHashes.has(hash)) {
            contentHashes.set(hash, []);
        }
        contentHashes.get(hash).push(topic.title || topic._id);
    }
    for (const [hash, titles] of contentHashes.entries()) {
        if (titles.length >= 2) {
            errors.push({
                code: 'duplicate_topic_content',
                message: `${titles.length} topics share identical content_blocks (${titles.slice(0, 3).join(', ')}${titles.length > 3 ? '…' : ''}). Each topic must contain only its section's content.`,
                ref: hash.slice(0, 12),
            });
        }
    }

    // 4. Junk topics from table cells, units, or numeric fragments
    for (const topic of topics) {
        const section = topic?.section_number;
        const topicType = topic?.topic_type || 'content';
        if (section && !isValidSectionNumber(section, topicType)) {
            errors.push({
                code: 'invalid_section_number',
                topic_id: topic._id,
                message: `Topic "${topic.title}" has invalid section_number "${section}". Use formats like "1.1", "1.2" for sections, "0" for intro, "999" for exercises.`,
            });
        }

        // Titles that look like table fragments or bare units
        const title = (topic?.title || '').trim();
        if (/^TABLE\s+\d/i.test(title) || /^[\d.]+\s*[°KCFL%]+$/i.test(title) || title.length <= 2) {
            errors.push({
                code: 'junk_topic_title',
                topic_id: topic._id,
                message: `Topic title "${title}" looks like a table fragment or numeric value, not a real section. Do not create topics from table rows or units.`,
            });
        }
    }

    // 5. Duplicate slugs within chapter
    const slugCounts = {};
    for (const topic of topics) {
        const slug = topic?.slug;
        if (!slug) continue;
        slugCounts[slug] = (slugCounts[slug] || 0) + 1;
    }
    for (const [slug, count] of Object.entries(slugCounts)) {
        if (count > 1) {
            errors.push({
                code: 'duplicate_topic_slug',
                message: `Slug "${slug}" appears ${count} times in this chapter. Each topic must have a unique slug.`,
            });
        }
    }

    // 6. Generic SEO / GEO template detection (warnings)
    for (const topic of topics) {
        const metaDesc = topic?.seo?.meta_description || '';
        if (/^Learn about .+ with explanations/i.test(metaDesc)) {
            warnings.push({
                code: 'generic_seo_description',
                topic_id: topic._id,
                message: `Topic "${topic.title}" uses generic SEO meta_description. Write specific, value-rich descriptions.`,
            });
        }
        const geoSummary = topic?.geo?.llm_summary || '';
        if (/covers .+ concepts and principles/i.test(geoSummary) && geoSummary.length < 120) {
            warnings.push({
                code: 'generic_geo_summary',
                topic_id: topic._id,
                message: `Topic "${topic.title}" uses generic geo.llm_summary. Be specific and factual.`,
            });
        }
    }

    // 7. Missing figures when FIGURE mentions exist in paragraph text
    const figureBlockCount = byType.figure || 0;
    let figureMentions = 0;
    for (const topic of topics) {
        for (const block of topic?.content_blocks || []) {
            if (block?.type === 'paragraph' && /\bFIGURE\s+\d/i.test(block.text || '')) {
                figureMentions += 1;
            }
        }
    }
    if (figureMentions >= 3 && figureBlockCount === 0) {
        errors.push({
            code: 'figures_embedded_in_paragraphs',
            message: `Found ${figureMentions} paragraph blocks mentioning "FIGURE N" but zero type:"figure" blocks. Extract figures as typed blocks with image URL at the correct block_order.`,
        });
    }

    // 8. Missing tables when TABLE mentions exist
    const tableBlockCount = byType.table || 0;
    let tableMentions = 0;
    for (const topic of topics) {
        for (const block of topic?.content_blocks || []) {
            if (block?.type === 'paragraph' && /\bTABLE\s+\d/i.test(block.text || '')) {
                tableMentions += 1;
            }
        }
    }
    if (tableMentions >= 2 && tableBlockCount === 0) {
        errors.push({
            code: 'tables_embedded_in_paragraphs',
            message: `Found ${tableMentions} paragraph blocks mentioning "TABLE N" but zero type:"table" blocks. Extract tables as typed blocks with headers and rows.`,
        });
    }

    return {
        passed: errors.length === 0,
        errors,
        warnings,
        stats: { totalBlocks: total, paragraphBlocks: paragraph, typedBlocks: typed, blockTypes: byType },
    };
}

export { TYPED_BLOCK_TYPES, isValidSectionNumber, hashTopicContent };
