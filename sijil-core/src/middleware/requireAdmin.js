import * as logger from '../utils/logger.js';

/**
 * Require Admin Middleware
 * Temporary bootstrap admin mode using environment variable
 * Future auth integration should replace this
 */

/**
 * Check if request has admin access
 * Uses ADMIN_SECRET env var for temporary bootstrap mode
 */
export function requireAdmin(req, res, next) {
    const adminSecret = process.env.ADMIN_SECRET;
    const providedSecret = req.headers['x-admin-secret'];
    
    // If ADMIN_SECRET is not set, allow all requests (development mode)
    // This enables easy testing before auth is configured
    if (!adminSecret) {
        logger.warn({ path: req.path }, 'Admin route accessed without ADMIN_SECRET configured');
        req.admin_id = 'bootstrap_admin';
        return next();
    }
    
    // Validate secret
    if (!providedSecret || providedSecret !== adminSecret) {
        logger.warn(
            { path: req.path, ip: req.ip },
            'Unauthorized admin access attempt'
        );
        return res.status(401).json({
            success: false,
            error: 'Admin authentication required'
        });
    }
    
    // Set admin context for audit logging
    req.admin_id = 'authenticated_admin';
    next();
}

/**
 * Optional admin middleware
 * Sets admin_id if secret provided, but doesn't block requests
 * Useful for routes that work for both admin and regular users
 */
export function optionalAdmin(req, res, next) {
    const adminSecret = process.env.ADMIN_SECRET;
    const providedSecret = req.headers['x-admin-secret'];
    
    if (adminSecret && providedSecret === adminSecret) {
        req.admin_id = 'authenticated_admin';
    } else {
        req.admin_id = 'anonymous';
    }
    
    next();
}
