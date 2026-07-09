# Sijil Testing Guide

## Quick Start - Run All Tests

```bash
cd sijil-core

# 1. Smoke Test (P0 Fixes Verification) - 30 seconds
node tests/smoke-test-p0-fixes.js

# 2. Backend Wireup Tests - 1 minute
node tests/backendWireup.test.js

# 3. Quran Integration Tests (if you have Quran data) - 2 minutes
node tests/quranIntegration.test.js

# 4. GEO Population Tests - 1 minute
node tests/geoPopulation.test.js

# 5. Export & Analytics Tests - 1 minute
node tests/exportAndAnalytics.test.js
```

## Test Categories

### A. Unit/Smoke Tests (No Data Required)
These test code structure and imports:

| Test File | What It Tests | Duration |
|-----------|---------------|----------|
| `tests/smoke-test-p0-fixes.js` | SEO/GEO/FAQ schema fields, structural validation service | 30s |
| `tests/backendWireup.test.js` | Search worker, slug redirects, version records | 1m |
| `src/tests/test-imports.js` | Basic module imports | 10s |

### B. Integration Tests (Requires MongoDB Connection)
These test actual database operations:

| Test File | What It Tests | Duration |
|-----------|---------------|----------|
| `tests/quranIntegration.test.js` | Full ingestion pipeline with Quran data | 2m |
| `tests/geoPopulation.test.js` | GEO field population from callouts | 1m |
| `tests/exportAndAnalytics.test.js` | Export workflows, analytics tracking | 1m |
| `tests/quranApi.test.js` | API endpoints for Quran content | 1m |
| `tests/quranExtraction.test.js` | Extraction logic validation | 1m |
| `tests/quranSeed.test.js` | Seed data integrity | 1m |

### C. Manual Test Scripts
Run these after importing real chapter data:

| Script | Purpose |
|--------|---------|
| `src/tests/phase9-integration.js` | Full Phase 9 integration check |
| `src/tests/pre-phase10-sprint.js` | Pre-Phase 10 readiness |
| `src/tests/test-reingestion-workflow.js` | Re-ingestion idempotency |

## Running After Data Import

After importing a chapter (e.g., Chemistry Chapter 1), verify:

```bash
# Check topic count in DB
node -e "import('./src/models/topic.model.js').then(m => m.default.countDocuments().then(c => console.log('Topics:', c)))"

# Check content blocks
node -e "import('./src/models/topicContent.model.js').then(m => m.default.aggregate([{'\$group': {_id: null, totalBlocks: {'\$sum': '\$content_blocks.length'}}}]).then(r => console.log('Total blocks:', r[0]?.totalBlocks || 0))"

# Check flashcards persisted
node -e "import('./src/models/topicContent.model.js').then(m => m.default.aggregate([{'\$unwind': '\$faq'}, {'\$count': 'faqCount'}]).then(r => console.log('FAQ items:', r[0]?.faqCount || 0))"
```

## Expected Results After P0 Fixes

When you import a properly structured chapter JSON:

| Feature | Before Fix | After Fix | How to Verify |
|---------|------------|-----------|---------------|
| SEO metadata | ❌ Not persisted | ✅ In DB | Check `topics.seo` field |
| GEO data | ❌ Not persisted | ✅ In DB | Check `topics.geo.llm_summary` |
| Flashcards | ❌ Lost | ✅ Persisted | Check `topic_assessments` collection |
| FAQ | ❌ Lost | ✅ In `topic_content.faq` | Query TopicContent |
| Design theme | ❌ Lost | ✅ `design_meta.primary_color_theme` | Frontend renders with color |
| Formula index | ❌ Empty | ✅ Populated (if formulas exist) | Check `formula_index` collection |
| Junk topics | ❌ Imported | ⚠️ Warned/Filtered | Check logs for validation warnings |
| Duplicate content | ❌ Silent | ❌ Blocked | Import fails on duplicate hashes |

## Python Validation Script

Before importing any chapter JSON:

```bash
python sijil-core/scripts/validate_chapter_json.py path/to/chapter.json
```

This checks:
- ✅ No duplicate topic content
- ✅ Valid section numbers (1.1, 1.2, etc.)
- ✅ Block type diversity (not 100% paragraphs)
- ✅ No junk topics (table cells, units)
- ✅ Schema compliance

## Frontend Testing (Manual)

After importing data, visit:

1. **Topic Page**: `http://localhost:3000/topics/chemistry/essential-ideas/chemistry-in-context`
   - Should show flashcards section (violet theme)
   - Should show FAQ section (emerald theme)
   - Should show GEO summary under title
   - Meta title/description should be custom (not "Learn about X")

2. **Search**: `http://localhost:3000/search?q=chemistry`
   - Should find topics by keywords
   - Should find formulas (if any exist)

3. **Admin Unresolved Links**: `http://localhost:4000/admin/unresolved-links`
   - Shows pending link resolutions

## CI/CD Ready Test Command

For automated testing:

```bash
#!/bin/bash
set -e

cd sijil-core

echo "Running smoke tests..."
node tests/smoke-test-p0-fixes.js

echo "Running backend wireup tests..."
node tests/backendWireup.test.js

echo "All tests passed!"
```

## Troubleshooting

### Test fails with "Cannot connect to MongoDB"
- Check `.env` file has correct `MONGODB_URI`
- Ensure network access to Atlas cluster

### Test fails with "Module not found"
- Run `npm install` in sijil-core
- Check Node.js version (should be 20+)

### Import succeeds but frontend shows empty sections
- Re-import the chapter (old data lacks new fields)
- Check browser console for errors
- Verify `topic.seo`, `topic.geo` exist in MongoDB Compass

## Test Coverage Summary

| Component | Tests Passing | Coverage |
|-----------|---------------|----------|
| Models (Topic, TopicContent, FormulaIndex) | ✅ | Schema + CRUD |
| Services (Validation, GEO, SEO) | ✅ | Business logic |
| Workers (Search indexing) | ✅ | Queue processing |
| Middleware (Slug redirects) | ✅ | Request handling |
| API Endpoints | ✅ | Response shapes |
| Frontend Components | ⚠️ Partial | Need more component tests |

**Total: 7 existing test files + 1 new smoke test = 8 test suites**
