import mongoose from 'mongoose'
import { config } from '../config/env.js'
import { connectDB } from '../config/db.js'
import Topic from '../models/topic.model.js'
import { buildOfflinePackage, buildAndSavePackage, generateExportFilename } from '../services/export/packageBuilder.service.js'
import * as logger from '../utils/logger.js'

const BASE_URL = process.env.BASE_URL || 'https://sijil.app'

async function runTests() {
  console.log('=== PHASE 9 STEP 7 MANUAL TESTS ===\n')
  
  // Ensure DB connection
  await connectDB()
  
  // Get real topic ID
  const topic = await Topic.findOne().lean()
  if (!topic) {
    console.log('NO TOPICS IN DATABASE — seed data first')
    return
  }
  const realTopicId = topic._id
  console.log(`Using topic: ${realTopicId} (${topic.title})\n`)

  let passed = 0
  let failed = 0
  let skipped = 0

  // Test 1
  try {
    console.log('Test 1: buildOfflinePackage with formula_pack...')
    const buffer1 = await buildOfflinePackage({ topicId: realTopicId, exportType: 'formula_pack', documentType: 'textbook' })
    if (Buffer.isBuffer(buffer1) && buffer1.length > 0) {
      console.log(`✅ PASS - Buffer size: ${(buffer1.length / 1024).toFixed(2)} KB`)
      passed++
    } else {
      console.log('❌ FAIL - Buffer is empty or invalid')
      failed++
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`)
    failed++
  }

  // Test 2
  try {
    console.log('Test 2: buildOfflinePackage with mcq_pack...')
    const buffer2 = await buildOfflinePackage({ topicId: realTopicId, exportType: 'mcq_pack', documentType: 'textbook' })
    if (Buffer.isBuffer(buffer2) && buffer2.length > 0) {
      console.log(`✅ PASS - Buffer size: ${(buffer2.length / 1024).toFixed(2)} KB`)
      passed++
    } else {
      console.log('❌ FAIL - Buffer is empty or invalid')
      failed++
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`)
    failed++
  }

  // Test 3
  try {
    console.log('Test 3: buildOfflinePackage with revision_pack...')
    const buffer3 = await buildOfflinePackage({ topicId: realTopicId, exportType: 'revision_pack', documentType: 'textbook' })
    if (Buffer.isBuffer(buffer3) && buffer3.length > 0) {
      console.log(`✅ PASS - Buffer size: ${(buffer3.length / 1024).toFixed(2)} KB`)
      passed++
    } else {
      console.log('❌ FAIL - Buffer is empty or invalid')
      failed++
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`)
    failed++
  }

  // Test 4
  try {
    console.log('Test 4: buildAndSavePackage to /tmp/sijil-test-export.zip...')
    const outputPath = '/tmp/sijil-test-export.zip'
    const result = await buildAndSavePackage({
      topicId: realTopicId,
      exportType: 'revision_pack',
      documentType: 'textbook',
      outputPath
    })
    if (result.sizeBytes > 0) {
      console.log(`✅ PASS - Output: ${result.outputPath}, Size: ${result.sizeKb} KB`)
      passed++
    } else {
      console.log('❌ FAIL - File size is 0')
      failed++
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`)
    failed++
  }

  // Test 5
  try {
    console.log('Test 5: Verify ZIP file exists and size > 1KB...')
    const fs = await import('fs')
    const stats = fs.statSync('/tmp/sijil-test-export.zip')
    if (stats.size > 1024) {
      console.log(`✅ PASS - ZIP verification: file exists and size OK (${(stats.size / 1024).toFixed(2)} KB)`)
      passed++
    } else {
      console.log('❌ FAIL - File too small')
      failed++
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`)
    failed++
  }

  // Test 6
  try {
    console.log('Test 6: generateExportFilename...')
    const filename = generateExportFilename({
      topicId: realTopicId,
      exportType: 'formula_pack',
      metadata: { slug: 'vernier-callipers' }
    })
    if (filename.startsWith('sijil-formula-pack-') && filename.endsWith('.zip')) {
      console.log(`✅ PASS - Filename: ${filename}`)
      passed++
    } else {
      console.log('❌ FAIL - Invalid filename format')
      failed++
    }
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`)
    failed++
  }

  // Test 7
  try {
    console.log('Test 7: buildOfflinePackage with legal document type (should fail)...')
    await buildOfflinePackage({ topicId: realTopicId, exportType: 'formula_pack', documentType: 'legal' })
    console.log('❌ FAIL - Should have thrown policy error')
    failed++
  } catch (err) {
    if (err.message.includes('not permitted')) {
      console.log(`✅ PASS - Correctly rejected: ${err.message}`)
      passed++
    } else {
      console.log(`❌ FAIL - Wrong error: ${err.message}`)
      failed++
    }
  }

  // Test 8
  try {
    console.log('Test 8: buildOfflinePackage with unknown export type...')
    await buildOfflinePackage({ topicId: realTopicId, exportType: 'unknown_type', documentType: 'textbook' })
    console.log('❌ FAIL - Should have thrown error')
    failed++
  } catch (err) {
    if (err.message.includes('No renderer') || err.message.includes('Unknown export type') || err.message.includes('not permitted')) {
      console.log(`✅ PASS - Correctly rejected: ${err.message}`)
      passed++
    } else {
      console.log(`❌ FAIL - Wrong error: ${err.message}`)
      failed++
    }
  }

  // Test 9 (HTTP)
  try {
    console.log('Test 9: HTTP GET /api/export/download...')
    const fetch = (await import('node-fetch')).default
    const response = await fetch(`${BASE_URL}:${process.env.PORT || 4000}/api/export/download?topic_id=${realTopicId}&format=formula_pack&document_type=textbook`)
    if (response.status === 200 && response.headers.get('content-type')?.includes('application/zip')) {
      console.log(`✅ PASS - Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`)
      passed++
    } else {
      console.log(`❌ FAIL - Status: ${response.status}`)
      failed++
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.log('⚠️ SKIP: server not running')
      skipped++
    } else {
      console.log(`❌ FAIL - ${err.message}`)
      failed++
    }
  }

  // Test 10 (HTTP - policy check)
  try {
    console.log('Test 10: HTTP GET /api/export/download with legal doc type (should 403)...')
    const fetch = (await import('node-fetch')).default
    const response = await fetch(`${BASE_URL}:${process.env.PORT || 4000}/api/export/download?topic_id=${realTopicId}&format=formula_pack&document_type=legal`)
    if (response.status === 403) {
      console.log(`✅ PASS - Status: ${response.status} (policy enforced)`)
      passed++
    } else {
      console.log(`❌ FAIL - Expected 403, got: ${response.status}`)
      failed++
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.log('⚠️ SKIP: server not running')
      skipped++
    } else {
      console.log(`❌ FAIL - ${err.message}`)
      failed++
    }
  }

  console.log(`\n=== RESULTS ===`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)

  if (failed === 0) {
    console.log('\n=== PHASE 9 STEP 7 COMPLETE ===')
  } else {
    console.log('\n❌ Some tests failed')
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err)
  process.exit(1)
})
