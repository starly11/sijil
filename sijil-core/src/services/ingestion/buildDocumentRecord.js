/**
 * Assembles the master core document entry record calculating multi-tier aggregate stats.
 * @param {Object} validatedData - Clean validation schema tree root.
 * @param {string} documentId - Calculated static unique canonical ID mapping key.
 * @param {string} documentSlug - Evaluated canonical slug path reference.
 * @param {Array} topicRefs - Lightweight reference links representing organized topic nodes.
 * @param {Object} normalizedBundles - Output collection payloads to summarize properties from.
 */
export function buildDocumentRecord(validatedData, documentId, documentSlug, topicRefs, normalizedBundles) {
    // Handle both old flat structure and new validated schema structure
    const docMeta = validatedData.document_metadata || validatedData;
    const container = validatedData.container || {};
    
    let totalBlocks = 0;
    let totalFormulas = 0;
    let totalImages = 0;
    let totalTables = 0;
    let totalMcqs = 0;
    let totalFlashcards = 0;
    let totalShortQs = 0;

    if (Array.isArray(normalizedBundles.normalizedTopics)) {
        normalizedBundles.normalizedTopics.forEach(t => {
            totalBlocks += t.summary_counters.total_blocks;
            totalFormulas += t.summary_counters.total_formulas;
            totalImages += t.summary_counters.total_images;
            totalTables += t.summary_counters.total_tables;
            totalMcqs += t.summary_counters.total_mcqs;
            totalFlashcards += t.summary_counters.total_flashcards;
        });
    }

    if (Array.isArray(normalizedBundles.normalizedTopicAssessments)) {
        normalizedBundles.normalizedTopicAssessments.forEach(a => {
            if (Array.isArray(a.book_short_questions)) {
                totalShortQs += a.book_short_questions.length;
            }
        });
    }

    const totalKeyTerms = Array.isArray(normalizedBundles.normalizedTopicContents)
        ? normalizedBundles.normalizedTopicContents.reduce(
            (sum, c) => sum + (Array.isArray(c.key_terms) ? c.key_terms.length : 0),
            0
        )
        : 0;

    // Build document with both top-level title (backward compatibility) and document_metadata
    return {
        _id: documentId,
        title: docMeta.title,
        slug: documentSlug,
        schema_version: validatedData.schema_version || '1.0.0',
        schema_type: 'document',
        document_metadata: {
            _id: documentId,
            document_id: documentId,
            title: docMeta.title,
            title_vernacular: docMeta.title_vernacular || '',
            subtitle: docMeta.subtitle || '',
            subject: docMeta.subject || '',
            subject_slug: documentSlug,
            language: docMeta.language || 'english'
        },
        ingest_metadata: {
            ingest_id: validatedData.ingest_metadata?.ingest_id || validatedData.ingest_id || 'ingest-dummy-id',
            source_file_sha256: validatedData.ingest_metadata?.source_file_sha256 || validatedData.source_file_sha256 || '',
            source_file_name: validatedData.ingest_metadata?.source_file_name || validatedData.source_file_name || '',
            status: validatedData.ingest_metadata?.status || 'complete'
        },
        container: {
            _id: container._id || container.id || normalizedBundles.containerId,
            container_type: 'chapter',
            number: 1,
            title: container.title || '',
            slug: container.slug || ''
        },
        topic_refs: topicRefs.map((t, idx) => ({
            _id: t.topic_id,
            slug: t.slug,
            slug_global: normalizedBundles.normalizedTopics[idx]?.slug_global || t.slug,
            title: t.title,
            display_order: t.order_index || idx,
            url_path: normalizedBundles.normalizedTopics[idx]?.url_path || ''
        })),
        document_aggregates: {
            total_topics: topicRefs.length,
            total_blocks: totalBlocks,
            total_formulas: totalFormulas,
            total_images: totalImages,
            total_tables: totalTables,
            total_mcqs: totalMcqs,
            total_flashcards: totalFlashcards,
            total_short_questions: totalShortQs,
            total_numerical_problems: 0, // Fallback hooks for future calculation requirements
            total_key_terms: totalKeyTerms
        }
    };
}