import UnresolvedLink from '../models/unresolvedLink.model.js';
import SlugRegistry from '../models/slugRegistry.model.js';
import TopicContent from '../models/topicContent.model.js';
import mongoose from 'mongoose';
import * as logger from '../utils/logger.js';

/**
 * Normalizes a string for comparison (lowercase, trim, remove extra spaces)
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Attempts to resolve a slug_ref against SlugRegistry
 * Tries exact slug match first, then slug_global, then normalized title match
 * @param {string} slugRef - The slug reference to resolve
 * @returns {Promise<Object|null>} Matched SlugRegistry entry or null
 */
async function resolveSlugRef(slugRef) {
  if (!slugRef) return null;

  // Strategy 1: Exact match on slug field
  let registryEntry = await SlugRegistry.findOne({ slug: slugRef }).lean();
  if (registryEntry) {
    return registryEntry;
  }

  // Strategy 2: Exact match on slug_global field
  registryEntry = await SlugRegistry.findOne({ slug_global: slugRef }).lean();
  if (registryEntry) {
    return registryEntry;
  }

  // Strategy 3: Normalized title match against title_normalized
  const normalizedRef = normalizeString(slugRef);
  if (normalizedRef) {
    registryEntry = await SlugRegistry.findOne({ 
      title_normalized: normalizedRef 
    }).lean();
    if (registryEntry) {
      return registryEntry;
    }
  }

  return null;
}

/**
 * Resolves cross_concept_links for a topic at ingestion time
 * For each link: tries to resolve immediately, creates UnresolvedLink record if not found
 * Idempotent: uses upsert to avoid duplicate UnresolvedLink entries
 * @param {string} topicId - The topic _id
 * @param {Array} crossConceptLinks - Array of cross_concept_links to process
 * @returns {Promise<{ resolved: number, unresolved: number, errors: number }>}
 */
export async function resolveCrossConceptLinks(topicId, crossConceptLinks) {
  const result = {
    resolved: 0,
    unresolved: 0,
    errors: 0
  };

  if (!topicId || !crossConceptLinks || crossConceptLinks.length === 0) {
    return result;
  }

  try {
    for (const link of crossConceptLinks) {
      try {
        const slugRef = link.slug_ref;
        if (!slugRef) {
          // No slug_ref to resolve, skip
          continue;
        }

        // Try to resolve the slug_ref
        const registryEntry = await resolveSlugRef(slugRef);

        if (registryEntry) {
          // Found a match - update the cross_concept_links entry in TopicContent
          const resolvedUrl = registryEntry.url_path;
          const targetEntityId = registryEntry.topic_id || registryEntry._id;

          // Update TopicContent to mark this link as resolved
          const updateResult = await TopicContent.updateOne(
            {
              topic_id: topicId,
              'entity_extraction.cross_concept_links.slug_ref': slugRef
            },
            {
              $set: {
                'entity_extraction.cross_concept_links.$.resolved': true,
                'entity_extraction.cross_concept_links.$.resolved_url': resolvedUrl,
                'entity_extraction.cross_concept_links.$.target_entity_id': targetEntityId
              }
            }
          );

          if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
            result.resolved++;
            logger.info(
              { topicId, slugRef, resolvedUrl },
              'Immediately resolved cross-concept link at ingestion'
            );
          } else {
            // Link entry not found in TopicContent - still count as resolved conceptually
            result.resolved++;
            logger.warn(
              { topicId, slugRef },
              'Slug resolved but TopicContent linkage not updated (entry not found)'
            );
          }
        } else {
          // No match found - create or update UnresolvedLink record
          // Use upsert with compound key to ensure idempotency
          await UnresolvedLink.findOneAndUpdate(
            {
              slug_ref: slugRef,
              source_topic_id: topicId
            },
            {
              $set: {
                reviewed: false,
                reviewed_at: null,
                notes: `Created at ingestion: ${new Date().toISOString()}`
              },
              $setOnInsert: {
                created_at: new Date()
              }
            },
            {
              upsert: true,
              new: true
            }
          );

          result.unresolved++;
          logger.info(
            { topicId, slugRef },
            'Created UnresolvedLink record for later resolution'
          );
        }
      } catch (linkError) {
        result.errors++;
        logger.error(
          { err: linkError, topicId, slug_ref: link?.slug_ref },
          'Failed to process individual cross-concept link'
        );
      }
    }

    return result;
  } catch (error) {
    logger.error(
      { err: error, topicId },
      'resolveCrossConceptLinks failed - best effort completed with errors'
    );
    return result;
  }
}

/**
 * Main entry point: called after topic content is persisted during ingestion
 * Fetches the topic's cross_concept_links and resolves them
 * Error handling ensures this never blocks the overall ingestion job
 * @param {string} topicId - The topic _id
 * @returns {Promise<{ resolved: number, unresolved: number, errors: number }|null>}
 */
export async function processTopicLinksAtIngestion(topicId) {
  if (!topicId) {
    logger.warn({ topicId }, 'processTopicLinksAtIngestion called without topicId');
    return null;
  }

  try {
    // Fetch the TopicContent document to get cross_concept_links
    const topicContent = await TopicContent.findOne({ topic_id: topicId }).lean();
    
    if (!topicContent || !topicContent.entity_extraction?.cross_concept_links) {
      logger.debug({ topicId }, 'No cross_concept_links to process');
      return { resolved: 0, unresolved: 0, errors: 0 };
    }

    const crossConceptLinks = topicContent.entity_extraction.cross_concept_links;
    
    if (!Array.isArray(crossConceptLinks) || crossConceptLinks.length === 0) {
      logger.debug({ topicId }, 'Empty cross_concept_links array');
      return { resolved: 0, unresolved: 0, errors: 0 };
    }

    logger.info(
      { topicId, linkCount: crossConceptLinks.length },
      'Starting immediate link resolution at ingestion'
    );

    const result = await resolveCrossConceptLinks(topicId, crossConceptLinks);

    logger.info(
      { topicId, ...result },
      'Immediate link resolution completed'
    );

    return result;
  } catch (error) {
    logger.error(
      { err: error, topicId },
      'processTopicLinksAtIngestion failed - continuing ingestion anyway'
    );
    // Return null to indicate failure, but don't throw - this is best-effort
    return null;
  }
}
