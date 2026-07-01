import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:4000/api';

async function runPhase7TestSuite() {
    console.log("=====================================================================");
    console.log("          SIJIL PHASE 7 ROUTING SYSTEM MANUAL VERIFIER               ");
    console.log("=====================================================================");
    console.log("⚠️  REQUIREMENT: Run server: 'npm run dev' & worker: 'npm run worker'");
    console.log("=====================================================================\n");

    const entropy = Math.random().toString(36).substring(4);

    const mockPayload = {
        schema_version: "1.0.0",
        document_id: `doc_api_test_${entropy}`,
        title: `Advanced Web Architectures Layer ${entropy}`,
        source_file_sha256: `sha_${entropy}`,
        container: {
            id: `ch_api_${entropy}`,
            title: "Routing Protocols",
            slug: `routing-protocols-${entropy}`,
            topics: [
                {
                    topic_id: `top_api_${entropy}`,
                    title: "REST Architecture Patterns",
                    topic_slug: `rest-architecture-patterns-${entropy}`,
                    content_blocks: [{ type: "text", markdown: "Express layer abstractions parsing payloads cleanly." }],
                    assessments: { mcqs: [], flashcards: [], short_questions: [] }
                }
            ]
        }
    };

    let hasFailed = false;

    try {
        // 1. Ingestion Endpoint
        console.log('[TEST] POST /api/ingest/json -> Submitting layout payload...');
        const ingestRes = await fetch(`${BASE_URL}/ingest/json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockPayload)
        });

        const ingestData = await ingestRes.json();
        console.log(` -> Status received: ${ingestRes.status}`);
        if (!ingestData.success) throw new Error(`Ingestion failed: ${JSON.stringify(ingestData)}`);
        const trackingId = ingestData.data.tracking_id;
        console.log(` ✅ Ingestion OK. Assigned tracking ID: ${trackingId}`);

        // Wait a second for worker processing...
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Ingestion Status Tracking Entry
        console.log(`[TEST] GET /api/ingest/${trackingId} -> Checking worker tracking summary...`);
        const statusRes = await fetch(`${BASE_URL}/ingest/${trackingId}`);
        const statusData = await statusRes.json();
        if (!statusData.success) throw new Error('Ingest status failed');
        console.log(` ✅ Status read OK. State: "${statusData.data?.status}"`);

        // 3. Document Catalog Listing Range
        console.log('[TEST] GET /api/documents -> Checking document pagination catalogs...');
        const docsRes = await fetch(`${BASE_URL}/documents`);
        const docsData = await docsRes.json();
        if (!docsData.success) throw new Error('Documents listing failed');
        console.log(` ✅ Catalog listing returns: ${docsData.items?.length || 0} document records.`);

        // 4. Target Document Details Summary Lookup
        const targetDocId = mockPayload.document_id;
        console.log(`[TEST] GET /api/documents/${targetDocId} -> Fetching detailed core metadata profile...`);
        const detailDocRes = await fetch(`${BASE_URL}/documents/${targetDocId}`);
        const detailDocData = await detailDocRes.json();
        
        // HARD ASSERTION: Check response structure and title
        if (!detailDocData.success) {
            console.error(' ❌ FAIL: Document detail response success === false');
            hasFailed = true;
        } else if (!detailDocData.data) {
            console.error(' ❌ FAIL: Document detail data is missing or undefined');
            hasFailed = true;
        } else if (!detailDocData.data.title || detailDocData.data.title === 'undefined') {
            console.error(` ❌ FAIL: Document title is missing or equals "undefined". Got: "${detailDocData.data.title}"`);
            hasFailed = true;
        } else {
            console.log(` ✅ Document lookup successful. Extracted title: "${detailDocData.data.title}"`);
        }

        // 5. Document Child Sub-Topic Hierarchy Resolution
        console.log(`[TEST] GET /api/documents/${targetDocId}/topics -> Resolving child definitions...`);
        const docTopicsRes = await fetch(`${BASE_URL}/documents/${targetDocId}/topics`);
        const docTopicsData = await docTopicsRes.json();
        if (!docTopicsData.success) throw new Error('Document topics failed');
        console.log(` ✅ Child collection parsing returns: ${docTopicsData.data?.length || 0} nodes.`);

        // 6. Merged Topic Content Aggregates Mapping Lookup
        const targetTopicId = mockPayload.container.topics[0].topic_id;
        console.log(`[TEST] GET /api/topics/${targetTopicId} -> Requesting compound graph arrays...`);
        const topicRes = await fetch(`${BASE_URL}/topics/${targetTopicId}`);
        const topicData = await topicRes.json();
        
        // HARD ASSERTION: Check topic structure
        if (!topicData.success) {
            console.error(' ❌ FAIL: Topic detail response success === false');
            hasFailed = true;
        } else if (!topicData.data?.meta?.title || topicData.data.meta.title === 'undefined') {
            console.error(` ❌ FAIL: Topic meta title is missing or equals "undefined". Got: "${topicData.data?.meta?.title}"`);
            hasFailed = true;
        } else if (!topicData.data?.content_blocks) {
            console.error(' ❌ FAIL: Topic content blocks missing');
            hasFailed = true;
        } else {
            console.log(` ✅ Topic record parsed correctly. Blocks found: ${topicData.data.content_blocks.length}`);
        }

        // 7. Recursive Deep Nested String Global Search Layout Routing Resolution
        const globalPath = `${mockPayload.document_id}/${mockPayload.container.slug}/${mockPayload.container.topics[0].topic_slug}`;
        console.log(`[TEST] GET /api/topics/slug/${globalPath} -> Querying global structural definitions...`);
        const slugRes = await fetch(`${BASE_URL}/topics/slug/${globalPath}`);
        const slugData = await slugRes.json();
        
        // HARD ASSERTION: Check slug lookup structure
        if (!slugData.success) {
            console.error(' ❌ FAIL: Slug lookup response success === false');
            hasFailed = true;
        } else if (!slugData.data?.meta?.title || slugData.data.meta.title === 'undefined') {
            console.error(` ❌ FAIL: Slug topic meta title is missing or equals "undefined". Got: "${slugData.data?.meta?.title}"`);
            hasFailed = true;
        } else {
            console.log(` ✅ Target dynamic slug lookups resolved. Title matching: "${slugData.data.meta.title}"`);
        }

        // 8. Create Background Generation Jobs Task Flow Handshake
        console.log('[TEST] POST /api/exports -> Enqueuing background export processing task...');
        const exportPostRes = await fetch(`${BASE_URL}/exports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic_id: targetTopicId, format: 'pdf_formatted' })
        });
        console.log('Export POST status:', exportPostRes.status);
        const exportPostData = await exportPostRes.json();
        console.log('Export POST response:', JSON.stringify(exportPostData, null, 2));
        
        // HARD ASSERTION: Check export create response
        if (!exportPostData.success) {
            console.error(' ❌ FAIL: Export create response success === false');
            hasFailed = true;
        } else if (!exportPostData.data) {
            console.error(' ❌ FAIL: Export create data is missing or undefined');
            hasFailed = true;
        } else if (!exportPostData.data.export_job_id || exportPostData.data.export_job_id === 'undefined') {
            console.error(` ❌ FAIL: Export job ID is missing or equals "undefined". Got: "${exportPostData.data.export_job_id}"`);
            hasFailed = true;
        } else {
            const exportJobId = exportPostData.data.export_job_id;
            console.log(` ✅ Export job registered successfully inside core. Generated job token: ${exportJobId}`);

            // 9. Job Registry Tracker Updates Context Verification
            console.log(`[TEST] GET /api/exports/${exportJobId} -> Pulling current runtime parameters...`);
            const exportGetRes = await fetch(`${BASE_URL}/exports/${exportJobId}`);
            const exportGetData = await exportGetRes.json();
            
            // HARD ASSERTION: Check export status response
            if (!exportGetData.success) {
                console.error(' ❌ FAIL: Export status response success === false');
                hasFailed = true;
            } else if (!exportGetData.data?.status || exportGetData.data.status === 'undefined') {
                console.error(` ❌ FAIL: Export status is missing or equals "undefined". Got: "${exportGetData.data?.status}"`);
                hasFailed = true;
            } else {
                console.log(` ✅ Registry lookup tracking check passed. Runtime lifecycle state: "${exportGetData.data.status}"`);
            }
        }

        // 10. Operational Telemetry Utilities
        console.log('[TEST] Requesting administrative utility arrays...');
        const [pop, fail, site] = await Promise.all([
            fetch(`${BASE_URL}/utility/popular-topics`).then(r => r.json()),
            fetch(`${BASE_URL}/utility/failed-searches`).then(r => r.json()),
            fetch(`${BASE_URL}/utility/sitemap-seed`).then(r => r.json())
        ]);
        console.log(` ✅ Telemetry outputs compiled cleanly. (Sitemap rows extracted: ${site.data?.length || 0})`);

        if (hasFailed) {
            console.log("\n---------------------------------------------------------------------");
            console.log("❌ ONE OR MORE PHASE 7 API CHECKS FAILED - SEE ERRORS ABOVE");
            console.log("---------------------------------------------------------------------");
            process.exit(1);
        } else {
            console.log("\n---------------------------------------------------------------------");
            console.log("⭐⭐⭐ ALL PHASE 7 API LAYER VERIFICATION CHECKS PASSED ⭐⭐⭐");
            console.log("---------------------------------------------------------------------");
        }

    } catch (err) {
        hasFailed = true;
        console.error("\n❌ Routing layer test sequence execution error caught:");
        console.error(err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        await mongoose.disconnect();
        process.exit(hasFailed ? 1 : 0);
    }
}

runPhase7TestSuite();