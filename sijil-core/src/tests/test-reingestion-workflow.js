import mongoose from 'mongoose';
import { config } from 'dotenv';
import Document from '../models/document.model.js';
import Topic from '../models/topic.model.js';
import TopicContent from '../models/topicContent.model.js';
import TopicAsset from '../models/topicAsset.model.js';
import TopicAssessment from '../models/topicAssessment.model.js';
import Version from '../models/version.model.js';
import { computeContentHash } from '../services/ingestion/computeContentHash.service.js';
import { checkDuplicate } from '../services/ingestion/checkDuplicate.service.js';
import { buildVersionChain, archivePreviousTopics } from '../services/ingestion/buildVersionChain.service.js';

config();

const TEST_DOCUMENT_ID = `test_doc_fixed_${Date.now()}`;
const MONGO_URI = process.env.MONGODB_URI;

async function cleanup() {
  await Document.deleteMany({ 'document_metadata.document_id': TEST_DOCUMENT_ID });
  await Topic.deleteMany({ document_id: TEST_DOCUMENT_ID });
  await TopicContent.deleteMany({ document_id: TEST_DOCUMENT_ID });
  await TopicAsset.deleteMany({ document_id: TEST_DOCUMENT_ID });
  await TopicAssessment.deleteMany({ document_id: TEST_DOCUMENT_ID });
  await Version.deleteMany({ document_id: TEST_DOCUMENT_ID });
}

