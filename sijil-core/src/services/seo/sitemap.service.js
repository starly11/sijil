import mongoose from 'mongoose';
import SlugRegistry from '../../models/slugRegistry.model.js';
import { info, error } from '../../utils/logger.js';

const BASE_URL = process.env.BASE_URL || 'https://sijil.app';
const SITEMAP_PAGE_SIZE = 1000;
const ENTITY_PRIORITIES = {
  document: '0.9',
  topic: '0.8',
  subject: '0.7',
  default: '0.5'
};
const ENTITY_CHANGEFREQ = {
  document: 'weekly',
  topic: 'weekly',
  subject: 'monthly',
  default: 'monthly'
};

/**
 * Generate XML sitemap index
 */
async function generateSitemapIndex() {
  try {
    const total = await SlugRegistry.countDocuments({});
    const totalPages = Math.ceil(total / SITEMAP_PAGE_SIZE);
    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>${BASE_URL}/api/seo/sitemap-static.xml</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `  </sitemap>\n`;

    // Paginated sitemaps
    for (let page = 1; page <= totalPages; page++) {
      xml += `  <sitemap>\n`;
      xml += `    <loc>${BASE_URL}/api/seo/sitemap-${page}.xml</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `  </sitemap>\n`;
    }

    xml += `</sitemapindex>`;
    
    info(`Generated sitemap index with ${totalPages + 1} sitemaps (${total} URLs)`);
    return xml;
  } catch (error) {
    error('Error generating sitemap index:', error);
    throw error;
  }
}

/**
 * Generate a single paginated sitemap
 */
async function generateSitemapPage(page) {
  try {
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * SITEMAP_PAGE_SIZE;

    const entries = await SlugRegistry.find({})
      .select('slug_global url_path entity_type updated_at')
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(SITEMAP_PAGE_SIZE)
      .lean();

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const entry of entries) {
      const lastmod = entry.updated_at 
        ? new Date(entry.updated_at).toISOString().split('T')[0]
        : today;
      const changefreq = ENTITY_CHANGEFREQ[entry.entity_type] || ENTITY_CHANGEFREQ.default;
      const priority = ENTITY_PRIORITIES[entry.entity_type] || ENTITY_PRIORITIES.default;
      const encodedPath = encodeURI(entry.url_path);

      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${encodedPath}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    info(`Generated sitemap page ${pageNum} with ${entries.length} URLs`);
    return xml;
  } catch (error) {
    error(`Error generating sitemap page ${page}:`, error);
    throw error;
  }
}

/**
 * Generate static sitemap for core pages
 */
async function generateStaticSitemap() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/subjects', priority: '0.8', changefreq: 'weekly' },
      { url: '/search', priority: '0.6', changefreq: 'monthly' },
      { url: '/about', priority: '0.4', changefreq: 'monthly' }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    info('Generated static sitemap');
    return xml;
  } catch (error) {
    error('Error generating static sitemap:', error);
    throw error;
  }
}

/**
 * Get sitemap statistics
 */
async function getSitemapStats() {
  try {
    const total = await SlugRegistry.countDocuments({});
    const totalPages = Math.ceil(total / SITEMAP_PAGE_SIZE);

    const entityBreakdown = await SlugRegistry.aggregate([
      { $group: { _id: '$entity_type', count: { $sum: 1 } } }
    ]);

    const breakdownObj = {};
    for (const item of entityBreakdown) {
      breakdownObj[item._id] = item.count;
    }

    const stats = {
      total_urls: total,
      total_pages: totalPages,
      page_size: SITEMAP_PAGE_SIZE,
      entity_breakdown: breakdownObj
    };

    info(`Sitemap stats: ${total} URLs, ${totalPages} pages`);
    return stats;
  } catch (error) {
    error('Error getting sitemap stats:', error);
    throw error;
  }
}

export {
  generateSitemapIndex,
  generateSitemapPage,
  generateStaticSitemap,
  getSitemapStats
};
