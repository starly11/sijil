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
    logger.info({ url, path }, 'Fetching file from GitHub');
    
    const response = await fetch(url, {
        headers: {
            'Authorization': token ? `token ${token}` : undefined,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        let errorDetails;
        try {
            errorDetails = await response.json();
        } catch {
            errorDetails = null;
        }
        throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}${errorDetails ? ` - ${JSON.stringify(errorDetails)}` : ''}`);
    }

    const data = await response.json();
    logger.info({ 
        dataType: typeof data, 
        hasContent: !!data.content, 
        contentLength: data.content ? data.content.length : 0,
        dataKeys: Object.keys(data),
        dataSize: JSON.stringify(data).length,
        gitUrl: data.git_url,
        downloadUrl: data.download_url,
        size: data.size,
        sha: data.sha
    }, 'GitHub response data');
    
    let content;
    
    // If content is available (small file), use it
    if (data.content) {
        try {
            content = Buffer.from(data.content, 'base64').toString('utf-8');
            logger.info({ contentLength: content.length, contentPreview: content.substring(0, 200) }, 'Decoded file content (from contents API)');
        } catch (e) {
            logger.error({ err: e }, 'Error decoding Base64 content');
            throw e;
        }
    } else if (data.download_url) {
        // For larger files, use download_url
        logger.info({ downloadUrl: data.download_url }, 'Using download_url for large file');
        
        const downloadHeaders = {
            'Accept': 'application/vnd.github.v3+json'
        };
        if (token) {
            downloadHeaders['Authorization'] = `token ${token}`;
        }
        
        const downloadResponse = await fetch(data.download_url, {
            headers: downloadHeaders
        });
        if (!downloadResponse.ok) {
            const errorText = await downloadResponse.text();
            logger.error({ 
                status: downloadResponse.status, 
                statusText: downloadResponse.statusText,
                url: data.download_url,
                responseBody: errorText.substring(0, 500)
            }, 'Download URL failed');
            throw new Error(`Failed to download ${path} via download_url: ${downloadResponse.status} ${downloadResponse.statusText} - ${errorText.substring(0, 200)}`);
        }
        content = await downloadResponse.text();
        logger.info({ contentLength: content.length, contentPreview: content.substring(0, 200) }, 'File content from download_url');
    } else {
        throw new Error(`No content or download_url available for ${path}`);
    }
    
    try {
        return JSON.parse(content);
    } catch (e) {
        logger.error({ err: e, content: content.substring(0, 500) }, 'Error parsing JSON content');
        throw e;
    }
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

    // Handle both flat schema and DocumentIngestSchema with nested document_metadata/container
    const docMeta = doc.document_metadata || doc;
    const topics = doc.topics || doc.container?.topics || [];

    // Check required top-level fields
    if (!docMeta.document_id && !docMeta._id) {
        errors.push({ field: 'document_metadata.document_id', message: 'Missing required document_id', file: filePath });
    }

    if (!docMeta.title) {
        errors.push({ field: 'document_metadata.title', message: 'Missing required title', file: filePath });
    }

    if (!doc.schema_version) {
        warnings.push({ field: 'schema_version', message: 'Missing schema_version - assuming 2.0.0', file: filePath });
    }

    // Check topics array
    if (!Array.isArray(topics) || topics.length === 0) {
        errors.push({ field: 'topics', message: 'Missing or empty topics array', file: filePath });
    } else {
        const topicIds = new Set();
        
        topics.forEach((topic, index) => {
            // Check required topic fields
            const topicId = topic.topic_id || topic._id;
            if (!topicId) {
                errors.push({ 
                    field: `topics[${index}].topic_id`, 
                    message: 'Missing required topic_id', 
                    file: filePath 
                });
            } else {
                // Check for duplicate topic IDs
                if (topicIds.has(topicId)) {
                    errors.push({ 
                        field: `topics[${index}].topic_id`, 
                        message: `Duplicate topic_id: ${topicId}`, 
                        file: filePath 
                    });
                }
                topicIds.add(topicId);
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
                    if ((block.type === 'image' || block.type === 'figure') && !block.alt_text && !block.alt) {
                        warnings.push({ 
                            field: `topics[${index}].content_blocks[${blockIndex}].alt_text`, 
                            message: 'Image missing alt_text', 
                            file: filePath,
                            topic_id: topicId
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
                            topic_id: topicId
                        });
                    }
                });
            }

            // Check assessments
            const assessments = topic.assessments?.mcqs || topic.assessments || [];
            if (assessments.length > 0) {
                assessments.forEach((assessment, aIndex) => {
                    if (!assessment.question) {
                        errors.push({ 
                            field: `topics[${index}].assessments[${aIndex}].question`, 
                            message: 'Assessment missing question', 
                            file: filePath,
                            topic_id: topicId
                        });
                    }
                    
                    if (assessment.type === 'mcq' && !assessment.options) {
                        errors.push({ 
                            field: `topics[${index}].assessments[${aIndex}].options`, 
                            message: 'MCQ assessment missing options', 
                            file: filePath,
                            topic_id: topicId
                        });
                    }
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
        // Handle nested topics
        const topics = doc.topics || doc.container?.topics || [];
        
        if (topics) {
            total_topics += topics.length;
            
            topics.forEach(topic => {
                // Count assets
                if (topic.assets) {
                    total_assets += topic.assets.length;
                }
                
                // Also count images/figures in content blocks
                if (topic.content_blocks) {
                    topic.content_blocks.forEach(block => {
                        if (block.type === 'image' || block.type === 'figure') {
                            total_assets++;
                        }
                    });
                }

                // Count assessments
                const assessments = topic.assessments?.mcqs || topic.assessments || [];
                total_assessments += assessments.length;
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
