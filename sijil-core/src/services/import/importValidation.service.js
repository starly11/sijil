import { fetch } from 'undici';
import * as logger from '../../utils/logger.js';

/**
 * Import Validation Service
 * Validates repository content before import
 * No database writes - preview only
 */

/**
 * Fetch file content from GitHub
 * @param {string} token - GitHub PAT
 * @param {string} owner - Repository owner
 * @param {string} name - Repository name
 * @param {string} path - File path in repository
 * @returns {Promise<object>} Parsed JSON content
 */
export async function fetchFileContent(token, owner, name, path) {
    const url = `https://api.github.com/repos/${owner}/${name}/contents/${path}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.status}`);
    }

    const data = await response.json();
    
    // GitHub returns base64 encoded content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return JSON.parse(content);
}

/**
 * Validate document schema
 * @param {object} doc - Document JSON
 * @param {string} filePath - Path for error reporting
 * @returns {{valid: boolean, errors: Array, warnings: Array}}
 */
export function validateDocumentSchema(doc, filePath) {
    const errors = [];
    const warnings = [];

    // Check required top-level fields
    if (!doc.document_id) {
        errors.push({ field: 'document_id', message: 'Missing required field', file: filePath });
    }

    if (!doc.title) {
        errors.push({ field: 'title', message: 'Missing required field', file: filePath });
    }

    if (!doc.schema_version) {
        warnings.push({ field: 'schema_version', message: 'Missing schema_version - assuming 2.0.0', file: filePath });
    }

    // Check topics array
    if (!Array.isArray(doc.topics) || doc.topics.length === 0) {
        errors.push({ field: 'topics', message: 'Missing or empty topics array', file: filePath });
    } else {
        const topicIds = new Set();
        
        doc.topics.forEach((topic, index) => {
            // Check required topic fields
            if (!topic.topic_id) {
                errors.push({ 
                    field: `topics[${index}].topic_id`, 
                    message: 'Missing required topic_id', 
                    file: filePath 
                });
            } else {
                // Check for duplicate topic IDs
                if (topicIds.has(topic.topic_id)) {
                    errors.push({ 
                        field: `topics[${index}].topic_id`, 
                        message: `Duplicate topic_id: ${topic.topic_id}`, 
                        file: filePath 
                    });
                }
                topicIds.add(topic.topic_id);
            }

            if (!topic.slug) {
                errors.push({ 
                    field: `topics[${index}].slug`, 
                    message: 'Missing required slug', 
                    file: filePath 
                });
            }

            if (!topic.title) {
                errors.push({ 
                    field: `topics[${index}].title`, 
                    message: 'Missing required title', 
                    file: filePath 
                });
            }

            // Check content blocks
            if (!topic.content_blocks || !Array.isArray(topic.content_blocks)) {
                warnings.push({ 
                    field: `topics[${index}].content_blocks`, 
                    message: 'Missing or invalid content_blocks', 
                    file: filePath 
                });
            }

            // Check for missing alt text in images
            if (topic.content_blocks) {
                topic.content_blocks.forEach((block, blockIndex) => {
                    if (block.type === 'image' && !block.alt_text) {
                        warnings.push({ 
                            field: `topics[${index}].content_blocks[${blockIndex}].alt_text`, 
                            message: 'Image missing alt_text', 
                            file: filePath,
                            topic_id: topic.topic_id
                        });
                    }
                });
            }

            // Check for formulas
            if (topic.formulas && topic.formulas.length > 0) {
                topic.formulas.forEach((formula, fIndex) => {
                    if (!formula.latex) {
                        errors.push({ 
                            field: `topics[${index}].formulas[${fIndex}].latex`, 
                            message: 'Formula missing latex', 
                            file: filePath,
                            topic_id: topic.topic_id
                        });
                    }
                });
            }

            // Check assessments
            if (topic.assessments && topic.assessments.length > 0) {
                topic.assessments.forEach((assessment, aIndex) => {
                    if (!assessment.question) {
                        errors.push({ 
                            field: `topics[${index}].assessments[${aIndex}].question`, 
                            message: 'Assessment missing question', 
                            file: filePath,
                            topic_id: topic.topic_id
                        });
                    }
                    
                    if (assessment.type === 'mcq' && !assessment.options) {
                        errors.push({ 
                            field: `topics[${index}].assessments[${aIndex}].options`, 
                            message: 'MCQ assessment missing options', 
                            file: filePath,
                            topic_id: topic.topic_id
                        });
                    }
                });
            } else {
                warnings.push({ 
                    field: `topics[${index}].assessments`, 
                    message: 'Topic has no assessments', 
                    file: filePath,
                    topic_id: topic.topic_id
                });
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Count content statistics from documents
 * @param {Array} documents - Array of document objects
 * @returns {{total_topics: number, total_assets: number, total_assessments: number}}
 */
export function countContentStats(documents) {
    let total_topics = 0;
    let total_assets = 0;
    let total_assessments = 0;

    documents.forEach(doc => {
        if (doc.topics) {
            total_topics += doc.topics.length;
            
            doc.topics.forEach(topic => {
                // Count assets
                if (topic.assets) {
                    total_assets += topic.assets.length;
                }
                
                // Also count images in content blocks
                if (topic.content_blocks) {
                    topic.content_blocks.forEach(block => {
                        if (block.type === 'image') {
                            total_assets++;
                        }
                    });
                }

                // Count assessments
                if (topic.assessments) {
                    total_assessments += topic.assessments.length;
                }
            });
        }
    });

    return {
        total_topics,
        total_assets,
        total_assessments
    };
}

/**
 * Validate entire batch of documents
 * @param {Array} documents - Array of document objects
 * @param {Array} files - Array of file paths
 * @returns {{
 *   valid: boolean,
 *   total_documents: number,
 *   total_topics: number,
 *   total_assets: number,
 *   total_assessments: number,
 *   errors: Array,
 *   warnings: Array
 * }}
 */
export function validateBatch(documents, files) {
    const allErrors = [];
    const allWarnings = [];
    let validCount = 0;

    documents.forEach((doc, index) => {
        const result = validateDocumentSchema(doc, files[index]);
        
        if (result.valid) {
            validCount++;
        }
        
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    });

    const stats = countContentStats(documents);

    return {
        valid: validCount === documents.length,
        total_documents: documents.length,
        ...stats,
        errors: allErrors,
        warnings: allWarnings
    };
}
