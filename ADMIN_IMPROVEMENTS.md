# Admin & Re-ingestion Improvements - Implementation Summary

## Overview
This update adds critical admin visibility, duplicate detection with controlled re-ingestion, and beautiful document browsing capabilities to the Sijil platform.

## Features Implemented

### 1. Duplicate Detection & Controlled Re-ingestion ✅

**Problem:** Users accidentally re-ingest the same content, creating duplicates without warning.

**Solution:**
- Early duplicate detection before processing begins
- Clear warning message when duplicate is detected
- Options to preview existing content or force re-ingestion
- Returns helpful response with links to existing document

**Files Modified:**
- `sijil-core/src/services/ingestion/ingestDocument.service.js`
  - Added early duplicate check (lines 158-191)
  - Returns structured response with preview_url and actions
  
- `sijil-core/src/controllers/ingest.controller.js`
  - Added `?reingest=true` query parameter support
  - Returns 409 Conflict status for duplicates with action links
  - Supports `existing_document_id` in request body

**API Response Example (Duplicate):**
```json
{
  "success": false,
  "status": "duplicate",
  "message": "Document already exists. Use re-ingestion flag to override.",
  "existing_document": {
    "_id": "...",
    "document_id": "doc_abc123",
    "slug": "chemistry/chapter-1",
    "title": "Chemistry Chapter 1",
    "preview_url": "/topics/book/chemistry/chapter-1"
  },
  "actions": {
    "preview": "/topics/book/chemistry/chapter-1",
    "reingest_override": "/api/ingest/json?reingest=true",
    "admin_view": "/admin/documents/doc_abc123"
  }
}
```

### 2. Admin Documents Management UI ✅

**Problem:** No way to see all ingested documents with preview links in one place.

**Solution:**
- New `/admin/documents` page showing all documents
- Paginated list with title, slug, topic count, created date
- Direct preview links to view full book
- Detail view for each document showing all topics
- Each topic has preview link to see real-time rendering

**Files Created:**
- `sijil-core/src/routes/admin-documents.routes.js` (NEW)
  - `GET /admin/documents` - List all documents with pagination
  - `GET /admin/documents/:documentId` - Get document details with topics

- `sijil-studio/sijil-frontend/src/app/admin/documents/page.tsx` (NEW)
  - Document list with search and pagination
  - Preview buttons for each document
  - Topic count badges

- `sijil-studio/sijil-frontend/src/app/admin/documents/[documentId]/page.tsx` (NEW)
  - Document metadata display
  - Complete topic list with order
  - Preview links for each topic
  - "View Full Book" button

**Files Modified:**
- `sijil-core/src/routes/admin.routes.js`
  - Mounted `/admin/documents` routes
  
- `sijil-studio/sijil-frontend/src/components/admin/admin-sidebar.tsx`
  - Added "Documents" navigation item with BookOpen icon

### 3. Beautiful Book Viewing ✅

**Features:**
- Full book preview at `/topics/book/{slug_global}`
- Topic-by-topic navigation
- All content rendered beautifully with:
  - Formulas (KaTeX)
  - Figures (with captions)
  - Tables (styled)
  - Callouts (color-coded)
  - Flashcards (interactive flip)
  - FAQ (expandable)
  - Related topics
  - Previous/Next navigation

**Existing Components Used:**
- `ContentBlockRenderer` - Renders all block types
- `FlashcardDeck` - Interactive flashcards
- `FaqSection` - FAQ accordion
- `RelatedTopicsBlock` - Cross-links
- `TopicStructuredData` - JSON-LD for SEO

## Usage Guide

### Preventing Accidental Re-ingestion

When you try to ingest a document that already exists:

1. **Automatic Detection:** System detects duplicate by content hash
2. **Warning Response:** Get 409 status with existing document info
3. **Options:**
   - Click "Preview" to see existing content
   - Click "Admin View" to see details
   - Add `?reingest=true` to force re-ingestion (creates new version)

### Viewing All Documents

1. Go to **Admin → Documents** (`/admin/documents`)
2. See list of all ingested books/documents
3. Click "Preview" to open full book in new tab
4. Click "Details" to see all topics

### Viewing Individual Topics

From document details page:
1. See ordered list of all topics
2. Click "Preview" on any topic to see rendering
3. Click "View Topic" to go to topic page directly

### Forcing Re-ingestion

If you need to re-ingest updated content:

**Via API:**
```bash
POST /api/ingest/json?reingest=true
{
  "your_json_payload": {...}
}
```

**Via Admin UI:**
1. Go to document details
2. Note the document_id
3. Use ingest endpoint with `existing_document_id` parameter

## Testing

### Test Duplicate Detection
```bash
# First ingestion (should succeed)
curl -X POST http://localhost:4000/api/ingest/json \
  -H "Authorization: Bearer your_admin_secret" \
  -H "Content-Type: application/json" \
  -d @chapter1.json

# Second ingestion (should return 409 with duplicate warning)
curl -X POST http://localhost:4000/api/ingest/json \
  -H "Authorization: Bearer your_admin_secret" \
  -H "Content-Type: application/json" \
  -d @chapter1.json

# Force re-ingestion (should succeed and create v2)
curl -X POST "http://localhost:4000/api/ingest/json?reingest=true" \
  -H "Authorization: Bearer your_admin_secret" \
  -H "Content-Type: application/json" \
  -d @chapter1.json
```

### Test Admin UI
1. Start frontend: `cd sijil-studio/sijil-frontend && npm run dev`
2. Start backend: `cd sijil-core && node src/server.js`
3. Go to `http://localhost:3000/admin/documents`
4. Verify document list loads
5. Click preview links to verify rendering
6. Click details to see topic list

## Files Changed Summary

### Backend (sijil-core)
| File | Type | Description |
|------|------|-------------|
| `src/routes/admin-documents.routes.js` | NEW | Document listing API endpoints |
| `src/routes/admin.routes.js` | MODIFIED | Mount documents routes |
| `src/services/ingestion/ingestDocument.service.js` | MODIFIED | Early duplicate detection |
| `src/controllers/ingest.controller.js` | MODIFIED | Re-ingestion flag support |

### Frontend (sijil-studio/sijil-frontend)
| File | Type | Description |
|------|------|-------------|
| `src/app/admin/documents/page.tsx` | NEW | Documents list page |
| `src/app/admin/documents/[documentId]/page.tsx` | NEW | Document detail page |
| `src/components/admin/admin-sidebar.tsx` | MODIFIED | Added Documents nav item |

## Next Steps

1. **Test the duplicate detection** by importing the same file twice
2. **Browse documents** via the new admin UI
3. **Preview full books** to verify beautiful rendering
4. **Use re-ingestion** when you need to update existing content

## Notes

- Duplicate detection uses content hash (SHA256)
- Re-ingestion creates new version (version chain maintained)
- Old versions are archived but not deleted
- Preview links open in new tabs for better UX
- All admin pages require ADMIN_SECRET authentication
