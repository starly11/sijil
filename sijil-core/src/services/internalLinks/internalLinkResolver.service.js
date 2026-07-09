/**
 * Internal Link Resolution Service
 * 
 * Resolves cross-concept links by matching slug_refs against existing topics
 * and updates the entity_extraction.cross_concept_links array with resolved URLs.
 */

const Topic = require('../models/topic.model');
const TopicContent = require('../models/topicContent.model');
const logger = require('../utils/logger');

/**
 * Normalize a slug for comparison
 * - Lowercase
 * - Remove special characters
 * - Replace spaces with hyphens
 */
function normalizeSlug(slug) {
  if (!slug) return '';
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Extract potential slugs from a slug_ref
 * Returns array of possible matches to try
 */
function extractSlugVariations(slugRef) {
  if (!slugRef) return [];
  
  const variations = [slugRef];
  
  // Try without book prefix (e.g., "chemistry/essential-ideas/..." -> "essential-ideas/...")
  const parts = slugRef.split('/');
  if (parts.length > 1) {
    variations.push(parts.slice(1).join('/'));
  }
  
  // Try last part only (e.g., "chemistry-in-context")
  if (parts.length > 0) {
    variations.push(parts[parts.length - 1]);
  }
  
  // Add normalized versions
  const normalized = variations.map(normalizeSlug);
  return [...variations, ...normalized].filter(Boolean);
}

/**
 * Find a topic that matches any of the slug variations
 */
async function findMatchingTopic(slugVariations, excludeTopicId = null) {
  for (const slug of slugVariations) {
    const topic = await Topic.findOne({
      $or: [
        { slug: slug },
        { slug_global: slug },
        { 'seo.slug': slug }
      ],
      ...(excludeTopicId && { _id: { $ne: excludeTopicId } })
    });
    
    if (topic) {
      return topic;
    }
  }
  
  return null;
}

/**
 * Resolve internal links for a single topic
 * Updates cross_concept_links with resolved URLs and target IDs
 */
async function resolveInternalLinksForTopic(topicId) {
  const startTime = Date.now();
  
  try {
    const topic = await Topic.findById(topicId);
    if (!topic) {
      logger.warn(`[InternalLinks] Topic not found: ${topicId}`);
      return { resolved: 0, skipped: 0 };
    }
    
    const topicContent = await TopicContent.findOne({ topic_id: topicId });
    if (!topicContent || !topicContent.entity_extraction?.cross_concept_links) {
      logger.debug(`[InternalLinks] No cross_concept_links for topic: ${topicId}`);
      return { resolved: 0, skipped: 0 };
    }
    
    const links = topicContent.entity_extraction.cross_concept_links;
    let resolvedCount = 0;
    let skippedCount = 0;
    
    for (const link of links) {
      // Skip if already resolved
      if (link.resolved && link.resolved_url) {
        skippedCount++;
        continue;
      }
      
      const slugVariations = extractSlugVariations(link.slug_ref);
      const matchedTopic = await findMatchingTopic(slugVariations, topicId);
      
      if (matchedTopic) {
        // Update the link in place
        link.resolved = true;
        link.resolved_url = `/topics/${matchedTopic.slug_global}`;
        link.target_entity_id = matchedTopic._id.toString();
        
        // Use target_entity as fallback if not set
        if (!link.target_entity) {
          link.target_entity = matchedTopic.title;
        }
        
        resolvedCount++;
        logger.debug(`[InternalLinks] Resolved "${link.slug_ref}" → ${matchedTopic.slug_global}`);
      } else {
        logger.debug(`[InternalLinks] No match for "${link.slug_ref}"`);
      }
    }
    
    // Save updated topic content if any links were resolved
    if (resolvedCount > 0) {
      await topicContent.save();
      logger.info(`[InternalLinks] Updated ${resolvedCount} links for topic ${topicId} (${Date.now() - startTime}ms)`);
    }
    
    return { resolved: resolvedCount, skipped: skippedCount };
    
  } catch (error) {
    logger.error(`[InternalLinks] Error resolving links for topic ${topicId}: ${error.message}`);
    throw error;
  }
}

/**
 * Batch resolve internal links for multiple topics
 */
async function batchResolveInternalLinks(topicIds) {
  const results = {
    total: topicIds.length,
    resolved: 0,
    skipped: 0,
    errors: 0
  };
  
  for (const topicId of topicIds) {
    try {
      const result = await resolveInternalLinksForTopic(topicId);
      results.resolved += result.resolved;
      results.skipped += result.skipped;
    } catch (error) {
      results.errors++;
      logger.error(`[InternalLinks] Failed to process topic ${topicId}: ${error.message}`);
    }
  }
  
  return results;
}

/**
 * Resolve all internal links for a document
 * Called after ingestion completes
 */
async function resolveDocumentInternalLinks(documentId) {
  const startTime = Date.now();
  
  try {
    const topics = await Topic.find({ document_id: documentId }).select('_id');
    const topicIds = topics.map(t => t._id);
    
    logger.info(`[InternalLinks] Starting resolution for document ${documentId} (${topicIds.length} topics)`);
    
    const results = await batchResolveInternalLinks(topicIds);
    
    logger.info(`[InternalLinks] Completed document ${documentId} in ${Date.now() - startTime}ms`, {
      total: results.total,
      resolved: results.resolved,
      skipped: results.skipped,
      errors: results.errors
    });
    
    return results;
    
  } catch (error) {
    logger.error(`[InternalLinks] Error resolving document links: ${error.message}`);
    throw error;
  }
}

/**
 * API: Get resolved internal links for a topic
 * Returns only resolved links with full topic data
 */
async function getResolvedInternalLinks(topicId) {
  const topicContent = await TopicContent.findOne({ topic_id: topicId })
    .populate({
      path: 'entity_extraction.cross_concept_links.target_entity_id',
      select: 'title slug slug_global'
    });
  
  if (!topicContent || !topicContent.entity_extraction?.cross_concept_links) {
    return [];
  }
  
  return topicContent.entity_extraction.cross_concept_links
    .filter(link => link.resolved && link.target_entity_id)
    .map(link => ({
      target_entity: link.target_entity,
      target_entity_id: link.target_entity_id._id,
      target_title: link.target_entity_id.title,
      target_slug: link.target_entity_id.slug_global,
      target_url: `/topics/${link.target_entity_id.slug_global}`,
      relationship_type: link.relationship_type,
      context: link.context
    }));
}

module.exports = {
  resolveInternalLinksForTopic,
  batchResolveInternalLinks,
  resolveDocumentInternalLinks,
  getResolvedInternalLinks,
  normalizeSlug,
  extractSlugVariations
};
