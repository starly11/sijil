import { resolveSlugRedirect } from '../services/slug/slugRedirect.service.js';
import * as logger from '../utils/logger.js';

/**
 * Express middleware to handle slug redirects.
 * Intercepts GET requests and checks if the path has a registered redirect.
 * If found, performs a 301 redirect to the new path.
 * Never blocks requests - always calls next() on error or no redirect.
 */
export async function slugRedirectMiddleware(req, res, next) {
    // Only intercept GET requests
    if (req.method !== 'GET') {
        return next();
    }

    try {
        const requestedPath = req.path;
        
        // Call resolveSlugRedirect to check for redirects
        const redirectResult = await resolveSlugRedirect(requestedPath);
        
        if (redirectResult?.redirected && redirectResult.new_url_path) {
            logger.info({ 
                old_path: requestedPath, 
                new_path: redirectResult.new_url_path,
                hops: redirectResult.hops 
            }, 'Performing slug redirect');
            
            return res.redirect(301, redirectResult.new_url_path);
        }
        
        // No redirect found or error - pass through
        next();
    } catch (error) {
        // Never crash the server on DB errors - just log and continue
        logger.error({ 
            error: error.message, 
            path: req.path 
        }, 'Slug redirect middleware error - passing through');
        next();
    }
}

export default slugRedirectMiddleware;
