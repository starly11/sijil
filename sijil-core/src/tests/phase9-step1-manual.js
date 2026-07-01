import { connectDB } from '../config/db.js';
import { 
    seedDefaultPolicies, 
    getPolicyForDocumentType, 
    isExportAllowed, 
    getAllPolicies 
} from '../services/export/exportPolicy.service.js';

async function runPhase9Step1Tests() {
    console.log("=====================================================================");
    console.log("          SIJIL PHASE 9 STEP 1 EXPORT POLICY MANUAL VERIFIER         ");
    console.log("=====================================================================\n");

    await connectDB();

    let allPassed = true;
    const results = [];

    // Test 1: Call seedDefaultPolicies() — expect { inserted: 10, skipped: 0 } on first run OR { inserted: 0, skipped: 10 } if already seeded
    try {
        console.log("[TEST 1] Seeding default policies...");
        const result1 = await seedDefaultPolicies();
        // Accept either first-run state or already-seeded state
        const isFirstRun = result1.inserted === 10 && result1.skipped === 0;
        const isAlreadySeeded = result1.inserted === 0 && result1.skipped === 10;
        
        if (isFirstRun) {
            console.log("✓ PASS: First seed returned { inserted: 10, skipped: 0 }");
            results.push({ test: 1, passed: true });
        } else if (isAlreadySeeded) {
            console.log("✓ PASS: Policies already existed, returned { inserted: 0, skipped: 10 } (idempotent)");
            results.push({ test: 1, passed: true });
        } else {
            console.log(`✗ FAIL: Unexpected result: ${JSON.stringify(result1)}`);
            results.push({ test: 1, passed: false });
            allPassed = false;
        }
    } catch (error) {
        console.log(`✗ FAIL: Test 1 threw error: ${error.message}`);
        results.push({ test: 1, passed: false, error: error.message });
        allPassed = false;
    }

    // Test 2: Call seedDefaultPolicies() again — expect { inserted: 0, skipped: 10 } (idempotent)
    try {
        console.log("\n[TEST 2] Seeding default policies again (idempotency check)...");
        const result2 = await seedDefaultPolicies();
        if (result2.inserted === 0 && result2.skipped === 10) {
            console.log("✓ PASS: Second seed returned { inserted: 0, skipped: 10 }");
            results.push({ test: 2, passed: true });
        } else {
            console.log(`✗ FAIL: Expected { inserted: 0, skipped: 10 }, got ${JSON.stringify(result2)}`);
            results.push({ test: 2, passed: false });
            allPassed = false;
        }
    } catch (error) {
        console.log(`✗ FAIL: Test 2 threw error: ${error.message}`);
        results.push({ test: 2, passed: false, error: error.message });
        allPassed = false;
    }

    // Test 3: Call getPolicyForDocumentType('textbook') — expect allowed_export_types includes 'formula_pack'
    try {
        console.log("\n[TEST 3] Getting policy for 'textbook' document type...");
        const policy = await getPolicyForDocumentType('textbook');
        if (policy.allowed_export_types.includes('formula_pack')) {
            console.log("✓ PASS: Textbook policy includes 'formula_pack'");
            results.push({ test: 3, passed: true });
        } else {
            console.log(`✗ FAIL: Textbook policy does not include 'formula_pack'. Got: ${JSON.stringify(policy.allowed_export_types)}`);
            results.push({ test: 3, passed: false });
            allPassed = false;
        }
    } catch (error) {
        console.log(`✗ FAIL: Test 3 threw error: ${error.message}`);
        results.push({ test: 3, passed: false, error: error.message });
        allPassed = false;
    }

    // Test 4: Call getPolicyForDocumentType('nonexistent') — expect error thrown
    try {
        console.log("\n[TEST 4] Getting policy for nonexistent document type...");
        await getPolicyForDocumentType('nonexistent');
        console.log("✗ FAIL: Expected error to be thrown for nonexistent type");
        results.push({ test: 4, passed: false });
        allPassed = false;
    } catch (error) {
        if (error.message.includes('No export policy found for document type: nonexistent')) {
            console.log("✓ PASS: Correct error thrown for nonexistent type");
            results.push({ test: 4, passed: true });
        } else {
            console.log(`✗ FAIL: Wrong error message: ${error.message}`);
            results.push({ test: 4, passed: false, error: error.message });
            allPassed = false;
        }
    }

    // Test 5: Call isExportAllowed('textbook', 'formula_pack') — expect { allowed: true }
    try {
        console.log("\n[TEST 5] Checking if 'formula_pack' is allowed for 'textbook'...");
        const result5 = await isExportAllowed('textbook', 'formula_pack');
        if (result5.allowed === true && result5.reason.includes('permitted')) {
            console.log("✓ PASS: formula_pack is permitted for textbook");
            results.push({ test: 5, passed: true });
        } else {
            console.log(`✗ FAIL: Expected allowed=true, got ${JSON.stringify(result5)}`);
            results.push({ test: 5, passed: false });
            allPassed = false;
        }
    } catch (error) {
        console.log(`✗ FAIL: Test 5 threw error: ${error.message}`);
        results.push({ test: 5, passed: false, error: error.message });
        allPassed = false;
    }

    // Test 6: Call isExportAllowed('legal', 'formula_pack') — expect { allowed: false }
    try {
        console.log("\n[TEST 6] Checking if 'formula_pack' is allowed for 'legal'...");
        const result6 = await isExportAllowed('legal', 'formula_pack');
        if (result6.allowed === false && result6.reason.includes('not permitted')) {
            console.log("✓ PASS: formula_pack is not permitted for legal");
            results.push({ test: 6, passed: true });
        } else {
            console.log(`✗ FAIL: Expected allowed=false, got ${JSON.stringify(result6)}`);
            results.push({ test: 6, passed: false });
            allPassed = false;
        }
    } catch (error) {
        console.log(`✗ FAIL: Test 6 threw error: ${error.message}`);
        results.push({ test: 6, passed: false, error: error.message });
        allPassed = false;
    }

    // Test 7: Call isExportAllowed('textbook', 'full_book') — expect { allowed: false, reason includes 'permanently disabled' }
    try {
        console.log("\n[TEST 7] Checking if 'full_book' is allowed (should always be disabled)...");
        const result7 = await isExportAllowed('textbook', 'full_book');
        if (result7.allowed === false && result7.reason.includes('permanently disabled')) {
            console.log("✓ PASS: full_book is permanently disabled");
            results.push({ test: 7, passed: true });
        } else {
            console.log(`✗ FAIL: Expected allowed=false with 'permanently disabled' reason, got ${JSON.stringify(result7)}`);
            results.push({ test: 7, passed: false });
            allPassed = false;
        }
    } catch (error) {
        console.log(`✗ FAIL: Test 7 threw error: ${error.message}`);
        results.push({ test: 7, passed: false, error: error.message });
        allPassed = false;
    }

    // Test 8: Call getAllPolicies() — expect array of 10 items
    try {
        console.log("\n[TEST 8] Getting all policies...");
        const policies = await getAllPolicies();
        if (Array.isArray(policies) && policies.length === 10) {
            console.log("✓ PASS: getAllPolicies returned array of 10 items");
            results.push({ test: 8, passed: true });
        } else {
            console.log(`✗ FAIL: Expected array of 10 items, got ${policies.length} items`);
            results.push({ test: 8, passed: false });
            allPassed = false;
        }
    } catch (error) {
        console.log(`✗ FAIL: Test 8 threw error: ${error.message}`);
        results.push({ test: 8, passed: false, error: error.message });
        allPassed = false;
    }

    // Summary
    console.log("\n=====================================================================");
    console.log("                           TEST SUMMARY                              ");
    console.log("=====================================================================");
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    console.log(`Passed: ${passedCount}/${totalCount}`);
    
    if (allPassed) {
        console.log("\n=== PHASE 9 STEP 1 COMPLETE ===");
    } else {
        console.log("\n=== SOME TESTS FAILED - REVIEW ABOVE ===");
    }
    
    process.exit(allPassed ? 0 : 1);
}

runPhase9Step1Tests().catch(err => {
    console.error("Fatal error running tests:", err);
    process.exit(1);
});
