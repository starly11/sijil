import mongoose from 'mongoose';

/**
 * Phase 8 Formula Search Service
 * Searches LaTeX formulas in formula_index collection
 */

/**
 * Escape regex special characters in a string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Search formulas by query string
 * Supports fuzzy matching on name, text, and latex_normalized
 */
export async function searchFormulas({
    query,
    subject,
    grade,
    limit = 20
}) {
    const FormulaIndex = mongoose.model('FormulaIndex');
    
    if (!query || query.trim() === '') {
        throw new Error('Formula search query is required');
    }

    const escapedQuery = escapeRegex(query);

    const searchPipeline = [];

    // Build match stage for text search
    const matchConditions = {
        $or: [
            { name: { $regex: escapedQuery, $options: 'i' } },
            { text: { $regex: escapedQuery, $options: 'i' } },
            { latex_normalized: { $regex: escapedQuery, $options: 'i' } }
        ]
    };

    // Add filters if provided
    if (subject) {
        matchConditions.subject = subject;
    }
    
    if (grade !== undefined && grade !== null) {
        matchConditions.grade = Number(grade);
    }

    searchPipeline.push({ $match: matchConditions });

    // Add relevance score based on field matches
    searchPipeline.push({
        $addFields: {
            relevanceScore: {
                $switch: {
                    branches: [
                        { case: { $regexMatch: { input: '$name', regex: escapedQuery, options: 'i' } }, then: 3 },
                        { case: { $regexMatch: { input: '$text', regex: escapedQuery, options: 'i' } }, then: 2 },
                        { case: { $regexMatch: { input: '$latex_normalized', regex: escapedQuery, options: 'i' } }, then: 1 }
                    ],
                    default: 0
                }
            }
        }
    });

    // Sort by relevance
    searchPipeline.push({ $sort: { relevanceScore: -1 } });

    // Apply limit
    searchPipeline.push({ $limit: limit });

    // Execute search
    const results = await FormulaIndex.aggregate(searchPipeline).exec();

    return results.map(formula => ({
        _id: formula._id,
        id: formula._id,
        name: formula.name,
        latex: formula.latex,
        text: formula.text,
        latex_normalized: formula.latex_normalized,
        variables: formula.variables,
        topic_id: formula.topic_id,
        document_id: formula.document_id,
        subject: formula.subject,
        grade: formula.grade,
        relevanceScore: formula.relevanceScore
    }));
}

/**
 * Search formulas by variable name (e.g., "F", "ma", "velocity")
 */
export async function searchFormulasByVariable(variableName) {
    const FormulaIndex = mongoose.model('FormulaIndex');
    
    if (!variableName || variableName.trim() === '') {
        throw new Error('Variable name is required');
    }

    const results = await FormulaIndex.find({
        variables: { $in: [variableName.trim()] }
    })
    .limit(20)
    .lean();

    return results.map(formula => ({
        _id: formula._id,
        id: formula._id,
        name: formula.name,
        latex: formula.latex,
        text: formula.text,
        variables: formula.variables,
        topic_id: formula.topic_id,
        document_id: formula.document_id,
        subject: formula.subject,
        grade: formula.grade
    }));
}

/**
 * Normalize LaTeX formula for fuzzy matching
 * Removes extra whitespace and standardizes brace usage
 */
export function normalizeLatex(latex) {
    if (!latex) return '';
    
    return latex
        .replace(/\s+/g, ' ')           // Collapse multiple spaces
        .replace(/\\(\w+)\s*\{([^}]*)\}/g, '\\$1{$2}') // Standardize command spacing
        .trim();
}

/**
 * Extract variables from LaTeX formula
 * Looks for single-letter variables like F, m, a, v, etc.
 */
export function extractVariables(latex) {
    if (!latex) return [];
    
    const variablePattern = /(?<![a-zA-Z\\])([a-zA-Z])(?![a-zA-Z])/g;
    const matches = [...latex.matchAll(variablePattern)];
    
    // Get unique variables, exclude common LaTeX commands
    const excluded = ['f', 'o', 'r', 'n', 't', 'x', 'i', 'c', 'd', 's'];
    const variables = [...new Set(matches.map(m => m[1]))]
        .filter(v => !excluded.includes(v.toLowerCase()));
    
    return variables;
}
