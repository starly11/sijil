/**
 * Backend Wireup Verification Tests
 * Tests FIX 1 (Search Worker), FIX 2 (Slug Redirect), FIX 3 (Version Records)
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

// Import modules to test
import searchIndexProcessor from '../src/workers/processors/searchIndex.processor.js';
import { slugRedirectMiddleware } from '../src/middleware/slugRedirect.middleware.js';
import { resolveSlugRedirect } from '../src/services/slug/slugRedirect.service.js';
import { createVersionRecord, computeVersionDiff } from '../src/services/version/versionDiff.service.js';
import Version from '../src/models/version.model.js';
import app from '../app.js';
import http from 'http';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sijil_test';

let passCount = 0;
let failCount = 0;

function pass(testName) {
    console.log(`✅ PASS: ${testName}`);
    passCount++;
}

function fail(testName, reason) {
    console.log(`❌ FAIL: ${testName} - ${reason}`);
    failCount++;
}

async function runTests() {
    console.log('=== BACKEND WIREUP VERIFICATION TESTS ===\n');
    
    // Connect to MongoDB
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }

    // =====================
    // FIX 1 TESTS (Search Worker)
    // =====================
    console.log('--- FIX 1: Search Index Worker ---');
    
    // Test 1: searchIndex.processor.js exports a function (not a stub note string)
    if (typeof searchIndexProcessor === 'function') {
        pass('searchIndex.processor.js exports a function');
    } else {
        fail('searchIndex.processor.js exports a function', `Got ${typeof searchIndexProcessor}`);
    }
    
    // Test 2: The function accepts a job object and returns a result object with document_id and topics_checked fields
    try {
        const mockJob = {
            id: 'test-job-123',
            data: { document_id: 'nonexistent-doc-id' },
            updateProgress: async (progress) => {}
        };
        
        // This should not throw, even with nonexistent doc
        const result = await searchIndexProcessor(mockJob);
        
        if (result && typeof result.document_id !== 'undefined' && typeof result.topics_checked !== 'undefined') {
            pass('searchIndex processor returns result with document_id and topics_checked fields');
        } else {
            fail('searchIndex processor returns result with document_id and topics_checked fields', 
                 `Got result: ${JSON.stringify(result)}`);
        }
    } catch (err) {
        fail('searchIndex processor returns result with document_id and topics_checked fields', err.message);
    }
    
    // =====================
    // FIX 2 TESTS (Slug Redirect)
    // =====================
    console.log('\n--- FIX 2: Slug Redirect Middleware ---');
    
    // Test 3: slugRedirectMiddleware is importable
    if (typeof slugRedirectMiddleware === 'function') {
        pass('slugRedirectMiddleware is importable from src/middleware/slugRedirect.middleware.js');
    } else {
        fail('slugRedirectMiddleware is importable', `Got ${typeof slugRedirectMiddleware}`);
    }
    
    // Test 4: Middleware calls next() for a path with no redirect
    try {
        const mockReq = { method: 'GET', path: '/api/nonexistent-path-xyz' };
        let nextCalled = false;
        const mockRes = {
            redirect: (status, path) => {
                throw new Error('redirect should not be called');
            },
            status: () => mockRes,
            json: () => {}
        };
        const mockNext = () => { nextCalled = true; };
        
        await slugRedirectMiddleware(mockReq, mockRes, mockNext);
        
        if (nextCalled) {
            pass('Middleware calls next() for a path with no redirect');
        } else {
            fail('Middleware calls next() for a path with no redirect', 'next() was not called');
        }
    } catch (err) {
        fail('Middleware calls next() for a path with no redirect', err.message);
    }
    
    // Test 5: resolveSlugRedirect exists and returns null for a non-existent path
    try {
        const result = await resolveSlugRedirect('/api/nonexistent-xyz');
        
        if (!result.redirected || result.error) {
            pass('resolveSlugRedirect returns null/false for non-existent path');
        } else {
            fail('resolveSlugRedirect returns null/false for non-existent path', 
                 `Got redirected: ${result.redirected}`);
        }
    } catch (err) {
        fail('resolveSlugRedirect returns null/false for non-existent path', err.message);
    }
    
    // Test 6 & 7: Start the server and test routing
    console.log('\n--- Server Routing Tests ---');
    
    let server;
    try {
        server = http.createServer(app);
        await new Promise((resolve) => {
            server.listen(0, resolve); // Listen on random port
        });
        
        const address = server.address();
        const port = address.port;
        const baseUrl = `http://localhost:${port}`;
        
        // Test 6: GET /api/health → 200
        const healthRes = await fetch(`${baseUrl}/api/health`);
        if (healthRes.status === 200) {
            pass('GET /api/health → 200 (middleware did not break routing)');
        } else {
            fail('GET /api/health → 200', `Got status ${healthRes.status}`);
        }
        
        // Test 7: GET /api/nonexistent-xyz → 404
        const notFoundRes = await fetch(`${baseUrl}/api/nonexistent-xyz`);
        if (notFoundRes.status === 404) {
            pass('GET /api/nonexistent-xyz → 404 (middleware passes through correctly)');
        } else {
            fail('GET /api/nonexistent-xyz → 404', `Got status ${notFoundRes.status}`);
        }
        
        server.close();
    } catch (err) {
        fail('Server routing tests', err.message);
        if (server) server.close();
    }
    
    // =====================
    // FIX 3 TESTS (Version Records)
    // =====================
    console.log('\n--- FIX 3: Version Records ---');
    
    // Test 8: createVersionRecord is importable
    if (typeof createVersionRecord === 'function') {
        pass('createVersionRecord is importable from versionDiff.service.js');
    } else {
        fail('createVersionRecord is importable', `Got ${typeof createVersionRecord}`);
    }
    
    // Test 9: computeVersionDiff is importable
    if (typeof computeVersionDiff === 'function') {
        pass('computeVersionDiff is importable from versionDiff.service.js');
    } else {
        fail('computeVersionDiff is importable', `Got ${typeof computeVersionDiff}`);
    }
    
    // Test 10: Version.countDocuments() runs without error
    try {
        const count = await Version.countDocuments();
        console.log(`   Version collection count: ${count}`);
        pass('Version.countDocuments() runs without error');
    } catch (err) {
        fail('Version.countDocuments() runs without error', err.message);
    }
    
    // Cleanup
    await mongoose.disconnect();
    
    // Summary
    console.log('\n=====================================');
    console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
    
    if (failCount === 0) {
        console.log('=== BACKEND WIREUP VERIFICATION COMPLETE ===');
    } else {
        console.log(`WARNING: ${failCount} test(s) failed`);
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
});
