# SIJIL Import System - Problem Analysis & Fixes

## Summary of Issues Found

You reported multiple problems with the import system:
1. **Frontend errors** when entering GitHub URL (especially `/blob/` URLs)
2. **"Objects are not valid as a React child"** error on import status page
3. **Backend working but frontend not synced** - data inconsistency
4. **Redis connection timeouts** causing worker failures
5. **Confusion about the flow** between frontend, backend, and workers

## Root Causes Identified

### 1. GitHub URL Parsing Issue ❌
**Problem**: The `parseRepoUrl()` function in `repositoryScanner.service.js` didn't handle GitHub `/blob/` URLs (single file view URLs).

**Your URL**: `https://github.com/koure-onyx/chemestry-e2/blob/main/data/ingested/openstax-chemistry-2e-ch11.json`

This is a **single file URL**, not a repository URL. The system expects a repository root URL like:
- `https://github.com/koure-onyx/chemestry-e2` 
- `https://github.com/koure-onyx/chemestry-e2/tree/main`

**Fix Applied**: Updated `parseRepoUrl()` to extract repo info from `/blob/` URLs by ignoring the file path and just using owner/repo/branch.

### 2. React Render Error - "Objects are not valid as a React child" ❌
**Problem**: The backend returns `progress` as an object with nested structure:
```javascript
progress: {
  scanning: { status: '...', percentage: 50 },
  validating: { status: '...', percentage: 30 },
  importing: { status: '...', percentage: 20 },
  indexing: { status: '...', percentage: 0 }
}
```

But the frontend's `ImportProgress` component tried to render it directly as `<Progress value={status.progress} />`, which expects a number.

**Fix Applied**: 
- Modified `import-progress.tsx` to calculate average progress from the object
- Added safe null checking for `counts` object
- Added safe error rendering

### 3. API Response Structure Mismatch ❌
**Problem**: The backend's `/admin/import/:batchId` route was returning raw MongoDB objects which could have undefined values.

**Fix Applied**: Updated the route to:
- Calculate progress as a single number (average of all stages)
- Provide default values (`|| 0`) for all count fields
- Ensure arrays default to empty arrays (`|| []`)

### 4. Missing Environment Configuration ❌
**Problem**: No `.env` files existed, causing:
- GitHub PAT not available → API calls fail
- ADMIN_SECRET not configured → warnings in logs (but works in dev mode)
- Redis/MongoDB URLs might be wrong

**Fix Applied**: Created `.env` files with proper configuration including your GitHub PAT.

## How The System Works (Complete Flow)

### Frontend → Backend → Worker Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│  Frontend   │      │   Backend    │      │    Redis    │      │   Workers    │
│  (Next.js)  │─────▶│  (Express)   │─────▶│   (Queue)   │─────▶│ (Processors) │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────────┘
       │                      │                       │                    │
       │ 1. Preview Request   │                       │                    │
       │─────────────────────▶│                       │                    │
       │                      │ 2. Scan GitHub Repo   │                    │
       │                      │ (read-only, no ingest)│                    │
       │ 3. Return Preview    │                       │                    │
       │◀─────────────────────│                       │                    │
       │                      │                       │                    │
       │ 4. Start Import      │                       │                    │
       │─────────────────────▶│                       │                    │
       │                      │ 5. Create Batch Record│                    │
       │                      │ 6. Add Job to Queue  ─│───────────────────▶│
       │ 7. Return Batch ID   │                       │                    │
       │◀─────────────────────│                       │                    │
       │                      │                       │                    │
       │ 8. Poll Status       │                       │                    │
       │─────────────────────▶│                       │                    │
       │                      │ 9. Read Batch Status  │                    │
       │◀─────────────────────│                       │                    │
       │                      │                       │                    │
       │                      │          Workers process jobs:             │
       │                      │                       │                    │
       │                      │                       │ 10. Fetch File     │
       │                      │                       │◀───────────────────│
       │                      │                       │ 11. Validate JSON  │
       │                      │                       │ 12. Save to MongoDB│
       │                      │                       │ 13. Update Progress│
       │                      │                       │                    │
