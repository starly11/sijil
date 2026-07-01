import SlugRedirect from '../../models/slugRedirect.model.js';
import SlugRegistry from '../../models/slugRegistry.model.js';
import * as logger from '../../utils/logger.js';

/**
 * Registers a redirect when a slug changes.
 * Handles chaining: if old_slug already points somewhere, updates it to point to new_slug.
 */
export async function registerSlugRedirect({ old_slug, new_slug, old_url_path, new_url_path, entity_type, entity_id }) {
  try {
    // If slugs are the same, do nothing
    if (old_slug === new_slug) {
      return null;
    }

    // Check if a redirect from old_slug already exists
    const existing = await SlugRedirect.findOne({ 
      entity_id, 
      old_slug 
    }).sort({ created_at: -1 });

    if (existing) {
      // Update existing redirect to point to new location
      existing.new_slug = new_slug;
      existing.new_url_path = new_url_path;
      existing.updated_at = new Date();
      await existing.save();
      logger.info({ old_slug, new_slug, entity_id }, 'Slug redirect updated');
      return existing;
    }

    // Create new redirect record
    const redirect = await SlugRedirect.create({
      entity_id,
      old_slug,
      new_slug,
      old_url_path,
      new_url_path,
      redirect_type: '301',
      created_at: new Date()
    });

    // Update slugRegistry: mark old slug as inactive or remove it
    // Since slugRegistry doesn't have an 'active' field, we leave it as-is
    // The redirect table takes precedence for resolution
    logger.info({ old_slug, new_slug, entity_id }, 'Slug redirect registered');
    
    return redirect;
  } catch (err) {
    logger.error({ error: err.message, old_slug, new_slug }, 'Failed to register slug redirect');
    // Fire and forget - never break ingestion
    return null;
  }
}

/**
 * Resolves a slug through redirect chains (max 3 hops).
 * Returns the final destination if redirected.
 */
export async function resolveSlugRedirect(slug) {
  try {
    let currentSlug = slug;
    let hops = 0;
    const maxHops = 3;

    while (hops < maxHops) {
      const redirect = await SlugRedirect.findOne({ 
        old_slug: currentSlug 
      }).sort({ created_at: -1 });

      if (!redirect) {
        // No more redirects in chain
        if (hops === 0) {
          return { redirected: false };
        }
        // We followed at least one redirect
        return { 
          redirected: true, 
          new_slug: currentSlug, 
          new_url_path: redirect?.new_url_path || '',
          status_code: 301,
          hops 
        };
      }

      currentSlug = redirect.new_slug;
      hops++;
    }

    // Max hops reached
    return { 
      redirected: true, 
      new_slug: currentSlug, 
      status_code: 301,
      hops,
      warning: 'Max redirect hops reached'
    };
  } catch (err) {
    logger.error({ error: err.message, slug }, 'Failed to resolve slug redirect');
    return { redirected: false, error: err.message };
  }
}

/**
 * Returns statistics about slug redirects.
 */
export async function getSlugRedirectStats() {
  try {
    const totalRedirects = await SlugRedirect.countDocuments();
    
    const entityBreakdown = await SlugRedirect.aggregate([
      {
        $group: {
          _id: '$entity_type',
          count: { $sum: 1 }
        }
      }
    ]);

    const breakdown = {};
    entityBreakdown.forEach(item => {
      breakdown[item._id] = item.count;
    });

    return {
      total_redirects: totalRedirects,
      entity_breakdown: breakdown,
      generated_at: new Date().toISOString()
    };
  } catch (err) {
    logger.error({ error: err.message }, 'Failed to get slug redirect stats');
    return {
      total_redirects: 0,
      entity_breakdown: {},
      generated_at: new Date().toISOString(),
      error: err.message
    };
  }
}
