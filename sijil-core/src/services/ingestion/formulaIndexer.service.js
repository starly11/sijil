import { generateEntityId } from '../id.service.js';

/**
 * Normalize LaTeX for fuzzy formula search matching.
 * @param {string} latex
 * @returns {string}
 */
export function normalizeLatex(latex) {
    if (!latex || typeof latex !== 'string') return '';
    return latex.replace(/\s+/g, '').replace(/[{}]/g, '');
}

/**
 * Build formula_index records from topic-level formulas and formula/equation content blocks.
 * @param {Object} params
 * @returns {Array<Object>}
 */
export function buildFormulaIndexRecords({
    topicId,
    documentId,
    subject,
    gradeNumeric,
    topicFormulas = [],
    contentBlocks = [],
}) {
    const records = [];
    const seen = new Set();

    const pushRecord = (entry, source) => {
        const latex = entry.latex || '';
        const text = entry.text || entry.name || '';
        const key = `${latex}|${text}|${entry.formula_id || entry._id || ''}`;
        if (seen.has(key)) return;
        seen.add(key);

        const variables = Array.isArray(entry.variables)
            ? entry.variables.map(v => (typeof v === 'string' ? v : v?.symbol)).filter(Boolean)
            : [];

        records.push({
            _id: entry._id || entry.formula_id || generateEntityId('formula'),
            name: entry.name || text || 'Formula',
            latex,
            text,
            latex_normalized: normalizeLatex(latex),
            variables,
            topic_id: topicId,
            document_id: documentId,
            subject: subject || entry.subject_area || '',
            grade: gradeNumeric ?? null,
            source,
        });
    };

    for (const formula of topicFormulas) {
        pushRecord(formula, 'topic_formulas');
    }

    for (const block of contentBlocks) {
        if (block?.type !== 'formula' && block?.type !== 'equation') continue;
        pushRecord({
            _id: block._id || block.formula_id,
            formula_id: block.formula_id,
            name: block.name,
            latex: block.latex,
            text: block.text,
            variables: block.variables,
            subject_area: block.subject_area,
        }, 'content_block');
    }

    return records;
}
