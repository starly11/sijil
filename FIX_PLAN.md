# SIJIL Import & Preview Fix Plan

## Problem Analysis

### Current Issues:
1. **No preview of ingested content** - Data is ingested but not visible in UI
2. **Mock data being shown** - Frontend shows mock data instead of real API data
3. **Missing preview option after ingestion** - Admin page doesn't show preview of imported books/topics
4. **Single document ingestion is a stub** - `ingestion.processor.js` has mock delays instead of real processing

### Root Causes:

#### 1. Ingestion Worker Stub (CRITICAL)
File: `sijil-core/src/workers/processors/ingestion.processor.js`
- Lines 17-35: Single document ingestion is FAKE (just setTimeout delays)
- Only batch_import flow (lines 89+) actually calls `ingestDocument()`

#### 2. Missing Preview Routes
- No route to preview a document with its topics before publishing
- Admin import status shows progress but no content preview

#### 3. Frontend Using Mock Data
- Topic pages may be falling back to mock data when API fails
- Need to verify API endpoints are returning real data

## Solution Architecture

### Phase 1: Fix Ingestion Worker
**File**: `sijil-core/src/workers/processors/ingestion.processor.js`

Replace the fake single-document flow with real ingestion:

```javascript
// OLD (fake):
await job.updateProgress(10);
await new Promise((resolve) => setTimeout(resolve, 300));
await job.updateProgress(50);
await new Promise((resolve) => setTimeout(resolve, 300));
await job.updateProgress(100);
return { status: 'completed', note: "Phase 5 infrastructure..." };

// NEW (real):
const result = await ingestDocument({
    payload: job.data.payload,
    source: job.data.source || 'queue_ingestion'
});
return result;
```

### Phase 2: Add Document Preview Route
**File**: `sijil-core/src/routes/admin.routes.js`

Add new endpoint:
```javascript
/**
 * GET /admin/preview/:documentId
 * Preview document with all topics for admin review
 */
router.get('/preview/:documentId', requireAdmin, async (req, res, next) => {
    try {
        const { documentId } = req.params;
        
        const doc = await Document.findOne({ 
            $or: [{ document_id: documentId }, { _id: documentId }]
        });
        
        if (!doc) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }
        
        // Get all topics for this document
        const topics = await Topic.find({ document_id: doc.document_id })
            .sort({ display_order: 1 })
            .lean();
        
        // Get topic counts
        const topicIds = topics.map(t => t._id);
        const [contentBlocks, assets, assessments] = await Promise.all([
            TopicContent.countDocuments({ topic_id: { $in: topicIds } }),
            TopicAsset.countDocuments({ topic_id: { $in: topicIds } }),
            TopicAssessment.countDocuments({ topic_id: { $in: topicIds } })
        ]);
        
        return res.status(200).json({
            success: true,
            data: {
                document: doc,
                topics: topics.map(t => ({
                    ...t,
                    stats: {
                        content_blocks: contentBlocks,
                        assets: assets,
                        assessments: assessments
                    }
                })),
                total_topics: topics.length
            }
        });
        
    } catch (error) {
        logger.error({ err: error }, 'Preview failed');
        next(error);
    }
});
```

### Phase 3: Add Preview Button to Admin Import Status
**File**: `sijil-studio/sijil-frontend/src/components/admin/import-progress.tsx`

Add preview button that opens document preview modal/page when import completes.

### Phase 4: Create Document Preview Component
**File**: `sijil-studio/sijil-frontend/src/components/admin/document-preview.tsx`

New component showing:
- Document metadata
- List of all topics with expandable previews
- Content block samples
- Asset thumbnails
- Assessment summaries

### Phase 5: Fix Frontend API Calls
**File**: `sijil-studio/sijil-frontend/src/app/topics/[[...slug]]/page.tsx`

Ensure it's using real API data, not mock data.

### Phase 6: Add Books/Topics View in Admin
**File**: `sijil-studio/sijil-frontend/src/app/admin/books/page.tsx`

New admin page listing all imported books with:
- Filter by subject/grade
- Preview button for each book
- Topic count
- Import date
- Status badges

## Implementation Priority

1. **CRITICAL**: Fix ingestion worker (single doc flow)
2. **HIGH**: Add preview route
3. **HIGH**: Create preview component
4. **MEDIUM**: Add preview button to import status
5. **MEDIUM**: Create admin books list page
6. **LOW**: Verify all API endpoints return real data

## Testing Checklist

- [ ] Single document ingestion works via queue
- [ ] Batch import processes all files correctly
- [ ] Preview route returns document + topics
- [ ] Admin can preview imported books
- [ ] Topic pages render real content (not mock)
- [ ] Books list shows all imported documents
- [ ] Click preview shows full document structure
