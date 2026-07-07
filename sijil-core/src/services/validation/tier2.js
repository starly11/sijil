import { sanitizeSlug, SLUG_REGEX } from '../slug.service.js';

/**
 * Repairs syntax variations, truncates length overruns, and fixes formatting errors.
 * @param {any} rawParsed - Structural layout elements passing basic Tier 1 criteria.
 * @returns {{ repaired: any, autoFixLog: Array<{ type: string, topic_id: string, message: string }> }}
 */
export function applyTier2AutoFixes(rawParsed) {
    const repaired = structuredClone(rawParsed);
    const autoFixLog = [];

    if (!repaired) {
        return { repaired, autoFixLog };
    }
    
    // Ensure topics is an array
    if (!Array.isArray(repaired.topics)) {
        if (repaired.container && Array.isArray(repaired.container.topics)) {
            repaired.topics = repaired.container.topics;
        } else {
            repaired.topics = [];
        }
    }

    // Additional safety check - ensure topics is not null/undefined before forEach
    if (!repaired.topics || !Array.isArray(repaired.topics)) {
        return { repaired, autoFixLog };
    }

    repaired.topics.forEach((topic) => {
        if (!topic) return;
        const tId = topic?._id || 'unknown_topic';

        // 1. Structural SEO Field Length Limits Truncation
        if (topic?.seo?.meta_title && topic.seo.meta_title.length > 60) {
            const oldTitle = topic.seo.meta_title;
            topic.seo.meta_title = oldTitle.slice(0, 57) + "...";
            autoFixLog.push({
                type: "seo_meta_title_truncated",
                topic_id: tId,
                message: `Truncated meta_title from ${oldTitle.length} to ${topic.seo.meta_title.length} characters.`
            });
        }

        if (topic?.seo?.meta_description && topic.seo.meta_description.length > 160) {
            const oldDesc = topic.seo.meta_description;
            topic.seo.meta_description = oldDesc.slice(0, 157) + "...";
            autoFixLog.push({
                type: "seo_meta_description_truncated",
                topic_id: tId,
                message: `Truncated meta_description from ${oldDesc.length} to ${topic.seo.meta_description.length} characters.`
            });
        }

        // 2. Format Invalidation Recovery using Engine Sanitizers
        if (topic?.slug && !SLUG_REGEX.test(topic.slug)) {
            const oldSlug = topic.slug;
            topic.slug = sanitizeSlug(topic.slug);
            autoFixLog.push({
                type: "slug_sanitized",
                topic_id: tId,
                message: `Sanitized invalid slug structure: "${oldSlug}" modified to "${topic.slug}"`
            });
        }

        // 3. Coerce String Fields representing Integer coordinates
        if (typeof topic?.source_page_start === 'string') {
            topic.source_page_start = Number.parseInt(topic.source_page_start, 10);
        }
        if (typeof topic?.source_page_end === 'string') {
            topic.source_page_end = Number.parseInt(topic.source_page_end, 10);
        }

        if (Array.isArray(topic?.content_blocks)) {
            let orderChanged = false;

            topic.content_blocks.forEach((block, orderIdx) => {
                if (!block) return;
                if (typeof block?.source_page === 'string') {
                    block.source_page = Number.parseInt(block.source_page, 10);
                }

                // 4. Sequential re-indexing for internal display orders
                const targetOrder = orderIdx + 1;
                if (block.block_order !== targetOrder) {
                    block.block_order = targetOrder;
                    orderChanged = true;
                }

                // 5. Normalizing multiple choice response options
                if (block.type === "mcq") {
                    normalizeMcqItem(block, tId, autoFixLog, `content_block index ${orderIdx}`);
                }
            });

            if (orderChanged) {
                autoFixLog.push({
                    type: "block_orders_sequentialized",
                    topic_id: tId,
                    message: `Fixed broken gaps or structural duplicates in content_blocks layout coordinates.`
                });
            }
        }

        if (Array.isArray(topic?.book_mcqs)) {
            topic.book_mcqs.forEach((mcq, idx) => {
                if (!mcq) return;
                normalizeMcqItem(mcq, tId, autoFixLog, `book_mcqs index ${idx}`);
            });
        }
    });

    return { repaired, autoFixLog };
}

/** Helper utility mapping unstructured marking keys to lowercased options keys. */
function normalizeMcqItem(item, topicId, log, locationRef) {
    if (!item || !item.options) return;
    let ans = item.correct_answer;
    if (typeof ans !== 'string') return;

    // Exact alpha conversion mapping
    if (/^[A-D]$/.test(ans)) {
        item.correct_answer = ans.toLowerCase();
        log.push({
            type: "mcq_answer_lowercased",
            topic_id: topicId,
            message: `Normalized key case mapping at ${locationRef} from "${ans}" to "${item.correct_answer}".`
        });
        return;
    }

    // Text alignment check match logic
    const normalizedAns = ans.trim().toLowerCase();
    for (const key of ['a', 'b', 'c', 'd']) {
        const optVal = item.options[key];
        if (typeof optVal === 'string' && optVal.trim().toLowerCase() === normalizedAns) {
            item.correct_answer = key;
            log.push({
                type: "mcq_answer_resolved_from_text",
                topic_id: topicId,
                message: `Mapped full option text match at ${locationRef} back to canonical option key "${key}".`
            });
            return;
        }
    }

    log.push({
        type: "mcq_answer_unmapped_warning",
        topic_id: topicId,
        message: `MCQ choice text mismatch flagged at ${locationRef}: "${ans}" does not fit options schemas.`
    });
}