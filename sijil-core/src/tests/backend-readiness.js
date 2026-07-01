const BASE = 'http://localhost:' + (process.env.PORT || 4000) + '/api';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

let realTopicId = null;
let realDocId = null;

async function get(path, headers = {}) {
  const res = await fetch(BASE + path, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: Object.fromEntries(res.headers.entries()) };
}

async function post(path, body, headers = {}) {
  const res = await fetch(BASE + path, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json', ...headers }, 
    body: JSON.stringify(body) 
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  // First, get documents that exist via API
  const docsRes = await fetch(BASE + '/documents?limit=100');
  const docsData = await docsRes.json().catch(() => ({ items: [] }));
  // Map: document_metadata.document_id -> full doc object
  const validDocMap = new Map();
  for (const d of (docsData.items || [])) {
    if (d.document_metadata?.document_id) {
      validDocMap.set(d.document_metadata.document_id, d);
    }
  }
  
  console.log(`Found ${validDocMap.size} valid documents via API`);

  // Now find a topic using the same API surface the tests exercise.
  // This avoids depending on a separate direct Mongo connection that may point
  // at a different database than the running backend.
  for (const doc of validDocMap.values()) {
    try {
      const topicsRes = await get(`/documents/${doc._id}/topics`);
      const topics = Array.isArray(topicsRes.data?.data) ? topicsRes.data.data : [];
      if (topics.length > 0 && topics[0]?._id) {
        realDocId = doc._id;
        realTopicId = topics[0]._id.toString();
        console.log(`Found valid topic: ${realTopicId}`);
        console.log(`Found valid document (_id): ${realDocId}, metadata.document_id: ${doc.document_metadata.document_id}`);
        break;
      }
    } catch {
      // Skip documents that error and continue searching.
    }
  }

  if (!realTopicId || !realDocId) {
    console.log('WARNING: No valid topic-document pairs found via API. Some tests will be skipped.');
  }

  const adminHeaders = { 'x-admin-secret': ADMIN_SECRET, 'Content-Type': 'application/json' };
  
  const results = {
    task1: { pass: 0, total: 2, details: [] },
    task2: { pass: 0, total: 4, details: [] },
    task3: { pass: 0, total: 3, details: [] },
    task4: { pass: 0, total: 3, details: [] },
    task5: { pass: 0, total: 3, details: [] },
    existing: { pass: 0, total: 7, details: [] }
  };

  console.log('\n=== TASK 1: Admin Route Mounting ===');
  
  // Test 1: POST /api/admin/import/preview
  try {
    const r = await post('/admin/import/preview', { repo_url: 'https://github.com/test/test ' }, adminHeaders);
    const pass = r.status !== 404;
    results.task1.pass += pass ? 1 : 0;
    results.task1.details.push(`POST /api/admin/import/preview: status=${r.status} ${pass ? 'PASS' : 'FAIL'}`);
    console.log(`1. POST /api/admin/import/preview: ${r.status} ${pass ? '✓' : '✗'}`);
  } catch (e) {
    results.task1.details.push(`POST /api/admin/import/preview: ERROR - ${e.message}`);
    console.log(`1. POST /api/admin/import/preview: ERROR - ${e.message}`);
  }

  // Test 2: GET /api/admin/import/nonexistent_batch_id
  try {
    const r = await get('/admin/import/nonexistent_batch_id', adminHeaders);
    const pass = r.status === 404;
    results.task1.pass += pass ? 1 : 0;
    results.task1.details.push(`GET /api/admin/import/nonexistent: status=${r.status} ${pass ? 'PASS' : 'FAIL'}`);
    console.log(`2. GET /api/admin/import/nonexistent: ${r.status} ${pass ? '✓' : '✗'}`);
  } catch (e) {
    results.task1.details.push(`GET /api/admin/import/nonexistent: ERROR - ${e.message}`);
    console.log(`2. GET /api/admin/import/nonexistent: ERROR - ${e.message}`);
  }

  console.log('\n=== TASK 2: Document Filtering ===');

  // Test 3: GET /api/documents?type=textbook
  try {
    const r = await get('/documents?type=textbook');
    const pass = r.data.success === true && Array.isArray(r.data.items);
    results.task2.pass += pass ? 1 : 0;
    results.task2.details.push(`GET /api/documents?type=textbook: ${pass ? 'PASS' : 'FAIL'} (items: ${r.data.items?.length || 0})`);
    console.log(`3. GET /api/documents?type=textbook: ${pass ? '✓' : '✗'} (items: ${r.data.items?.length || 0})`);
  } catch (e) {
    results.task2.details.push(`GET /api/documents?type=textbook: ERROR - ${e.message}`);
    console.log(`3. GET /api/documents?type=textbook: ERROR - ${e.message}`);
  }

  // Test 4: GET /api/documents?sort=title
  try {
    const r = await get('/documents?sort=title');
    const pass = r.data.success === true;
    results.task2.pass += pass ? 1 : 0;
    results.task2.details.push(`GET /api/documents?sort=title: ${pass ? 'PASS' : 'FAIL'}`);
    console.log(`4. GET /api/documents?sort=title: ${pass ? '✓' : '✗'}`);
  } catch (e) {
    results.task2.details.push(`GET /api/documents?sort=title: ERROR - ${e.message}`);
    console.log(`4. GET /api/documents?sort=title: ERROR - ${e.message}`);
  }

  // Test 5: GET /api/documents?search=physics
  try {
    const r = await get('/documents?search=physics');
    const pass = r.data.success === true && Array.isArray(r.data.items);
    results.task2.pass += pass ? 1 : 0;
    results.task2.details.push(`GET /api/documents?search=physics: ${pass ? 'PASS' : 'FAIL'} (items: ${r.data.items?.length || 0})`);
    console.log(`5. GET /api/documents?search=physics: ${pass ? '✓' : '✗'} (items: ${r.data.items?.length || 0})`);
  } catch (e) {
    results.task2.details.push(`GET /api/documents?search=physics: ERROR - ${e.message}`);
    console.log(`5. GET /api/documents?search=physics: ERROR - ${e.message}`);
  }

  // Test 6: Combined filters
  try {
    const r = await get('/documents?subject=Physics&grade=9&type=textbook&sort=newest&page=1');
    const pass = r.data.success === true;
    results.task2.pass += pass ? 1 : 0;
    results.task2.details.push(`GET /api/documents?subject=Physics&grade=9...: ${pass ? 'PASS' : 'FAIL'} (items: ${r.data.items?.length || 0})`);
    console.log(`6. GET /api/documents?subject=Physics&grade=9...: ${pass ? '✓' : '✗'} (items: ${r.data.items?.length || 0})`);
  } catch (e) {
    results.task2.details.push(`GET /api/documents?combined: ERROR - ${e.message}`);
    console.log(`6. GET /api/documents?subject=Physics&grade=9...: ERROR - ${e.message}`);
  }

  console.log('\n=== TASK 3: Topic Sub-routes ===');

  if (realTopicId) {
    // Test 7: GET /api/topics/:id/content
    try {
      const r = await get(`/topics/${realTopicId}/content`);
      const pass = r.status === 200 || r.status === 404;
      results.task3.pass += pass ? 1 : 0;
      const hasData = r.data.data !== null && r.data.data !== undefined;
      results.task3.details.push(`GET /api/topics/:id/content: status=${r.status}, hasData=${hasData} ${pass ? 'PASS' : 'FAIL'}`);
      console.log(`7. GET /api/topics/:id/content: ${r.status} (hasData: ${hasData}) ${pass ? '✓' : '✗'}`);
    } catch (e) {
      results.task3.details.push(`GET /api/topics/:id/content: ERROR - ${e.message}`);
      console.log(`7. GET /api/topics/:id/content: ERROR - ${e.message}`);
    }

    // Test 8: GET /api/topics/:id/assets
    try {
      const r = await get(`/topics/${realTopicId}/assets`);
      const pass = r.status === 200;
      results.task3.pass += pass ? 1 : 0;
      const hasAssets = r.data.data !== null && r.data.data !== undefined;
      results.task3.details.push(`GET /api/topics/:id/assets: status=${r.status}, hasAssets=${hasAssets} ${pass ? 'PASS' : 'FAIL'}`);
      console.log(`8. GET /api/topics/:id/assets: ${r.status} (hasAssets: ${hasAssets}) ${pass ? '✓' : '✗'}`);
    } catch (e) {
      results.task3.details.push(`GET /api/topics/:id/assets: ERROR - ${e.message}`);
      console.log(`8. GET /api/topics/:id/assets: ERROR - ${e.message}`);
    }

    // Test 9: GET /api/topics/:id/assessments
    try {
      const r = await get(`/topics/${realTopicId}/assessments`);
      const pass = r.status === 200;
      results.task3.pass += pass ? 1 : 0;
      const mcqs = r.data.data?.mcqs?.length || 0;
      const shortQ = r.data.data?.short_questions?.length || 0;
      results.task3.details.push(`GET /api/topics/:id/assessments: status=${r.status}, mcqs=${mcqs}, short_q=${shortQ} ${pass ? 'PASS' : 'FAIL'}`);
      console.log(`9. GET /api/topics/:id/assessments: ${r.status} (mcqs: ${mcqs}, short_q: ${shortQ}) ${pass ? '✓' : '✗'}`);
    } catch (e) {
      results.task3.details.push(`GET /api/topics/:id/assessments: ERROR - ${e.message}`);
      console.log(`9. GET /api/topics/:id/assessments: ERROR - ${e.message}`);
    }
  } else {
    console.log('SKIPPED: No topic ID available');
    results.task3.total = 0;
  }

  console.log('\n=== TASK 4: Subject & Grade Discovery ===');

  // Test 10: GET /api/subjects
  try {
    const r = await get('/subjects');
    const pass = r.data.success === true && Array.isArray(r.data.data);
    results.task4.pass += pass ? 1 : 0;
    results.task4.details.push(`GET /api/subjects: ${pass ? 'PASS' : 'FAIL'} (count: ${r.data.data?.length || 0})`);
    console.log(`10. GET /api/subjects: ${pass ? '✓' : '✗'} (count: ${r.data.data?.length || 0})`);
  } catch (e) {
    results.task4.details.push(`GET /api/subjects: ERROR - ${e.message}`);
    console.log(`10. GET /api/subjects: ERROR - ${e.message}`);
  }

  // Test 11: GET /api/grades
  try {
    const r = await get('/grades');
    const pass = r.data.success === true && Array.isArray(r.data.data);
    results.task4.pass += pass ? 1 : 0;
    results.task4.details.push(`GET /api/grades: ${pass ? 'PASS' : 'FAIL'} (count: ${r.data.data?.length || 0})`);
    console.log(`11. GET /api/grades: ${pass ? '✓' : '✗'} (count: ${r.data.data?.length || 0})`);
  } catch (e) {
    results.task4.details.push(`GET /api/grades: ERROR - ${e.message}`);
    console.log(`11. GET /api/grades: ERROR - ${e.message}`);
  }

  // Test 12: GET /api/subjects/Physics/grades
  try {
    const r = await get('/subjects/Physics/grades');
    const pass = r.data.success === true && Array.isArray(r.data.data);
    results.task4.pass += pass ? 1 : 0;
    results.task4.details.push(`GET /api/subjects/Physics/grades: ${pass ? 'PASS' : 'FAIL'} (count: ${r.data.data?.length || 0})`);
    console.log(`12. GET /api/subjects/Physics/grades: ${pass ? '✓' : '✗'} (count: ${r.data.data?.length || 0})`);
  } catch (e) {
    results.task4.details.push(`GET /api/subjects/Physics/grades: ERROR - ${e.message}`);
    console.log(`12. GET /api/subjects/Physics/grades: ERROR - ${e.message}`);
  }

  console.log('\n=== TASK 5: Topic Page Endpoint ===');

  if (realTopicId) {
    // Test 13: GET /api/topics/:id/page
    try {
      const r = await get(`/topics/${realTopicId}/page`);
      
      // Check 1: success === true
      const check1 = r.data.success === true;
      results.task5.pass += check1 ? 1 : 0;
      
      // Check 2: data has keys: topic, navigation, counts
      const check2 = r.data.data?.topic && r.data.data?.navigation && r.data.data?.counts;
      results.task5.pass += check2 ? 1 : 0;
      
      // Check 3: navigation has keys: prev, next, chapter_topics
      const check3 = r.data.data?.navigation?.prev !== undefined && 
                     r.data.data?.navigation?.next !== undefined && 
                     Array.isArray(r.data.data?.navigation?.chapter_topics);
      results.task5.pass += check3 ? 1 : 0;
      
      const chapterCount = r.data.data?.navigation?.chapter_topics?.length || 0;
      results.task5.details.push(`GET /api/topics/:id/page: checks=${check1?1:0}+${check2?1:0}+${check3?1:0} (chapter_topics: ${chapterCount})`);
      console.log(`13. GET /api/topics/:id/page: ${check1 && check2 && check3 ? '✓' : '✗'} (chapter_topics: ${chapterCount}, checks: ${check1?1:0}/${check2?1:0}/${check3?1:0})`);
    } catch (e) {
      results.task5.details.push(`GET /api/topics/:id/page: ERROR - ${e.message}`);
      console.log(`13. GET /api/topics/:id/page: ERROR - ${e.message}`);
    }
  } else {
    console.log('SKIPPED: No topic ID available');
    results.task5.total = 0;
  }

  console.log('\n=== EXISTING ROUTES STILL WORK ===');

  // Test 14: GET /api/documents
  try {
    const r = await get('/documents');
    const pass = r.data.success === true;
    results.existing.pass += pass ? 1 : 0;
    console.log(`14. GET /api/documents: ${pass ? '✓' : '✗'}`);
  } catch (e) {
    console.log(`14. GET /api/documents: ERROR - ${e.message}`);
  }

  // Test 15: GET /api/documents/:id
  if (realDocId) {
    try {
      const r = await get(`/documents/${realDocId}`);
      const pass = r.data.success === true && r.data.data?.title;
      results.existing.pass += pass ? 1 : 0;
      console.log(`15. GET /api/documents/:id: ${pass ? '✓' : '✗'}`);
    } catch (e) {
      console.log(`15. GET /api/documents/:id: ERROR - ${e.message}`);
    }
  }

  // Test 16: GET /api/documents/:id/topics
  if (realDocId) {
    try {
      const r = await get(`/documents/${realDocId}/topics`);
      const pass = r.data.success === true && Array.isArray(r.data.data);
      results.existing.pass += pass ? 1 : 0;
      console.log(`16. GET /api/documents/:id/topics: ${pass ? '✓' : '✗'}`);
    } catch (e) {
      console.log(`16. GET /api/documents/:id/topics: ERROR - ${e.message}`);
    }
  }

  // Test 17: GET /api/topics/:id
  if (realTopicId) {
    try {
      const r = await get(`/topics/${realTopicId}`);
      const pass = r.data.success === true;
      results.existing.pass += pass ? 1 : 0;
      console.log(`17. GET /api/topics/:id: ${pass ? '✓' : '✗'}`);
    } catch (e) {
      console.log(`17. GET /api/topics/:id: ERROR - ${e.message}`);
    }
  }

  // Test 18: GET /api/utility/platform-stats
  try {
    const r = await get('/utility/platform-stats');
    const pass = r.data.success === true;
    results.existing.pass += pass ? 1 : 0;
    console.log(`18. GET /api/utility/platform-stats: ${pass ? '✓' : '✗'}`);
  } catch (e) {
    console.log(`18. GET /api/utility/platform-stats: ERROR - ${e.message}`);
  }

  // Test 19: GET /api/seo/topic/:id/jsonld
  if (realTopicId) {
    try {
      const r = await get(`/seo/topic/${realTopicId}/jsonld`);
      const pass = r.data.success === true;
      results.existing.pass += pass ? 1 : 0;
      console.log(`19. GET /api/seo/topic/:id/jsonld: ${pass ? '✓' : '✗'}`);
    } catch (e) {
      console.log(`19. GET /api/seo/topic/:id/jsonld: ERROR - ${e.message}`);
    }
  }

  // Test 20: GET /api/seo/sitemap-index.xml
  try {
    const r = await get('/seo/sitemap-index.xml');
    const pass = r.status === 200 && r.headers['content-type']?.includes('xml');
    results.existing.pass += pass ? 1 : 0;
    console.log(`20. GET /api/seo/sitemap-index.xml: ${pass ? '✓' : '✗'} (content-type: ${r.headers['content-type']})`);
  } catch (e) {
    console.log(`20. GET /api/seo/sitemap-index.xml: ERROR - ${e.message}`);
  }

  // Print summary
  const totalPass = results.task1.pass + results.task2.pass + results.task3.pass + results.task4.pass + results.task5.pass + results.existing.pass;
  const totalTotal = results.task1.total + results.task2.total + results.task3.total + results.task4.total + results.task5.total + results.existing.total;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           BACKEND READINESS — RESULTS                       ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Task 1: Admin Routes               [ ${results.task1.pass}/${results.task1.total} ]                 ║`);
  console.log(`║  Task 2: Document Filtering         [ ${results.task2.pass}/${results.task2.total} ]                 ║`);
  console.log(`║  Task 3: Topic Sub-routes           [ ${results.task3.pass}/${results.task3.total} ]                 ║`);
  console.log(`║  Task 4: Subject & Grade APIs       [ ${results.task4.pass}/${results.task4.total} ]                 ║`);
  console.log(`║  Task 5: Topic Page Endpoint        [ ${results.task5.pass}/${results.task5.total} ]                 ║`);
  console.log(`║  Existing Routes Still Work         [ ${results.existing.pass}/${results.existing.total} ]                 ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  TOTAL                              [ ${totalPass}/${totalTotal} ]                ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (totalPass === totalTotal && totalTotal === 22) {
    console.log('\n=== BACKEND READY FOR FRONTEND ===');
  }

  process.exit(totalPass === totalTotal ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