async function testReIngestionWorkflow() {
  console.log('=== RE-INGESTION WORKFLOW TEST ===\n');
  
  let passCount = 0;
  let failCount = 0;

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected\n');

    await cleanup();
    console.log('🧹 Cleaned up test data\n');

    // TEST 1: Compute Content Hash
    console.log('--- TEST 1: Content Hash Computation ---');
    const text1 = 'The quick brown fox jumps over the lazy dog';
    const text2 = 'The quick brown fox jumps over the lazy dog';
    const text3 = 'The quick brown fox jumps over the lazy cat';
    
    const hash1 = await computeContentHash(text1);
    const hash2 = await computeContentHash(text2);
    const hash3 = await computeContentHash(text3);
    
    if (hash1 === hash2 && hash1 !== hash3) {
      console.log('✓ Test 1 PASS: Identical text produces same hash, different text produces different hash');
      console.log(`  Hash 1: ${hash1.substring(0, 16)}...`);
      console.log(`  Hash 2: ${hash2.substring(0, 16)}...`);
      console.log(`  Hash 3: ${hash3.substring(0, 16)}...`);
      passCount++;
    } else {
      console.log('✗ Test 1 FAIL: Hash computation incorrect');
      failCount++;
    }

    // TEST 2: Duplicate Detection (No existing doc)
    console.log('\n--- TEST 2: Duplicate Detection (New Document) ---');
    const dupCheck1 = await checkDuplicate(TEST_DOCUMENT_ID, hash1);
    
    if (!dupCheck1.isDuplicate && dupCheck1.existingDocument === null) {
      console.log('✓ Test 2 PASS: Correctly identified as new document');
      passCount++;
    } else {
      console.log('✗ Test 2 FAIL: Should not be detected as duplicate');
      failCount++;
    }

    // TEST 3: Create Initial Document Version
    console.log('\n--- TEST 3: Create Initial Document (v1) ---');
    const docV1 = await Document.create({
      _id: `doc_test_${Date.now()}`,
      schema_type: 'document',
      document_metadata: {
        _id: `doc_test_${Date.now()}`,
        document_id: TEST_DOCUMENT_ID,
        title: 'Test Document v1',
        document_type: 'textbook',
        subject: 'Physics',
        grade_level: '10',
        content_hash: hash1,
        document_version: "1",
        is_latest: true,
        parent_document_id: null
      },
      seo_master: { slug: `test-doc-${Date.now()}` },
      url_path: `/physics/test-doc-${Date.now()}`
    });
    
    const topicV1 = await Topic.create({
      _id: `top_test_${Date.now()}`,
      document_id: TEST_DOCUMENT_ID,
      chapter_id: `ch_test_${Date.now()}`,
      topic_id: `top_test_1`,
      title: 'Introduction',
      slug: 'introduction',
      slug_global: `global-intro-${Date.now()}`,
      url_path: `/physics/introduction`,
      block_order: [1],
      word_count: 100,
      design_meta: {},
      is_latest: true
    });
    
    await TopicContent.create({
      _id: `blk_test_${Date.now()}`,
      document_id: TEST_DOCUMENT_ID,
      topic_id: topicV1._id,
      block_id: 'blk_test_1',
      block_order: 1,
      type: 'paragraph',
      content: { text: 'Initial content' },
      quran_data: null
    });

    console.log(`  Created Document v1: ${docV1._id}`);
    console.log(`  Created Topic: ${topicV1._id}`);
    
    if (docV1.document_metadata.document_version === "1" && docV1.document_metadata.is_latest === true) {
      console.log('✓ Test 3 PASS: Initial document created correctly');
      passCount++;
    } else {
      console.log('✗ Test 3 FAIL: Initial document versioning incorrect');
      console.log(`  Expected: version="1", is_latest=true`);
      console.log(`  Got: version="${docV1.document_metadata.document_version}", is_latest=${docV1.document_metadata.is_latest}`);
      failCount++;
    }

    // TEST 4: Duplicate Detection (Same hash)
    console.log('\n--- TEST 4: Duplicate Detection (Exact Duplicate) ---');
    const dupCheck2 = await checkDuplicate(hash1);
    
    if (dupCheck2.isDuplicate && dupCheck2.existingDocument !== null) {
      console.log('✓ Test 4 PASS: Correctly detected exact duplicate');
      console.log(`  Existing document: ${dupCheck2.existingDocument._id}`);
      passCount++;
    } else {
      console.log('✗ Test 4 FAIL: Should detect exact duplicate');
      console.log(`  isDuplicate: ${dupCheck2.isDuplicate}, existingDocument: ${dupCheck2.existingDocument?._id}`);
      failCount++;
    }

    // TEST 5: Build Version Chain (New version)
    console.log('\n--- TEST 5: Build Version Chain (v2) ---');
    const hashNew = await computeContentHash('Modified content for v2');
    
    const versionInfo = await buildVersionChain(TEST_DOCUMENT_ID, hashNew);
    
    // Create the new document version manually since buildVersionChain only prepares metadata
    const docV2 = await Document.create({
      _id: `doc_test_v2_${Date.now()}`,
      schema_type: 'document',
      document_metadata: {
        _id: `doc_test_v2_${Date.now()}`,
        document_id: TEST_DOCUMENT_ID,
        title: 'Test Document v2',
        document_type: 'textbook',
        subject: 'Physics',
        grade_level: '10',
        content_hash: hashNew,
        document_version: versionInfo.documentVersion.toString(),
        is_latest: true,
        parent_document_id: versionInfo.parentDocumentId
      },
      seo_master: { slug: `test-doc-v2-${Date.now()}` },
      url_path: `/physics/test-doc-v2-${Date.now()}`
    });
    
    const docV1Refreshed = await Document.findById(docV1._id);
    
    console.log(`  Created Document v2: ${docV2._id}`);
    console.log(`  V1 is_latest: ${docV1Refreshed.document_metadata.is_latest}`);
    console.log(`  V2 is_latest: ${docV2.document_metadata.is_latest}`);
    console.log(`  V2 parent: ${docV2.document_metadata.parent_document_id === docV1._id}`);
    
    if (docV2 && 
        docV2.document_metadata.document_version === "2" && 
        docV2.document_metadata.is_latest === true &&
        docV2.document_metadata.parent_document_id === docV1._id &&
        docV1Refreshed.document_metadata.is_latest === false) {
      console.log('✓ Test 5 PASS: Version chain built correctly');
      passCount++;
    } else {
      console.log('✗ Test 5 FAIL: Version chain incorrect');
      console.log(`  Expected: v2 latest=true, v1 latest=false, parent linked`);
      console.log(`  Got: v2.version=${docV2.document_metadata.document_version}, v2.latest=${docV2.document_metadata.is_latest}, v1.latest=${docV1Refreshed.document_metadata.is_latest}`);
      failCount++;
    }

    // TEST 6: Topic Archival
    console.log('\n--- TEST 6: Topic Archival ---');
    // Manually archive topics since we're not calling persistIngestion in this test
    await archivePreviousTopics(versionInfo.previousTopics, TEST_DOCUMENT_ID);
    
    // Create V2 topic to simulate what persistIngestion would do
    const topicV2 = await Topic.create({
      _id: `top_test_v2_${Date.now()}`,
      document_id: TEST_DOCUMENT_ID,
      chapter_id: `ch_test_${Date.now()}`,
      topic_id: `top_test_2`,
      title: 'Introduction V2',
      slug: 'introduction-v2',
      slug_global: `global-intro-v2-${Date.now()}`,
      url_path: `/physics/introduction-v2`,
      block_order: [1],
      word_count: 150,
      design_meta: {},
      is_latest: true
    });
    
    const archivedTopics = await Topic.find({ 
      document_id: TEST_DOCUMENT_ID,
      is_archived: true 
    });
    
    const activeTopics = await Topic.find({ 
      document_id: TEST_DOCUMENT_ID,
      is_latest: true
    });
    
    console.log(`  Archived topics: ${archivedTopics.length}`);
    console.log(`  Active topics (is_latest=true): ${activeTopics.length}`);
    
    if (archivedTopics.length >= 1 && activeTopics.length === 1) {
      console.log('✓ Test 6 PASS: Topics archived correctly, new version active');
      passCount++;
    } else {
      console.log('✗ Test 6 FAIL: Topic archival incorrect');
      console.log(`  Expected: archived>=1, active=1`);
      failCount++;
    }

    // TEST 7: Version Record Creation
    console.log('\n--- TEST 7: Version Record Creation ---');
    // Create version record manually since we're not in full ingestion flow
    const { computeVersionDiff, createVersionRecord } = await import('../services/version/versionDiff.service.js');
    const diff = await computeVersionDiff(docV1._id, docV2._id);
    const versionRecordCreated = await createVersionRecord({
      document_id: TEST_DOCUMENT_ID,
      version_number: 2,
      previous_version_id: docV1._id,
      diff_summary: diff
    });
    
    const versionRecord = await Version.findOne({ 
      document_id: TEST_DOCUMENT_ID,
      version: "2" 
    });
    
    console.log(`  Version record _id: ${versionRecord?._id}`);
    console.log(`  Version record scope: ${versionRecord?.scope}`);
    console.log(`  Version record entity_id: ${versionRecord?.entity_id}`);
    console.log(`  Version record version: ${versionRecord?.version}`);
    console.log(`  Has diff_summary: ${!!versionRecord?.diff_summary}`);
    console.log(`  Has parent_version_id: ${!!versionRecord?.parent_version_id}`);
    
    if (versionRecord && 
        versionRecord.scope === 'document' &&
        versionRecord.entity_id === TEST_DOCUMENT_ID &&
        versionRecord.version === "2" && 
        versionRecord.diff_summary && 
        versionRecord.parent_version_id) {
      console.log('✓ Test 7 PASS: Version record created with diff');
      console.log(`  Diff summary: ${versionRecord.diff_summary.substring(0, 100)}...`);
      passCount++;
    } else {
      console.log('✗ Test 7 FAIL: Version record missing or incomplete');
      console.log(`  Expected: scope=document, version="2", has diff_summary and parent_version_id`);
      console.log(`  Got: scope=${versionRecord?.scope}, version=${versionRecord?.version}`);
      failCount++;
    }

    // TEST 8: Multiple Versions Chain
    console.log('\n--- TEST 8: Multiple Versions Chain (v3) ---');
    const hashV3 = await computeContentHash('Third version content');
    
    const versionInfoV3 = await buildVersionChain(TEST_DOCUMENT_ID, hashV3, {
      title: 'Test Document v3',
      document_type: 'textbook',
      subject: 'Physics',
      grade_level: '10'
    });
    
    // Create V3 document manually
    const docV3 = await Document.create({
      _id: `doc_test_v3_${Date.now()}`,
      schema_type: 'document',
      document_metadata: {
        _id: `doc_test_v3_${Date.now()}`,
        document_id: TEST_DOCUMENT_ID,
        title: 'Test Document v3',
        document_type: 'textbook',
        subject: 'Physics',
        grade_level: '10',
        content_hash: hashV3,
        document_version: versionInfoV3.documentVersion.toString(),
        is_latest: true,
        parent_document_id: versionInfoV3.parentDocumentId
      },
      seo_master: { slug: `test-doc-v3-${Date.now()}` },
      url_path: `/physics/test-doc-v3-${Date.now()}`
    });
    
    const docV2Refreshed = await Document.findById(docV2._id);
    const allVersions = await Document.find({ 
      'document_metadata.document_id': TEST_DOCUMENT_ID 
    }).sort({ 'document_metadata.document_version': 1 });
    
    const latestCount = allVersions.filter(d => d.document_metadata.is_latest).length;
    
    console.log(`  Total versions: ${allVersions.length}`);
    console.log(`  Latest versions count: ${latestCount}`);
    console.log(`  V3 _id: ${docV3._id}`);
    console.log(`  V2 _id: ${docV2._id}`);
    console.log(`  V3 parent: ${docV3.document_metadata.parent_document_id}`);
    console.log(`  V3 parent === V2 _id: ${docV3.document_metadata.parent_document_id?.toString() === docV2._id.toString()}`);
    console.log(`  V3 version: ${docV3.document_metadata.document_version}`);
    console.log(`  V3 is_latest: ${docV3.document_metadata.is_latest}`);
    console.log(`  V2 is_latest: ${docV2Refreshed.document_metadata.is_latest}`);
    
    if (allVersions.length === 3 && 
        latestCount === 1 && 
        docV3 && 
        docV3.document_metadata.document_version === "3" &&
        docV3.document_metadata.is_latest === true &&
        docV2Refreshed.document_metadata.is_latest === false &&
        docV3.document_metadata.parent_document_id?.toString() === docV2._id.toString()) {
      console.log('✓ Test 8 PASS: Multiple version chain maintained correctly');
      passCount++;
    } else {
      console.log('✗ Test 8 FAIL: Version chain broken');
      console.log(`  Expected: 3 versions, 1 latest, V3 parent=V2`);
      console.log(`  Got: ${allVersions.length} versions, ${latestCount} latest, V3.version=${docV3?.document_metadata.document_version}`);
      failCount++;
    }

    // TEST 9: Re-ingest Old Version (Out of Order)
    console.log('\n--- TEST 9: Out-of-Order Re-ingestion ---');
    // Try to re-ingest v1 hash when v3 is latest
    const versionInfoOOO = await buildVersionChain(TEST_DOCUMENT_ID, hash1, {
      title: 'Test Document v1 (restored)',
      document_type: 'textbook',
      subject: 'Physics',
      grade_level: '10'
    });
    
    // Create V4 document manually
    const docV4 = await Document.create({
      _id: `doc_test_v4_${Date.now()}`,
      schema_type: 'document',
      document_metadata: {
        _id: `doc_test_v4_${Date.now()}`,
        document_id: TEST_DOCUMENT_ID,
        title: 'Test Document v1 (restored)',
        document_type: 'textbook',
        subject: 'Physics',
        grade_level: '10',
        content_hash: hash1,
        document_version: versionInfoOOO.documentVersion.toString(),
        is_latest: true,
        parent_document_id: versionInfoOOO.parentDocumentId
      },
      seo_master: { slug: `test-doc-v4-${Date.now()}` },
      url_path: `/physics/test-doc-v4-${Date.now()}`
    });
    
    const docV3Refreshed = await Document.findById(docV3._id);
    
    console.log(`  V4 version: ${docV4.document_metadata.document_version}`);
    console.log(`  V4 is_latest: ${docV4.document_metadata.is_latest}`);
    console.log(`  V4 content_hash matches V1: ${docV4.document_metadata.content_hash === hash1}`);
    console.log(`  V3 is_latest: ${docV3Refreshed.document_metadata.is_latest}`);
    
    if (docV4 && 
        docV4.document_metadata.document_version === "4" && 
        docV4.document_metadata.is_latest === true &&
        docV4.document_metadata.content_hash === hash1 &&
        docV3Refreshed.document_metadata.is_latest === false) {
      console.log('✓ Test 9 PASS: Out-of-order re-ingestion creates new version');
      console.log(`  V4 has original v1 hash but is v4`);
      passCount++;
    } else {
      console.log('✗ Test 9 FAIL: Out-of-order handling incorrect');
      console.log(`  Expected: v4, latest=true, hash=v1, v3 not latest`);
      console.log(`  Got: v${docV4?.document_metadata.document_version}, latest=${docV4?.document_metadata.is_latest}`);
      failCount++;
    }

    // Summary
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║           RE-INGESTION WORKFLOW TEST RESULTS                ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Passed: ${passCount}/9                                                ║`);
    console.log(`║  Failed: ${failCount}/9                                                ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');

    if (failCount === 0) {
      console.log('\n✅ ALL TESTS PASSED - Re-ingestion workflow is functional!');
    } else {
      console.log(`\n⚠️  ${failCount} test(s) failed - Review implementation`);
    }

  } catch (err) {
    console.error('❌ Test execution failed:', err);
    failCount++;
  } finally {
    await cleanup();
    console.log('\n🧹 Test data cleaned up');
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
    process.exit(failCount > 0 ? 1 : 0);
  }
}

testReIngestionWorkflow();
