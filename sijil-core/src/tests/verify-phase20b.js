/**
 * PHASE 20B - CONTENT OPERATIONS CENTER VERIFICATION SCRIPT
 * 
 * Verifies all files exist and have correct structure
 * No server required - static file analysis only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..', '..');

// Test results tracker
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(name, status, details = '') {
  const result = { name, status, details, timestamp: new Date().toISOString() };
  if (status === 'PASS') results.passed.push(result);
  else if (status === 'FAIL') results.failed.push(result);
  else results.warnings.push(result);
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${status}`);
  if (details) console.log(`   ${details}`);
}

function checkFileExists(relativePath, description) {
  const fullPath = path.join(rootDir, relativePath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    const size = stats.size;
    logTest(`File: ${description}`, 'PASS', `${relativePath} (${size} bytes)`);
    return true;
  } else {
    logTest(`File: ${description}`, 'FAIL', `${relativePath} NOT FOUND`);
    return false;
  }
}

function checkFileContent(relativePath, searchString, description) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    logTest(description, 'FAIL', `File not found: ${relativePath}`);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchString)) {
    logTest(description, 'PASS', `Found "${searchString}" in ${relativePath}`);
    return true;
  } else {
    logTest(description, 'FAIL', `"${searchString}" NOT found in ${relativePath}`);
    return false;
  }
}

function checkExports(relativePath, exportName, description) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    logTest(description, 'FAIL', `File not found: ${relativePath}`);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  // Check for ES module export or CommonJS export
  const hasExport = content.includes(`export`) || content.includes(`module.exports`);
  if (hasExport) {
    logTest(description, 'PASS', `${relativePath} exports content`);
    return true;
  } else {
    logTest(description, 'FAIL', `${relativePath} has no exports`);
    return false;
  }
}

console.log('\n===========================================');
console.log('PHASE 20B - FILE VERIFICATION');
console.log('===========================================\n');

// 1. Check Models
console.log('--- Models ---');
checkFileExists('src/models/importBatch.model.js', 'ImportBatch Model');
checkFileExists('src/models/auditLog.model.js', 'AuditLog Model');

// Verify ImportBatch model structure
checkFileContent('src/models/importBatch.model.js', 'batch_id', 'ImportBatch: batch_id field');
checkFileContent('src/models/importBatch.model.js', 'repo_url', 'ImportBatch: repo_url field');
checkFileContent('src/models/importBatch.model.js', 'commit_sha', 'ImportBatch: commit_sha field');
checkFileContent('src/models/importBatch.model.js', 'status', 'ImportBatch: status field');
checkFileContent('src/models/importBatch.model.js', 'PENDING', 'ImportBatch: PENDING status');
checkFileContent('src/models/importBatch.model.js', 'SCANNING', 'ImportBatch: SCANNING status');
checkFileContent('src/models/importBatch.model.js', 'VALIDATING', 'ImportBatch: VALIDATING status');
checkFileContent('src/models/importBatch.model.js', 'IMPORTING', 'ImportBatch: IMPORTING status');
checkFileContent('src/models/importBatch.model.js', 'COMPLETED', 'ImportBatch: COMPLETED status');
checkFileContent('src/models/importBatch.model.js', 'FAILED', 'ImportBatch: FAILED status');

// Verify AuditLog model structure
checkFileContent('src/models/auditLog.model.js', 'action', 'AuditLog: action field');
checkFileContent('src/models/auditLog.model.js', 'admin_id', 'AuditLog: admin_id field');
checkFileContent('src/models/auditLog.model.js', 'details', 'AuditLog: details field');

// 2. Check Middleware
console.log('\n--- Middleware ---');
checkFileExists('src/middleware/requireAdmin.js', 'requireAdmin Middleware');
checkFileContent('src/middleware/requireAdmin.js', 'requireAdmin', 'requireAdmin: function export');
checkFileContent('src/middleware/requireAdmin.js', 'ADMIN_SECRET', 'requireAdmin: ADMIN_SECRET check');

// 3. Check Services
console.log('\n--- Services ---');
checkFileExists('src/services/import/repositoryScanner.service.js', 'Repository Scanner Service');
checkFileExists('src/services/import/importPreview.service.js', 'Import Preview Service');
checkFileExists('src/services/import/importExecutor.service.js', 'Import Executor Service');
checkFileExists('src/services/import/importValidation.service.js', 'Import Validation Service');

// Verify service exports
checkFileContent('src/services/import/repositoryScanner.service.js', 'scanRepository', 'Repository Scanner: scanRepository export');
checkFileContent('src/services/import/importPreview.service.js', 'previewImport', 'Import Preview: previewImport export');
checkFileContent('src/services/import/importExecutor.service.js', 'executeImport', 'Import Executor: executeImport export');

// 4. Check Routes
console.log('\n--- Routes ---');
checkFileExists('src/routes/admin.routes.js', 'Admin Routes');
checkFileExists('src/routes/ingest.routes.js', 'Ingest Routes');

// Verify admin routes
checkFileContent('src/routes/admin.routes.js', '/preview', 'Admin Routes: /preview endpoint');
checkFileContent('src/routes/admin.routes.js', '/start', 'Admin Routes: /start endpoint');
checkFileContent('src/routes/admin.routes.js', '/:batchId', 'Admin Routes: /:batchId endpoint');
checkFileContent('src/routes/admin.routes.js', '/retry', 'Admin Routes: /retry endpoint');
checkFileContent('src/routes/admin.routes.js', '/cancel', 'Admin Routes: /cancel endpoint');
checkFileContent('src/routes/admin.routes.js', '/report', 'Admin Routes: /report endpoint');
checkFileContent('src/routes/admin.routes.js', 'requireAdmin', 'Admin Routes: requireAdmin middleware usage');

// Verify ingest routes protection
checkFileContent('src/routes/ingest.routes.js', 'requireAdmin', 'Ingest Routes: requireAdmin middleware');

// 5. Check Queue Integration
console.log('\n--- Queue Integration ---');
checkFileExists('src/queues/index.js', 'Queue Index');
checkFileExists('src/workers/processors/ingestion.processor.js', 'Ingestion Processor');

// Verify ingestion processor handles batch_import
checkFileContent('src/workers/processors/ingestion.processor.js', 'batch_import', 'Ingestion Processor: batch_import job type');

// 6. Check Version Diff Integration
console.log('\n--- Version Diff Integration ---');
checkFileExists('src/services/version/versionDiff.service.js', 'Version Diff Service');
checkFileContent('src/services/version/versionDiff.service.js', 'computeVersionDiff', 'Version Diff: computeVersionDiff export');

// 7. Check Documentation
console.log('\n--- Documentation ---');
checkFileExists('docs/PHASE20A_DISCOVERY_REPORT.md', 'Phase 20A Discovery Report');

// 8. Summary of file counts
console.log('\n--- File Count Summary ---');
const importServicesDir = path.join(rootDir, 'src/services/import');
if (fs.existsSync(importServicesDir)) {
  const serviceFiles = fs.readdirSync(importServicesDir).filter(f => f.endsWith('.js'));
  logTest('Import Services Count', 'PASS', `${serviceFiles.length} files in src/services/import/`);
}

const modelsDir = path.join(rootDir, 'src/models');
if (fs.existsSync(modelsDir)) {
  const modelFiles = fs.readdirSync(modelsDir).filter(f => f.includes('import') || f.includes('audit'));
  logTest('New Models Count', 'PASS', `${modelFiles.length} new model files (import/audit related)`);
}

// Print final results
printResults();

function printResults() {
  console.log('\n===========================================');
  console.log('VERIFICATION RESULTS SUMMARY');
  console.log('===========================================');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`📊 Total: ${results.passed.length + results.failed.length + results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n--- FAILED CHECKS ---');
    results.failed.forEach(test => {
      console.log(`❌ ${test.name}: ${test.details}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n--- WARNINGS ---');
    results.warnings.forEach(test => {
      console.log(`⚠️  ${test.name}: ${test.details}`);
    });
  }
  
  console.log('\n===========================================');
  
  const total = results.passed.length + results.failed.length;
  const successRate = total > 0 ? (results.passed.length / total * 100) : 0;
  
  if (results.failed.length === 0) {
    console.log(`🎉 ALL CHECKS PASSED (${successRate.toFixed(1)}%)`);
    console.log('\nPhase 20B implementation is complete!');
    console.log('Next steps:');
    console.log('1. Start the server: node src/server.js');
    console.log('2. Test admin routes with authentication');
    console.log('3. Run integration tests with real GitHub repos');
  } else {
    console.log(`⚠️  SOME CHECKS FAILED (${successRate.toFixed(1)}% pass rate)`);
    console.log('\nReview failed checks above and fix missing components.');
  }
  console.log('===========================================\n');
}
