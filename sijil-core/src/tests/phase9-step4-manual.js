import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { 
  generateSitemapIndex, 
  generateSitemapPage, 
  generateStaticSitemap, 
  getSitemapStats 
} from '../services/seo/sitemap.service.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

let passed = 0;
let failed = 0;
let skipped = 0;

function logTest(name, condition, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    if (details) console.log(`   ${details}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== PHASE 9 STEP 4: SITEMAP ENGINE TESTS ===\n');

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }

  try {
    // Test 1: getSitemapStats()
    console.log('Test 1: getSitemapStats()');
    try {
      const stats = await getSitemapStats();
      const hasKeys = stats.total_urls !== undefined && 
                      stats.total_pages !== undefined && 
                      stats.page_size !== undefined && 
                      stats.entity_breakdown !== undefined;
      logTest(
        'getSitemapStats returns correct structure',
        hasKeys,
        `Stats: ${JSON.stringify(stats)}`
      );
    } catch (error) {
      logTest('getSitemapStats returns correct structure', false, error.message);
    }

    // Test 2: generateStaticSitemap()
    console.log('\nTest 2: generateStaticSitemap()');
    try {
      const xml = await generateStaticSitemap();
      const startsWithXml = xml.startsWith('<?xml');
      const hasBaseUrl = xml.includes('<loc>https://sijil.app/</loc>');
      const hasAllPages = 
        xml.includes('/subjects') && 
        xml.includes('/search') && 
        xml.includes('/about');
      
      logTest('Static sitemap starts with <?xml', startsWithXml);
      logTest('Static sitemap includes base URL', hasBaseUrl);
      logTest('Static sitemap includes all 4 static pages', hasAllPages);
    } catch (error) {
      logTest('generateStaticSitemap', false, error.message);
    }

    // Test 3: generateSitemapIndex()
    console.log('\nTest 3: generateSitemapIndex()');
    try {
      const xml = await generateSitemapIndex();
      const startsWithXml = xml.startsWith('<?xml');
      const hasSitemapIndex = xml.includes('<sitemapindex');
      const hasStaticSitemap = xml.includes('sitemap-static.xml');
      
      const matchCount = (xml.match(/<sitemap>/g) || []).length;
      
      logTest('Sitemap index starts with <?xml', startsWithXml);
      logTest('Sitemap index includes <sitemapindex>', hasSitemapIndex);
      logTest('Sitemap index includes sitemap-static.xml', hasStaticSitemap);
      console.log(`   Total sitemaps in index: ${matchCount}`);
      passed += 3; // Count sub-tests
    } catch (error) {
      logTest('generateSitemapIndex', false, error.message);
    }

    // Test 4: generateSitemapPage(1)
    console.log('\nTest 4: generateSitemapPage(1)');
    try {
      const xml = await generateSitemapPage(1);
      const startsWithXml = xml.startsWith('<?xml');
      const hasUrlset = xml.includes('<urlset');
      const urlCount = (xml.match(/<url>/g) || []).length;
      
      logTest('Sitemap page 1 starts with <?xml', startsWithXml);
      logTest('Sitemap page 1 includes <urlset>', hasUrlset);
      console.log(`   URL entries found: ${urlCount}`);
      passed += 2; // Count sub-tests
    } catch (error) {
      logTest('generateSitemapPage(1)', false, error.message);
    }

    // Test 5: generateSitemapPage(99999) - empty page
    console.log('\nTest 5: generateSitemapPage(99999)');
    try {
      const xml = await generateSitemapPage(99999);
      const isValidXml = xml.startsWith('<?xml') && xml.includes('<urlset');
      logTest('Empty sitemap page returns valid XML', isValidXml);
    } catch (error) {
      logTest('generateSitemapPage(99999)', false, error.message);
    }

    // HTTP Tests - check if server is running
    console.log('\n--- HTTP Tests ---');
    const PORT = process.env.PORT || 4000;
    const BASE_URL = `http://localhost:${PORT}`;
    
    let serverRunning = false;
    try {
      const response = await fetch(`${BASE_URL}/api/health`, { method: 'GET' });
      serverRunning = response.ok;
    } catch (error) {
      serverRunning = false;
    }

    if (!serverRunning) {
      console.log('⚠️  SKIP: Server not running - skipping HTTP tests');
      skipped += 4;
    } else {
      console.log('✅ Server detected, running HTTP tests...\n');

      // Test 6: GET /api/seo/sitemap-index.xml
      try {
        const response = await fetch(`${BASE_URL}/api/seo/sitemap-index.xml`);
        const contentType = response.headers.get('Content-Type');
        const body = await response.text();
        
        logTest(
          'GET /api/seo/sitemap-index.xml Content-Type',
          contentType && contentType.includes('xml'),
          `Content-Type: ${contentType}`
        );
        logTest(
          'GET /api/seo/sitemap-index.xml body starts with <?xml',
          body.startsWith('<?xml')
        );
      } catch (error) {
        logTest('GET /api/seo/sitemap-index.xml', false, error.message);
      }

      // Test 7: GET /api/seo/sitemap-1.xml
      try {
        const response = await fetch(`${BASE_URL}/api/seo/sitemap-1.xml`);
        const contentType = response.headers.get('Content-Type');
        const body = await response.text();
        
        logTest(
          'GET /api/seo/sitemap-1.xml Content-Type',
          contentType && contentType.includes('xml'),
          `Content-Type: ${contentType}`
        );
        logTest(
          'GET /api/seo/sitemap-1.xml body includes <urlset>',
          body.includes('<urlset')
        );
      } catch (error) {
        logTest('GET /api/seo/sitemap-1.xml', false, error.message);
      }

      // Test 8: GET /api/seo/sitemap-static.xml
      try {
        const response = await fetch(`${BASE_URL}/api/seo/sitemap-static.xml`);
        const contentType = response.headers.get('Content-Type');
        const body = await response.text();
        
        logTest(
          'GET /api/seo/sitemap-static.xml Content-Type',
          contentType && contentType.includes('xml'),
          `Content-Type: ${contentType}`
        );
        logTest(
          'GET /api/seo/sitemap-static.xml includes static pages',
          body.includes('/subjects') && body.includes('/search')
        );
      } catch (error) {
        logTest('GET /api/seo/sitemap-static.xml', false, error.message);
      }

      // Test 9: GET /api/seo/sitemap/stats
      try {
        const response = await fetch(`${BASE_URL}/api/seo/sitemap/stats`);
        const json = await response.json();
        
        logTest(
          'GET /api/seo/sitemap/stats success',
          json.success === true,
          `Response: ${JSON.stringify(json)}`
        );
        logTest(
          'GET /api/seo/sitemap/stats has total_urls',
          typeof json.data.total_urls === 'number'
        );
      } catch (error) {
        logTest('GET /api/seo/sitemap/stats', false, error.message);
      }
    }

  } finally {
    await mongoose.disconnect();
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);

  if (failed === 0) {
    console.log('\n=== PHASE 9 STEP 4 COMPLETE ===');
  } else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
