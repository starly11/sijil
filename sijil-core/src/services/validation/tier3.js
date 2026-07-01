/**
 * Evaluates semantic content and parses telemetry data to identify data quality flags.
 * @param {any} rawTopic - The raw topic payload (pre-Zod normalization).
 * @param {any} validatedTopic - Fully clean, typed entity models produced by Zod schemas.
 * @param {any} documentLevel - Global metadata block details containing compilation attributes.
 * @returns {Array<{ type: string, topic_id: string, ref_id?: string, message: string }>}
 */
export function checkTier3Flags(rawTopic, validatedTopic, documentLevel) {
    const flags = [];

    // 1. Process document level telemetry flags if provided
    if (documentLevel) {
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

    if (!validatedTopic) return flags;
    const tId = validatedTopic._id || "unknown_topic";

    // 2. Scan image alt text description completeness
    if (Array.isArray(validatedTopic.figures)) {
        validatedTopic.figures.forEach(fig => {
            const altText = fig.alt || "";
            const wordCount = altText.trim().split(/\s+/).filter(Boolean).length;
            if (wordCount < 20) {
                flags.push({
                    type: "short_alt_text",
                    topic_id: tId,
                    ref_id: fig._id,
                    message: `Figure ${fig.figure_number || ''} alternative description text is terse (${wordCount} words). Accessibility pipelines require detailed descriptions.`
                });
            }
        });
    }

    // 3. Scan formula display property completeness
    if (Array.isArray(validatedTopic.formulas)) {
        validatedTopic.formulas.forEach(form => {
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

    // 4. Trace narrative prose length boundaries
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

    // 5. Evaluate un-normalized raw inputs for structural shape defects
    if (rawTopic) {
        if (Array.isArray(rawTopic.book_mcqs)) {
            rawTopic.book_mcqs.forEach((rawMcq, idx) => {
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