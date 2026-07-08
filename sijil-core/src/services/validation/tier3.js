/**
 * Evaluates semantic content and parses telemetry data to identify data quality flags.
 * @param {any} rawTopic - The raw topic payload (pre-Zod normalization).
 * @param {any} validatedTopic - Fully clean, typed entity models produced by Zod schemas.
 * @param {any} documentLevel - Global metadata block details containing compilation attributes.
 * @returns {Array<{ type: string, topic_id: string, ref_id?: string, message: string }>}
 */
export function checkTier3Flags(rawTopic, validatedTopic, documentLevel) {
    const flags = [];

    if (documentLevel && typeof documentLevel === 'object') {
        const score = documentLevel.confidence_score;
        if (typeof score === 'number' && score < 0.80) {
            flags.push({
                type: "low_confidence_score",
                topic_id: "document_level",
                message: `Ingestion layer runtime confidence falls below platform threshold: ${score}`
            });
        }
        if (Array.isArray(documentLevel.warnings) && documentLevel.warnings.length > 0) {
            flags.push({
                type: "ingest_warnings_present",
                topic_id: "document_level",
                message: `Upstream pipelines emitted processing warnings: [${documentLevel.warnings.join(', ')}]`
            });
        }
    }

    if (!validatedTopic || typeof validatedTopic !== 'object') return flags;
    const tId = validatedTopic._id || "unknown_topic";

    // Scan figures in top-level array AND content_blocks
    const figureSources = [
        ...(Array.isArray(validatedTopic.figures) ? validatedTopic.figures : []),
        ...(Array.isArray(validatedTopic.content_blocks)
            ? validatedTopic.content_blocks.filter(b => b?.type === 'figure')
            : []),
    ];
    figureSources.forEach(fig => {
        if (!fig || typeof fig !== 'object') return;
        const altText = fig.alt || "";
        const wordCount = altText.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount < 20) {
            flags.push({
                type: "short_alt_text",
                topic_id: tId,
                ref_id: fig._id || fig.figure_id,
                message: `Figure ${fig.figure_number || ''} alternative description text is terse (${wordCount} words). Accessibility pipelines require detailed descriptions.`
            });
        }
        if (!fig.image_path_local && !fig.url) {
            flags.push({
                type: "missing_figure_url",
                topic_id: tId,
                ref_id: fig._id || fig.figure_id,
                message: `Figure ${fig.figure_number || ''} has no image_path_local or url.`
            });
        }
    });

    if (Array.isArray(validatedTopic.formulas)) {
        validatedTopic.formulas.forEach(form => {
            if (!form || typeof form !== 'object') return;
            if (!form.latex || !form.text) {
                flags.push({
                    type: "incomplete_formula",
                    topic_id: tId,
                    ref_id: form.formula_id,
                    message: `Formula target named "${form.name || 'unnamed'}" lacks LaTeX compilation rendering strings.`
                });
            }
        });
    }

    const textStr = validatedTopic.raw_text || "";
    const proseWords = textStr.trim().split(/\s+/).filter(Boolean).length;
    if (proseWords === 0) {
        flags.push({
            type: "missing_raw_text",
            topic_id: tId,
            message: "The raw text corpus field is completely empty."
        });
    } else if (proseWords < 50) {
        flags.push({
            type: "low_word_count",
            topic_id: tId,
            message: `The text content length is unusually low (${proseWords} words). Verify content block extraction status.`
        });
    }

    if (rawTopic && typeof rawTopic === 'object') {
        if (Array.isArray(rawTopic.book_mcqs)) {
            rawTopic.book_mcqs.forEach((rawMcq, idx) => {
                if (!rawMcq || typeof rawMcq !== 'object') return;
                const optKeys = Object.keys(rawMcq?.options || {});
                if (optKeys.length !== 4) {
                    flags.push({
                        type: "irregular_mcq_options",
                        topic_id: tId,
                        ref_id: rawMcq?._id || `idx_${idx}`,
                        message: `Book MCQ has non-standard options structure configuration (${optKeys.length} choices found instead of 4).`
                    });
                }
            });
        }

        if (Array.isArray(rawTopic.content_blocks)) {
            rawTopic.content_blocks.forEach((rawBlk) => {
                if (!rawBlk || typeof rawBlk !== 'object') return;
                if (rawBlk?.type === "mcq") {
                    const optKeys = Object.keys(rawBlk?.options || {});
                    if (optKeys.length !== 4) {
                        flags.push({
                            type: "irregular_mcq_options",
                            topic_id: tId,
                            ref_id: rawBlk?._id,
                            message: `Content block MCQ contains abnormal options dimensions (${optKeys.length} choices found instead of 4).`
                        });
                    }
                }
            });
        }
    }

    return flags;
}

/**
 * Run tier-3 flags across ALL topics in a document payload.
 * @param {Object} payload
 * @returns {Array}
 */
export function checkAllTier3Flags(payload) {
    const topics = payload?.topics || payload?.container?.topics || [];
    const documentLevel = payload?.ingest_metadata;
    const allFlags = [];

    for (const topic of topics) {
        allFlags.push(...checkTier3Flags(topic, topic, documentLevel));
    }

    return allFlags;
}
