import mongoose from 'mongoose';
import { connectDB } from '../config/db.js'; // Assuming connection strategy path matching project layout
import { ingestDocument } from '../services/ingestion/ingestDocument.service.js';

// Import target baseline verification projection models
import Document from '../models/document.model.js';
import Topic from '../models/topic.model.js';
import IngestQueue from '../models/ingestQueue.model.js';

async function runPhase6ValidationSuite() {
    console.log("=====================================================================");
    console.log("          SIJIL PHASE 6 INGESTION PIPELINE MANUAL VERIFIER           ");
    console.log("=====================================================================");
    console.log("⚠️ REQUIREMENT: Ensure an active 'npm run worker' instance is running.");
    console.log("=====================================================================\n");

    // Open database connection
    await connectDB();

    // Generate a random SHA256-like string for testing
    const randomSha256 = Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    
    const mockValidPayload = {
        schema_version: "2.0.0",
        document_id: "doc_valid_test_" + randomSuffix,
        title: "Quantum Information Theory Systems " + randomSuffix,
        source_file_sha256: randomSha256,
        meta: { author: "Sijil Core Architecture Suite Labs" },
        flags: ["test-run"],
        autoFixLog: [{ element: "schema", adjustment: "normalized casing" }],
        container: {
            id: "ch_quantum_01",
            title: "Introduction to Quantum Entanglement " + randomSuffix,
            slug: "intro-quantum-entanglement-" + randomSuffix,
            topics: [
                {
                    topic_id: "top_entangle_01",
                    title: "Bell Inequalities and Measurement Paradigms " + randomSuffix,
                    topic_slug: "bell-inequalities-measurement-" + randomSuffix,
                    slug: "bell-inequalities-measurement-" + randomSuffix,
                    content_blocks: [
                        {
                            block_id: "blk_b01",
                            type: "text",
                            markdown: "Quantum entanglement describes structural non-local correlations."
                        },
                        {
                            block_id: "blk_b02",
                            type: "figure",
                            caption: "EPR Paradox Laboratory Structural Interferometer Blueprint Layout",
                            image_path_local: "/assets/images/epr-interferometer-" + randomSuffix + ".png"
                        }
                    ],
                    assessments: {
                        mcqs: [
                            {
                                question: "Which theorem bounds classical local hidden variables?",
                                options: ["Bell Theorem", "No-Cloning Theorem", "Shannon Limit", "Euler Constraint"],
                                answer: "Bell Theorem"
                            }
                        ],
                        short_questions: [
                            { question: "Explain why superluminal telemetry is restricted using entanglement states." }
                        ]
                    }
                }
            ]
        }
    };

    // Generate another random SHA256 for invalid payload
    const randomSha256Invalid = Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    
    const mockInvalidPayload = {
        schema_version: "2.1.0-unsupported", // Intentionally triggering validation failure
        title: "Broken Structural Architecture Document Target Pipeline",
        source_file_sha256: randomSha256Invalid,
        container: {
            title: "Faulty Structural Tree Hierarchy Parsing Node"
        }
    };

    try {
        // SCENARIO A: Happy Path Verification Run
        console.log("[SCENARIO A] Dispatching valid model structure to ingestDocument()...");
        const resultSuccess = await ingestDocument({ payload: mockValidPayload, source: 'manual-happy-path-test' });

        console.log(">> Ingest Service Return Payload Dump:", JSON.stringify(resultSuccess, null, 2));
        if (!resultSuccess.success) throw new Error("Happy path processing run unexpected failure occurred.");

        // Validate collections database state persistence
        const verifiedDoc = await Document.findById(resultSuccess.summary.document_id);
        const verifiedTopic = await Topic.findById("top_entangle_01");
        const verifiedTracking = await IngestQueue.findById(resultSuccess.tracking_id);

        if (verifiedDoc && verifiedTopic && verifiedTracking?.status === 'complete') {
                console.log(" ✅ Database Write Confirm: Master Document Entry found.");
                console.log(` ✅ Database Write Confirm: Topic collection-split found containing ${verifiedDoc.document_aggregates?.total_blocks || 0} block entries.`);
                console.log(" ✅ Database Write Confirm: Tracking Record successfully updated to status: complete.\n");
            } else {
                throw new Error("Relational collection matching verification checks failed validation verification profiles.");
            }

        // SCENARIO B: Validation Logic Isolation Check
        console.log("[SCENARIO B] Dispatching intentionally invalid model structure to test transaction safety...");
        const resultFailure = await ingestDocument({ payload: mockInvalidPayload, source: 'manual-fault-path-test' });

        console.log(">> Ingest Service Return Payload Dump:", JSON.stringify(resultFailure, null, 2));
        const faultyTracking = await IngestQueue.findById(resultFailure.tracking_id);

        if (!resultFailure.success && faultyTracking?.status === 'error') {
            console.log(" ✅ Error Recovery Confirm: Engine gracefully rejected payload properties.");
            console.log(` ✅ Error Recovery Confirm: Ingest tracking catalog updated to status: error containing ${faultyTracking.error_log.length} structural logs.\n`);
        } else {
            throw new Error("Validation failure mapping logic returned an unexpected lifecycle state result.");
        }

        console.log("---------------------------------------------------------------------");
        console.log("⭐⭐⭐ ALL PHASE 6 INGESTION PIPELINE VERIFICATION CHECKS PASSED ⭐⭐⭐");

    } catch (err) {
        console.error("\n❌ Core verification sequence interrupted due to execution error:");
        console.error(err);
    } finally {
        await mongoose.connection.close();
        console.log("Database handles closed safely. Automated evaluation script execution finished.");
        process.exit(0);
    }
}

runPhase6ValidationSuite();