import * as logger from '../../utils/logger.js';
import { computeContentHash } from './computeContentHash.service.js';

/**
 * Validates topic structure before ingestion to catch common Qwen extraction failures.
 * Returns validation results with warnings/errors that can block or flag the import.
 */

const SECTION_NUMBER_REGEX = /^\d+\.\d$/;  // Only allow single digit after dot (1.1, 2.5) - reject 8.844
const JUNK_TOPIC_PATTERNS = [
    /^table\s*\d+/i,
    /^\d+\.\d{3,}$/,  // e.g., "8.844"
    /^[A-Z]$/,        // single letter like "L"
    /^\d+\.?\d*\s*°[CF]$/,  // temperature values
    /^[\d.]+\s*[a-z]+$/i,   // unit values like "8.844 L"
];

/**
 * Check if a topic appears to be junk (table fragment, unit value, etc.)
 */
function isJunkTopic(topic) {
    const title = (topic.title || '').trim();
    const sectionNumber = (topic.section_number || '').trim();
    
    // Check section_number format - should be like "1.1", "2.3", etc.
    if (sectionNumber && !SECTION_NUMBER_REGEX.test(sectionNumber)) {
        return { reason: 'invalid_section_number', value: sectionNumber };
    }
    
    // Check title against junk patterns
    for (const pattern of JUNK_TOPIC_PATTERNS) {
        if (pattern.test(title)) {
            return { reason: 'junk_title_pattern', pattern: pattern.toString(), title };
        }
    }
    
    // Check for duplicate section numbers within same chapter (handled at caller level)
    
    return null;
}

/**
 * Detect if content blocks are mostly paragraph-only (missing structured blocks)
 */
function analyzeBlockTypes(contentBlocks) {
    if (!Array.isArray(contentBlocks) || contentBlocks.length === 0) {
        return {
            total: 0,
            paragraphOnly: true,
            typeDistribution: {},
            hasFigures: false,
            hasTables: false,
            hasFormulas: false,
            hasCallouts: false,
            hasLearningOutcomes: false,
            qualityScore: 0
        };
    }
    
    const typeCounts = {};
    for (const block of contentBlocks) {
        const type = block.type || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    
    const total = contentBlocks.length;
    const paragraphCount = typeCounts.paragraph || 0;
    const paragraphRatio = total > 0 ? paragraphCount / total : 0;
    
    const result = {
        total,
        paragraphOnly: paragraphRatio === 1,
        typeDistribution: typeCounts,
        hasFigures: (typeCounts.figure || 0) > 0,
        hasTables: (typeCounts.table || 0) > 0,
        hasFormulas: (typeCounts.formula || 0) > 0 || (typeCounts.equation || 0) > 0,
        hasCallouts: (typeCounts.callout || 0) > 0,
        hasLearningOutcomes: (typeCounts.learning_outcomes || 0) > 0,
        qualityScore: calculateQualityScore(typeCounts, total)
    };
    
    return result;
}

/**
 * Calculate a simple quality score based on block type diversity
 */
function calculateQualityScore(typeCounts, total) {
    if (total === 0) return 0;
    
    // Penalize paragraph-only heavily
    const paragraphRatio = (typeCounts.paragraph || 0) / total;
    if (paragraphRatio === 1) return 10;
    
    // Reward diversity
    const uniqueTypes = Object.keys(typeCounts).length;
    const baseScore = Math.min(uniqueTypes * 15, 60);
    
    // Bonus for specific important types
    let bonus = 0;
    if (typeCounts.figure > 0) bonus += 10;
    if (typeCounts.table > 0) bonus += 10;
    if (typeCounts.formula > 0 || typeCounts.equation > 0) bonus += 10;
    if (typeCounts.callout > 0) bonus += 5;
    if (typeCounts.learning_outcomes > 0) bonus += 5;
    
    return Math.min(baseScore + bonus, 100);
}

/**
 * Detect duplicate content across topics in the same chapter
 */
function detectDuplicateTopics(topics) {
    if (!Array.isArray(topics) || topics.length === 0) {
        return { duplicates: [], uniqueCount: 0 };
    }
    
    const hashToTopics = new Map();
    const duplicates = [];
    
    for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const contentBlocks = topic.content_blocks || [];
        
        // Hash the concatenated text of all blocks
        const blockTexts = contentBlocks.map(b => b.text || b.html || '').join(' ');
        const hash = computeContentHash(blockTexts);
        
        if (hashToTopics.has(hash)) {
            const existing = hashToTopics.get(hash);
            duplicates.push({
                topic_index: i,
                topic_id: topic._id || topic.topic_id || `topic-${i}`,
                title: topic.title,
                slug: topic.slug,
                duplicated_with: {
                    topic_index: existing.index,
                    topic_id: existing.topic_id,
                    title: existing.title
                },
                block_count: contentBlocks.length,
                hash
            });
        } else {
            hashToTopics.set(hash, {
                index: i,
                topic_id: topic._id || topic.topic_id || `topic-${i}`,
                title: topic.title,
                slug: topic.slug
            });
        }
    }
    
    return {
        duplicates,
        uniqueCount: hashToTopics.size
    };
}

/**
 * Main validation function - runs all structural checks
 */