```

### Step-by-Step Breakdown

#### Phase 1: Preview (Read-Only)
1. **User enters GitHub URL** in `/admin/import` page
2. **Frontend calls** `POST /api/admin/import/preview` with `{ repo_url }`
3. **Backend**:
   - Parses URL to get owner/repo/branch
   - Calls GitHub API to list all files
   - Downloads each JSON file
   - Validates schema
   - Creates `ImportBatch` record in `PENDING` state
   - Returns preview: `{ batch_id, documents_found, topics_found, files_preview }`
4. **Frontend shows** preview with file list and counts

#### Phase 2: Import (Async Processing)
5. **User clicks "Start Import"**
6. **Frontend calls** `POST /api/admin/import/start` with `{ batch_id }`
7. **Backend**:
   - Updates batch status to `IMPORTING`
   - Adds job to `ingestionQueue` (Redis/BullMQ)
   - Returns immediately with `{ batch_id, status: 'QUEUED' }`
8. **Frontend redirects** to `/admin/import/{batchId}`

#### Phase 3: Background Processing
9. **Worker** (separate process) picks up job from queue
10. **Worker processes** each file:
    - Downloads from GitHub
    - Validates JSON schema
    - Saves Document → Topics → Content Blocks → Assets → Assessments to MongoDB
    - Updates batch progress after each file
11. **Worker completes** → sets batch status to `COMPLETED` or `FAILED`

#### Phase 4: Status Polling
12. **Frontend polls** `GET /api/admin/import/{batchId}` every 2 seconds
13. **Backend reads** batch record from MongoDB
14. **Frontend displays** progress bar and counts
15. **When complete**, shows final report

## Critical Requirements

### 1. Redis MUST Be Running
All workers depend on Redis for the queue system. If Redis is down:
- Workers can't connect → `connect ETIMEDOUT` errors
- Jobs stay queued forever
- Import never progresses

**Check Redis**:
```bash
redis-cli ping
# Should return: PONG
```

**Start Redis** (if not running):
```bash
redis-server
# or with Docker:
docker run -d -p 6379:6379 redis:alpine
```

### 2. MongoDB MUST Be Running
All data is stored in MongoDB. If Mongo is down:
- Can't create batch records
- Can't save imported documents
- Routes return errors

**Check MongoDB**:
```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

### 3. Correct URL Format
**DO use**:
- `https://github.com/koure-onyx/chemestry-e2`
- `https://github.com/koure-onyx/chemestry-e2/tree/main`
- `koure-onyx/chemestry-e2`

**DON'T use** (single file URLs):
- `https://github.com/koure-onyx/chemestry-e2/blob/main/file.json` ❌
- Though now supported, it will scan the ENTIRE repo, not just that file

## Files Modified

### Backend Changes
1. **`sijil-core/src/services/import/repositoryScanner.service.js`**
   - Added support for `/blob/` URLs in `parseRepoUrl()`

2. **`sijil-core/src/routes/admin.routes.js`**
   - Fixed `/admin/import/:batchId` route to return normalized progress (number)
   - Added default values for all fields to prevent undefined

3. **`sijil-core/.env`** (created)
   - Added GitHub PAT
   - Configured Redis/MongoDB URLs
   - Left ADMIN_SECRET empty for dev mode

### Frontend Changes
1. **`sijil-studio/sijil-frontend/src/components/admin/import-progress.tsx`**
   - Handle `progress` as object or number
   - Calculate average progress from stages
   - Safe null checking for counts
   - Safe error rendering

2. **`sijil-studio/sijil-frontend/.env.local`** (created)
   - Set API base URL to `http://localhost:4000/api`

## Testing Steps

### 1. Start Dependencies
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: MongoDB (if using local)
mongod

# Or with Docker Compose (if you have docker-compose.yml)
docker-compose up -d redis mongodb
```

### 2. Start Backend
```bash
cd sijil-core
npm install
npm run dev
# Should start on http://localhost:4000
```

### 3. Start Frontend
```bash
cd sijil-studio/sijil-frontend
npm install
npm run dev
# Should start on http://localhost:3000
```

### 4. Test Import Flow
1. Go to `http://localhost:3000/admin/import`
2. Enter URL: `https://github.com/koure-onyx/chemestry-e2`
3. Click "Preview Import"
4. Wait for preview (may take 30-60 seconds for large repos)
5. Review file list
6. Click "Start Import"
7. Watch progress on status page
8. Wait for completion (watch backend logs for worker activity)

## Common Errors & Solutions

### Error: "connect ETIMEDOUT"
**Cause**: Redis not running or unreachable
**Solution**: Start Redis server

### Error: "Invalid GitHub repository URL format"
**Cause**: Malformed URL
**Solution**: Use format `https://github.com/owner/repo`

### Error: "GitHub API error: 401"
**Cause**: Invalid/missing GitHub PAT
**Solution**: Check `GITHUB_PAT` in `.env`

### Error: "Objects are not valid as a React child"
**Cause**: Progress object rendered directly
**Solution**: Already fixed in this PR

### Error: "Failed to fetch"
**Cause**: Backend not running or wrong API URL
**Solution**: 
- Check backend is running on port 4000
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

## Next Steps

1. **Ensure Redis is running** before starting backend
2. **Ensure MongoDB is running** before starting backend
3. **Start backend first**, wait for "Server listening" message
4. **Start frontend** after backend is ready
5. **Use repository root URL**, not single file URL
6. **Watch both frontend and backend logs** for debugging

## Architecture Notes

### Why Two Separate Apps?
- **Backend** (`sijil-core`): Express + MongoDB + Redis + BullMQ workers
- **Frontend** (`sijil-studio/sijil-frontend`): Next.js 14 + React Query
- They communicate via REST API at `http://localhost:4000/api`

### Why Workers?
- Importing large JSON files is slow (can take minutes)
- Can't block HTTP request during import
- Workers process asynchronously in background
- User can close browser, import continues

### Why Redis?
- BullMQ uses Redis as message broker
- Jobs are stored in Redis queues
- Workers poll Redis for new jobs
- Progress updates stored in Redis temporarily

## Support

If issues persist:
1. Check both frontend and backend console logs
2. Verify Redis and MongoDB are running
3. Ensure `.env` files are properly configured
4. Try with a smaller test repository first
