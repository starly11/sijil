import idService from '../services/id.service.js';
import slugService from '../services/slug.service.js';


function runVerification() {
    console.log('=== RUNNING PHASE 2 MANUAL VERIFICATION ===\n');

    // 1. Verify Entity ID Generation Logic
    console.log('--- 1. Testing ID Generation (10 Types) ---');
    Object.keys(idService.ID_PREFIXES).forEach((type) => {
        const generated = idService.generateId(type);
        console.log(`[ID TYPE: ${type.padEnd(9)}] => ${generated}`);
    });
    console.log();

    // 2. Verify Batch ID Generation Logic
    console.log('--- 2. Testing Batch ID Generation ---');
    const batch = idService.generateBatchIds('topic', 5);
    console.log('Batch output (5 unique topic IDs):', batch);
    console.log(`Unique items verification check size: ${new Set(batch).size} / 5\n`);

    // 3. Verify Slugs Sanitization Law Transformations
    console.log('--- 3. Testing Slug Sanitization ---');
    const messyInputs = [
        'Physics Class 9',
        'Physical Quantities and Measurements',
        'Vernier Callipers!! (@#$!)',
        'errors_in_measurement__with_underscores  ',
        'A_very_long_title_string_designed_to_exceed_the_eighty_character_limit_of_the_sanitization_rules_system_processing'
    ];

    messyInputs.forEach((input) => {
        const output = slugService.sanitizeSlug(input);
        console.log(`Input : "${input}"`);
        console.log(`Output: "${output}" (Length: ${output.length})\n`);
    });

    // 4. Verify Slug Validation Rules
    console.log('--- 4. Testing Slug Validation ---');
    const validSlugs = ['physics-class-9', 'ch1-introduction', 'vernier-callipers'];
    const invalidSlugs = ['Physics-Class-9', 'slug--double-hyphen', '-leading-hyphen', 'trailing-hyphen-', 'space helper', ''];

    console.log('Valid Cases (Expected: true):');
    validSlugs.forEach((s) => console.log(`  "${s}": ${slugService.validateSlug(s)}`));

    console.log('Invalid Cases (Expected: false):');
    invalidSlugs.forEach((s) => console.log(`  "${s}": ${slugService.validateSlug(s)}`));
    console.log();

    // 5. Verify Complex Custom Domain Build Mappings
    console.log('--- 5. Testing Specialized Domain Slug Builders ---');
    console.log('Global Slug:', slugService.buildGlobalSlug('physics-class-9', 1, 'vernier-callipers'));
    console.log('Dedupe Slug:', slugService.dedupeSlug('errors-in-measurement', '1-9'));
    console.log('Quran Slug :', slugService.buildQuranSlug(2, 255, 255));
    console.log('Exercise    :', slugService.buildExerciseSlug(3));
    console.log('Intro       :', slugService.buildIntroSlug(3));
    console.log();

    // 6. Verify Cross Reference State Handling Functions
    console.log('--- 6. Testing Cross Reference Processing Engine ---');
    const baseSlug = 'kinematics-motion';
    const prefixed = slugService.addCrossRefPrefix(baseSlug);
    console.log('Add Prefix   :', prefixed);
    console.log('Is Cross Ref?:', slugService.isCrossRef(prefixed));
    console.log('Strip Prefix :', slugService.stripCrossRefPrefix(prefixed));
    console.log('Passthrough  :', slugService.stripCrossRefPrefix(baseSlug));
    console.log();

    // 7. Verify Router Segment Lookup Extraction Logic
    console.log('--- 7. Testing URL Short ID Extraction Logic ---');
    const targetSegment = 'vernier-callipers-top9x82j1kpqr';
    const extractedId = slugService.extractShortIdFromUrlSegment(targetSegment);
    console.log(`Segment: "${targetSegment}"`);
    console.log(`Extracted Id Output: "${extractedId}"\n`);

    console.log('=== PHASE 2 MANUAL VERIFICATION COMPLETE ===');
}

try {
    runVerification();
} catch (error) {
    console.error('🚨 Verification crashed with error:', error.message);
    process.exit(1);
}