export function validateTopicStructure(validatedData) {
    const results = {
        passed: true,
        errors: [],
        warnings: [],
        info: [],
        stats: {}
    };
    
    const topics = validatedData.topics || validatedData.container?.topics || [];
    if (!Array.isArray(topics) || topics.length === 0) {
        results.errors.push({
            code: 'NO_TOPICS',
            message: 'No topics found in payload'
        });
        results.passed = false;
        return results;
    }
    
    // 1. Detect junk topics
    const junkTopics = [];
    for (let i = 0; i < topics.length; i++) {
        const junk = isJunkTopic(topics[i]);
        if (junk) {
            junkTopics.push({
                topic_index: i,
                topic_id: topics[i]._id || topics[i].topic_id || `topic-${i}`,
                title: topics[i].title,
                slug: topics[i].slug,
                section_number: topics[i].section_number,
                reason: junk.reason,
                details: junk
            });
        }
    }
    
    if (junkTopics.length > 0) {
        results.warnings.push({
            code: 'JUNK_TOPICS_DETECTED',
            count: junkTopics.length,
            topics: junkTopics,
            message: `${junkTopics.length} topic(s) appear to be fragments or invalid (table cells, units, etc.)`
        });
    }
    
    // 2. Analyze block types per topic
    const blockAnalysis = [];
    let totalParagraphOnly = 0;
    
    for (let i = 0; i < topics.length; i++) {
        const analysis = analyzeBlockTypes(topics[i].content_blocks);
        blockAnalysis.push({
            topic_index: i,
            topic_id: topics[i]._id || topics[i].topic_id || `topic-${i}`,
            title: topics[i].title,
            ...analysis
        });
        
        if (analysis.paragraphOnly) {
            totalParagraphOnly++;
        }
    }
    
    results.stats.blockAnalysis = blockAnalysis;
    
    if (totalParagraphOnly === topics.length) {
        results.warnings.push({
            code: 'ALL_TOPICS_PARAGRAPH_ONLY',
            count: totalParagraphOnly,
            message: `All ${topics.length} topics contain only paragraph blocks - no figures, tables, formulas, or callouts detected`
        });
    } else if (totalParagraphOnly > topics.length * 0.8) {
        results.warnings.push({
            code: 'MOSTLY_PARAGRAPH_ONLY',
            count: totalParagraphOnly,
            percentage: Math.round((totalParagraphOnly / topics.length) * 100),
            message: `${totalParagraphOnly}/${topics.length} topics (${Math.round((totalParagraphOnly / topics.length) * 100)}%) contain only paragraph blocks`
        });
    }
    
    // 3. Detect duplicate content
    const duplicateAnalysis = detectDuplicateTopics(topics);
    results.stats.duplicateAnalysis = duplicateAnalysis;
    
    if (duplicateAnalysis.duplicates.length > 0) {
        results.errors.push({
            code: 'DUPLICATE_CONTENT_DETECTED',
            count: duplicateAnalysis.duplicates.length,
            duplicates: duplicateAnalysis.duplicates,
            message: `${duplicateAnalysis.duplicates.length} topic(s) have identical content to other topics in this chapter`
        });
        results.passed = false;
    }
    
    // 4. Check for missing required fields
    const missingFields = [];
    for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        if (!topic.title) missingFields.push(`topics[${i}].title`);
        if (!topic.content_blocks || !Array.isArray(topic.content_blocks)) {
            missingFields.push(`topics[${i}].content_blocks`);
        }
    }
    
    if (missingFields.length > 0) {
        results.errors.push({
            code: 'MISSING_REQUIRED_FIELDS',
            fields: missingFields,
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
        results.passed = false;
    }
    
    // 5. Summary stats
    results.stats.total_topics = topics.length;
    results.stats.junk_topics = junkTopics.length;
    results.stats.paragraph_only_topics = totalParagraphOnly;
    results.stats.unique_topics = duplicateAnalysis.uniqueCount;
    
    // Calculate overall quality score
    const avgQualityScore = blockAnalysis.length > 0
        ? Math.round(blockAnalysis.reduce((sum, a) => sum + a.qualityScore, 0) / blockAnalysis.length)
        : 0;
    results.stats.average_quality_score = avgQualityScore;
    
    if (avgQualityScore < 30) {
        results.warnings.push({
            code: 'LOW_QUALITY_SCORE',
            score: avgQualityScore,
            message: `Average content quality score is ${avgQualityScore}/100 - consider re-running extraction with improved prompt`
        });
    }
    
    logger.info({
        total_topics: topics.length,
        junk_topics: junkTopics.length,
        paragraph_only: totalParagraphOnly,
        duplicates: duplicateAnalysis.duplicates.length,
        quality_score: avgQualityScore,
        passed: results.passed
    }, 'Structural validation completed');
    
    return results;
}

/**
 * Filter out junk topics from the topics array (optional - use with caution)
 */
export function filterJunkTopics(topics) {
    if (!Array.isArray(topics)) return [];
    
    return topics.filter((topic, index) => {
        const junk = isJunkTopic(topic);
        if (junk) {
            logger.warn({
                topic_index: index,
                title: topic.title,
                reason: junk.reason
            }, 'Filtering out junk topic');
            return false;
        }
        return true;
    });
}
