import { validateQwenOutput } from '../services/validation/index.js';

async function runVerificationSuite() {
    console.log("=== STARTING PHASE 4B PIPELINE MANIFEST VERIFICATION ===");

    // 1. Build a valid base mock document payload matching all structural criteria
    const canonicalMockPayload = {
        schema_version: "2.0.0",
        schema_type: "textbook_chapter",
        ingest_metadata: {
            ingest_id: "ing_01j2k3456789",
            source_file_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            confidence_score: 0.95,
            warnings: [],
            status: "complete"
        },
        document_metadata: {
            _id: "doc_physics9thptb",
            document_id: "physics_9_ptb",
            title: "Physics Grade 9",
            access_control: { is_premium: false, allowed_roles: ["anonymous"] }
        },
        container: {
            _id: "ch_01chapterone",
            container_type: "chapter",
            number: 1,
            title: "Physical Quantities and Measurement",
            slug: "physical-quantities-and-measurement"
        },
        topics: [
            {
                _id: "top_verniercallip",
                document_id: "doc_physics9thptb",
                chapter_id: "ch_01chapterone",
                title: "Vernier Callipers",
                slug: "vernier-callipers",
                display_order: 1,
                topic_type: "content",
                difficulty: "medium",
                raw_text: "Vernier callipers are used to measure length down to one tenth of a millimeter accurately. The instrument consists of a main scale and a sliding vernier scale.",
                content_blocks: [
                    {
                        _id: "blk_01descblock",
                        type: "paragraph",
                        block_order: 1,
                        source_page: 12,
                        html: "<p>Vernier callipers are structural measuring instruments.</p>",
                        text: "Vernier callipers are structural measuring instruments."
                    }
                ],
                figures: [
                    {
                        _id: "fig_01calliperdia",
                        figure_number: "1.6",
                        caption: "Vernier calliper anatomy overview diagram.",
                        alt: "This is a detailed textbook description string for the diagram that must intentionally clear word counts boundary rules to prevent setting flags.",
                        image_path_local: "images/fig16.png",
                        render_strategy: "image"
                    }
                ]
            }
        ]
    };

    // Run initial sanity check pass
    const baseResult = await validateQwenOutput(JSON.stringify(canonicalMockPayload));
    console.log(`\nCanonical Payload Base Run Result -> valid: ${baseResult.valid}`);
    if (!baseResult.valid) {
        console.error(JSON.stringify(baseResult.errors, null, 2));
        process.exit(1);
    }

    let testScenariosPassed = true;

    // Scenario 1: Outdated Schema Version Target
    const sc1 = structuredClone(canonicalMockPayload);
    sc1.schema_version = "1.0.0";
    const r1 = await validateQwenOutput(JSON.stringify(sc1));
    const p1 = (!r1.valid && r1.tier === 1);
    console.log(`Scenario 1 (schema_version "1.0.0") -> Passed Rejection Gate: ${p1}`);
    if (!p1) testScenariosPassed = false;

    // Scenario 2: Empty Topics Container Matrix
    const sc2 = structuredClone(canonicalMockPayload);
    sc2.topics = [];
    const r2 = await validateQwenOutput(JSON.stringify(sc2));
    const p2 = (!r2.valid && r2.errors[0]?.message.includes("topics array must not be empty"));
    console.log(`Scenario 2 (Empty topics array) -> Passed Rejection Gate: ${p2}`);
    if (!p2) testScenariosPassed = false;

    // Scenario 3: Missing Vital Primary Slug Coordinates
    const sc3 = structuredClone(canonicalMockPayload);
    delete sc3.topics[0].slug;
    const r3 = await validateQwenOutput(JSON.stringify(sc3));
    const p3 = (!r3.valid && r3.tier === 1);
    console.log(`Scenario 3 (Missing primary slug field) -> Passed Rejection Gate: ${p3}`);
    if (!p3) testScenariosPassed = false;

    // Scenario 4: Malformed Slug Format Recovery Testing
    const sc4 = structuredClone(canonicalMockPayload);
    sc4.topics[0].slug = "Vernier Callipers!!";
    const r4 = await validateQwenOutput(JSON.stringify(sc4));
    const p4 = (r4.valid && r4.autoFixLog.some(l => l.type === "slug_sanitized") && r4.data.topics[0].slug === "vernier-callipers");
    console.log(`Scenario 4 (Malformed slug auto-fix recovery) -> Clean Conversion Passed: ${p4}`);
    if (!p4) testScenariosPassed = false;

    // Scenario 5: Automatic Sequence Reindexing for Content Block Steps
    const sc5 = structuredClone(canonicalMockPayload);
    sc5.topics[0].content_blocks = [
        { _id: "blk_b1", type: "paragraph", block_order: 1, source_page: 5, html: "a", text: "a" },
        { _id: "blk_b2", type: "paragraph", block_order: 3, source_page: 5, html: "b", text: "b" },
        { _id: "blk_b3", type: "paragraph", block_order: 7, source_page: 5, html: "c", text: "c" }
    ];
    const r5 = await validateQwenOutput(JSON.stringify(sc5));
    const fixedOrders = r5.data?.topics[0].content_blocks.map(b => b.block_order);
    const p5 = (r5.valid && JSON.stringify(fixedOrders) === "[1,2,3]");
    console.log(`Scenario 5 (Sequential order normalization) -> Reindexing Passed: ${p5}`);
    if (!p5) testScenariosPassed = false;

    // Scenario 6: Target Confidence Level Warning Flags Tracking
    const sc6 = structuredClone(canonicalMockPayload);
    sc6.ingest_metadata.confidence_score = 0.5;
    const r6 = await validateQwenOutput(JSON.stringify(sc6));
    const p6 = (r6.valid && r6.flags.some(f => f.type === "low_confidence_score"));
    console.log(`Scenario 6 (Low confidence scoring telemetry) -> Quality Flag Set: ${p6}`);
    if (!p6) testScenariosPassed = false;

    // Scenario 7: Incomplete Accessibility Metadata Checks
    const sc7 = structuredClone(canonicalMockPayload);
    sc7.topics[0].figures[0].alt = "Short sentence text description.";
    const r7 = await validateQwenOutput(JSON.stringify(sc7));
    const p7 = (r7.valid && r7.flags.some(f => f.type === "short_alt_text"));
    console.log(`Scenario 7 (Terse asset accessibility text checking) -> Quality Flag Set: ${p7}`);
    if (!p7) testScenariosPassed = false;

    // Evaluation Summary Block
    if (testScenariosPassed) {
        console.log("\n=== PHASE 4B MANUAL VERIFICATION COMPLETE ===");
    } else {
        console.error("\n🚨 Error detected. Pipeline validation criteria mismatched.");
        process.exit(1);
    }
}

runVerificationSuite();