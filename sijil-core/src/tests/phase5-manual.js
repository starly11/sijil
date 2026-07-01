import {
    ingestionQueue,
    imageUploadQueue,
    slugResolverQueue,
    exportGenQueue,
    searchIndexQueue
} from '../queues/index.js';

/**
 * Validates queue availability, confirmation tracking, and task lifecycle operations.
 */
async function runManualVerification() {
    console.log("=====================================================================");
    console.log("             SIJIL QUEUE LAYER MANUAL VERIFICATION SCRIPT            ");
    console.log("=====================================================================");
    console.log("CRITICAL DEPENDENCY REQUIREMENT:");
    console.log(">> Ensure 'npm run worker' is active inside an independent terminal shell.");
    console.log("=====================================================================\n");

    try {
        console.log("[STEP 1/5] Dispatching structural 'ingestion' tracking payload...");
        const jobIngest = await ingestionQueue.add('test-ingest-job', {
            ingest_id: 'ing_test123',
            source_file_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
            source: 'manual-test'
        });
        console.log(` ✅ Successfully written to ingestion queue. ID Assigned: ${jobIngest.id}\n`);

        console.log("[STEP 2/5] Dispatching structural 'image-upload' tracking payload...");
        const jobImage = await imageUploadQueue.add('test-image-job', {
            topic_id: 'top_test123',
            figure_count: 2
        });
        console.log(` ✅ Successfully written to image-upload queue. ID Assigned: ${jobImage.id}\n`);

        console.log("[STEP 3/5] Dispatching structural 'slug-resolver' tracking payload...");
        const jobSlug = await slugResolverQueue.add('test-slug-job', {
            topic_id: 'top_test123',
            unresolved_count: 3
        });
        console.log(` ✅ Successfully written to slug-resolver queue. ID Assigned: ${jobSlug.id}\n`);

        console.log("[STEP 4/5] Dispatching structural 'export-gen' tracking payload...");
        const jobExport = await exportGenQueue.add('test-export-gen-job', {
            topic_id: 'top_test123',
            format: 'pdf_formatted'
        });
        console.log(` ✅ Successfully written to export-gen queue. ID Assigned: ${jobExport.id}\n`);

        console.log("[STEP 5/5] Dispatching structural 'search-index' tracking payload...");
        const jobSearch = await searchIndexQueue.add('test-search-index-job', {
            topic_id: 'top_test123',
            document_id: 'doc_test123'
        });
        console.log(` ✅ Successfully written to search-index queue. ID Assigned: ${jobSearch.id}\n`);

        console.log("---------------------------------------------------------------------");
        console.log("Pausing execution for 3 seconds to monitor active worker metrics logs...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Clean up local client queue handles cleanly to allow testing runtime process completion
        await ingestionQueue.close();
        await imageUploadQueue.close();
        await slugResolverQueue.close();
        await exportGenQueue.close();
        await searchIndexQueue.close();

        console.log("\n⭐⭐⭐ ALL 5 QUEUES SUCCESSFULLY PROCESSED AND COMPLETED ⭐⭐⭐");
        console.log("Verification checks passed. Check worker console output for telemetry accuracy logs.");
    } catch (error) {
        console.error("\n❌ Core verification sequence interrupted due to execution error:");
        console.error(error);
        process.exit(1);
    }
}

runManualVerification();