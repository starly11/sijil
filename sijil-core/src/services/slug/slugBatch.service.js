import UnresolvedLink from '../../models/unresolvedLink.model.js';
import SlugRegistry from '../../models/slugRegistry.model.js';
import Topic from '../../models/topic.model.js';
import mongoose from 'mongoose';

/**
 * Resolves all pending unresolved links in batches.
 * @returns {Promise<{ processed: number, resolved: number, still_unresolved: number, duration_ms: number }>}
 */
export async function runSlugResolutionBatch() {
  const startTime = Date.now();
  
  // Step 1: Query unresolved links (limit to 500 per run)
  const unresolvedLinks = await UnresolvedLink.find({ reviewed: false }).limit(500).lean();
  
  let processed = 0;
  let resolved = 0;
  let still_unresolved = 0;
  
  // If no unresolved links, return early
  if (unresolvedLinks.length === 0) {
    return {
      processed: 0,
      resolved: 0,
      still_unresolved: 0,
      duration_ms: Date.now() - startTime
    };
  }
  
  for (const link of unresolvedLinks) {
    processed++;
    
    try {
      // Step 2a: Look up slug_global in slug_registry
      const registryEntry = await SlugRegistry.findOne({ slug: link.slug_ref });
      
      if (registryEntry) {
        // Step 2b: Found - update source topic's cross_concept_links
        const resolvedUrl = registryEntry.url_path;
        
        // Update the source topic's entity_extraction.cross_concept_links
        const updateResult = await Topic.updateOne(
          { 
            _id: link.source_topic_id,
            'entity_extraction.cross_concept_links.slug_ref': link.slug_ref
          },
          {
            $set: {
              'entity_extraction.cross_concept_links.$.resolved': true,
              'entity_extraction.cross_concept_links.$.resolved_url': resolvedUrl
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          // Mark the unresolved_link as resolved
          await UnresolvedLink.findByIdAndUpdate(link._id, {
            reviewed: true,
            reviewed_at: new Date(),
            notes: `Resolved to: ${resolvedUrl}`
          });
          resolved++;
        } else {
          // Could not find matching cross_concept_link - still mark as reviewed
          await UnresolvedLink.findByIdAndUpdate(link._id, {
            reviewed: true,
            reviewed_at: new Date(),
            notes: `Slug found but topic linkage not updated: ${resolvedUrl}`
          });
          resolved++;
        }
      } else {
        // Step 2c: Not found - increment attempt count, log as still unresolved
        still_unresolved++;
        // Keep it in the collection for future resolution attempts
      }
    } catch (error) {
      console.error(`Error processing unresolved link ${link._id}:`, error);
      still_unresolved++;
    }
  }
  
  const duration_ms = Date.now() - startTime;
  
  return {
    processed,
    resolved,
    still_unresolved,
    duration_ms
  };
}

/**
 * Sets up a repeating job using BullMQ's repeat feature.
 * Runs runSlugResolutionBatch every 24 hours at 2am.
 * @returns {Promise<void>}
 */
export async function scheduleNightlySlugBatch() {
  const { slugResolverQueue } = await import('../../queues/index.js');
  
  await slugResolverQueue.add(
    'nightly-slug-batch',
    { type: 'batch_resolution', triggered_by: 'scheduler' },
    { 
      repeat: { pattern: '0 2 * * *' },  // 2am daily
      jobId: 'nightly-slug-batch-job'
    }
  );
  
  console.log('Nightly slug batch job scheduled for 2am daily');
}
