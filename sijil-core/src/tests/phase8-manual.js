import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import PopularSearch from '../models/popularSearch.model.js';
import FailedSearch from '../models/failedSearch.model.js';

const BASE_URL = 'http://localhost:4000/api';

async function runPhase8ValidationSuite() {
    console.log("=====================================================================");
    console.log("          SIJIL PHASE 8 SEARCH INFRASTRUCTURE MANUAL VERIFIER        ");
    console.log("=====================================================================");
    console.log("⚠️  REQUIREMENT: Ensure your local server is running: 'npm run dev'");
    console.log("=====================================================================\n");

    await connectDB();

    // Generate unique entropy for this test run
    const entropy = Math.random().toString(36).substring(5);
    const testTopicId = `top_search_test_${entropy}`;
    const testDocId = `doc_search_${entropy}`;
    const searchKeyword = `quantum_telemetry_${entropy}`;
    const formulaExpr = `\\psi_matrix_${entropy}`;
    const phantomToken = `non_existent_token_${entropy}`;

    console.log("[PRE-TEST] Seeding data directly via raw collections to avoid middleware version conflicts...");

    try {
        // 1. Seed Topic (Direct DB insert to bypass hooks/validation overhead)
        await mongoose.connection.collection('topics').insertOne({
            _id: testTopicId,
            document_id: testDocId,
            chapter_id: `ch_search_${entropy}`,
            title: `Introduction to ${searchKeyword} Mechanics`,
            slug: `quantum-${searchKeyword}`,
            slug_global: `physics/quantum/${searchKeyword}`,
            url_path: `/physics/quantum/${searchKeyword}`,
            order_index: 0,
            meta: { subject: 'Physics', grade: 'Advanced' },
            keywords: [searchKeyword, 'quantum', 'telemetry'],
            key_terms_preview: [`Deep text block containing keyword matches for ${searchKeyword} expressions.`],
            subject: 'Physics',
            grade_numeric: 12,
            difficulty: 'advanced',
            topic_type: 'theory',
            schema_type: 'topic' // Ensure required field exists
        });

        // 2. Seed Topic Content
        await mongoose.connection.collection('topic_contents').insertOne({
            _id: `tcon_search_${entropy}`,
            topic_id: testTopicId,
            document_id: testDocId,
            content_blocks: [
                {
                    block_id: `blk_s1_${entropy}`,
                    type: "text",
                    markdown: `Deep text block containing keyword matches for ${searchKeyword} expressions.`
                }
            ]
        });

        // 3. Seed Formula Index (Direct DB insert)
        await mongoose.connection.collection('formula_index').insertOne({
            _id: `form_idx_${entropy}`,
            topic_id: testTopicId,
            block_id: `blk_s1_${entropy}`,
            name: `Psi Matrix ${entropy}`,
            latex: formulaExpr,
            latex_normalized: formulaExpr.replace(/\s+/g, ''), // Simple normalization
            ascii_normalized: `psi_matrix_${entropy}`,
            variable_tags: ["eigenvector", "state-vector"],
            subject: 'Physics',
            grade: 12
        });

        console.log(" ✅ Data seeded. Dispatching API integration queries...\n");

        // ⏳ CRITICAL: Wait for Atlas Search to index the newly inserted documents.
        // ⏳ Poll for up to 60s until Atlas Search pick up the new document
        console.log("⏳ Polling for Atlas Search index sync (up to 60s)...");
        let indexed = false;
        for (let attempt = 1; attempt <= 20; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const pollRes = await fetch(`${BASE_URL}/search?q=${searchKeyword}`);
            const pollData = await pollRes.json();
            const pollResults = pollData.data?.results || [];
            const pollFound = pollResults.find(r => r._id === testTopicId || r.id === testTopicId);
            if (pollFound) {
                indexed = true;
                console.log(` ✅ Atlas Search synced after ~${attempt * 3}s`);
                break;
            }
            if (attempt < 20) {
                process.stdout.write(`  (attempt ${attempt}/20 – doc not yet indexed, retrying...)\n`);
            }
        }
        if (!indexed) {
            throw new Error(`Atlas Search did not index test document within 60 seconds.`);
        }

        // --- TEST 1: Basic Text Search ---
        console.log(`[TEST 1] GET /api/search?q=${searchKeyword} -> Checking phrase retrieval accuracy...`);
        const searchRes = await fetch(`${BASE_URL}/search?q=${searchKeyword}`);
        const searchData = await searchRes.json();

        if (!searchRes.ok) {
            throw new Error(`Search API returned status ${searchRes.status}: ${JSON.stringify(searchData)}`);
        }

        const results = searchData.data?.results || [];
        const foundTopic = results.find(r => r._id === testTopicId || r.id === testTopicId);

        if (foundTopic) {
            console.log(" ✅ Passed text matching confirmation profile.");
        } else {
            throw new Error(`Text query did not resolve the expected topic ID entry. Got: ${JSON.stringify(searchData)}`);
        }

        // --- TEST 2: Popular Search Tracking ---
        console.log("[TEST 2] Verifying search increment trackers inside database...");
        // Wait briefly for async tracking to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        const popularRecord = await PopularSearch.findOne({ query: searchKeyword.toLowerCase() });
        if (popularRecord && popularRecord.count >= 1) {
            console.log(` ✅ Passed analytics integration validation check. (Hit count recorded: ${popularRecord.count})`);
        } else {
            throw new Error("Search execution query metrics increments were skipped.");
        }

        // --- TEST 3: Formula Search ---
        console.log(`[TEST 3] GET /api/search/formulas?q=${encodeURIComponent(formulaExpr)} -> Evaluating formula parsing lookups...`);
        const formulaRes = await fetch(`${BASE_URL}/search/formulas?q=${encodeURIComponent(formulaExpr)}`);
        const formulaData = await formulaRes.json();

        if (!formulaRes.ok) {
            throw new Error(`Formula API returned status ${formulaRes.status}: ${JSON.stringify(formulaData)}`);
        }

        const formulaResults = formulaData.data?.results || [];
        const foundFormula = formulaResults.find(f => f.latex_normalized === formulaExpr || f.latex === formulaExpr);

        if (foundFormula) {
            console.log(" ✅ Passed formula index structural matching check.");
        } else {
            throw new Error("Formula indexing criteria did not resolve matching definitions rows.");
        }

        // --- TEST 4: Autocomplete Suggestions ---
        const prefixString = searchKeyword.substring(0, 5);
        console.log(`[TEST 4] GET /api/search/suggest?prefix=${prefixString} -> Testing prefix suggestions dropdown matches...`);
        const suggestRes = await fetch(`${BASE_URL}/search/suggest?prefix=${prefixString}`);
        const suggestData = await suggestRes.json();

        if (!suggestRes.ok) {
            throw new Error(`Suggest API returned status ${suggestRes.status}: ${JSON.stringify(suggestData)}`);
        }

        const suggestions = suggestData.data?.suggestions || [];
        const foundSuggestion = suggestions.find(s =>
            typeof s === 'string' && s.toLowerCase().includes(searchKeyword.toLowerCase())
        );

        if (foundSuggestion) {
            console.log(` ✅ Passed type-ahead autocomplete lookups engine. Recommendation: "${foundSuggestion}"`);
        } else {
            throw new Error("Prefix typeahead autocompletion matching did not yield results.");
        }

        // --- TEST 5: Failed Search Tracking ---
        console.log(`[TEST 5] GET /api/search?q=${phantomToken} -> Triggering a zero-result fault path...`);
        const failSearchRes = await fetch(`${BASE_URL}/search?q=${phantomToken}`);
        await failSearchRes.json(); // Consume response

        // Wait briefly for async tracking
        await new Promise(resolve => setTimeout(resolve, 500));

        const failedRecord = await FailedSearch.findOne({ query: phantomToken });
        if (failedRecord) {
            console.log(` ✅ Passed failure monitoring check. Zero-match parameters recorded inside failed log registries.`);
        } else {
            throw new Error("Zero-result processing failed to record telemetry parameters in tracking catalogs.");
        }

        console.log("\n---------------------------------------------------------------------");
        console.log("⭐⭐⭐ ALL PHASE 8 SEARCH INTERFACE VERIFICATION CHECKS PASSED ⭐⭐⭐");
        console.log("---------------------------------------------------------------------");

    } catch (err) {
        console.error("\n❌ Phase 8 validation sequence halted on integration fault:");
        console.error(err.message);
        process.exit(1);
    } finally {
        console.log("\nCleaning temporary verification indices vectors structures...");
        try {
            await mongoose.connection.collection('topics').deleteOne({ _id: testTopicId });
            await mongoose.connection.collection('topic_contents').deleteOne({ topic_id: testTopicId });
            await mongoose.connection.collection('formula_index').deleteOne({ topic_id: testTopicId });
            await PopularSearch.deleteOne({ query: searchKeyword.toLowerCase() });
            await FailedSearch.deleteOne({ query: phantomToken });
            console.log("Cleanup successful.");
        } catch (cleanupErr) {
            console.warn("Warning: Cleanup encountered an issue:", cleanupErr.message);
        }

        await mongoose.connection.close();
        console.log("Database locks released safely. Execution complete.");
        process.exit(0);
    }
}

runPhase8ValidationSuite();