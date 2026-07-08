# SIJIL Backend Architecture Review
## Production Readiness Assessment & Resilience Redesign

**Document Version:** 1.0  
**Review Date:** 2026-07-07  
**Reviewer:** Principal Backend Architect  
**Scope:** sijil-core backend only

---

## EXECUTIVE SUMMARY

### Current State
The SIJIL backend is a **functional but fragile** content ingestion platform. It successfully processes educational content from JSON into MongoDB with background job orchestration via BullMQ. However, the architecture exhibits **tight coupling** and **cascading failure patterns** that make it unsuitable for production workloads.

### Critical Issues Identified
1. **Single Point of Failure:** Batch import processor blocks entire workflow on single file failure
2. **No Circuit Breakers:** External API failures (GitHub) cascade through entire system
3. **Fragile Progress Tracking:** Frontend polling creates infinite loops on edge cases
4. **Worker Coupling:** Workers assume implicit ordering and success of other workers
5. **Insufficient Observability:** Logs lack correlation IDs and structured tracing
6. **No Backpressure:** No mechanism to slow down ingestion when downstream is overwhelmed

### Recommended Priority
**CRITICAL:** Items in Phase 1 must be addressed before any production deployment.

---

## 1. HIGH-LEVEL ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Import Dashboard│  │ Content Viewer│  │ Admin Panel │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                          │
│         └──────────────────┴──────────────────┘                          │
│                            │                                             │
│                    HTTP/REST API                                         │
└────────────────────────────┼─────────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────────┐
│                      SIJIL-CORE BACKEND (Express)                        │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    CONTROLLER LAYER                             │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │     │
│  │  │  Admin   │ │ Ingest   │ │ Document │ │  Search  │          │     │
│  │  │Controller│ │Controller│ │Controller│ │Controller│          │     │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │     │
│  └───────┼────────────┼────────────┼────────────┼────────────────┘     │
│          │            │            │            │                       │
│  ┌───────▼────────────▼────────────▼────────────▼────────────────┐     │
│  │                     SERVICE LAYER                              │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │     │
│  │  │Import Service│  │Ingest Service│  │ Query Service│         │     │
│  │  │  (Preview)   │  │  (Validate)  │  │  (Read)      │         │     │
│  │  │  (Execute)   │  │  (Normalize) │  │  (Search)    │         │     │
│  │  │  (Report)    │  │  (Persist)   │  │  (Analytics) │         │     │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │     │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┘     │
│            │                 │                 │                        │
│  ┌─────────▼─────────────────▼─────────────────▼────────────────┐     │
│  │                     MODEL LAYER                               │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │     │
│  │  │Document  │ │  Topic   │ │ImportBatch│ │  Version │         │     │
│  │  │  Model   │ │  Model   │ │   Model   │ │  Model   │         │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    QUEUE PRODUCERS                              │     │
│  │     ingestionQueue │ slugResolverQueue │ searchIndexQueue      │     │
│  └────────────────────────────────────────────────────────────────┘     │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
┌─────────────▼──────┐           ┌──────────▼──────────┐
│   Redis (BullMQ)   │           │   MongoDB Cluster   │
│  ┌──────────────┐  │           │  ┌───────────────┐  │
│  │ingestion     │  │           │  │ Documents     │  │
│  │slug-resolver │  │           │  │ Topics        │  │
│  │search-index  │  │           │  │ TopicContent  │  │
│  │export-gen    │  │           │  │ TopicAssets   │  │
│  │image-upload  │  │           │  │ Versions      │  │
│  └──────────────┘  │           │  │ ImportBatches │  │
│                    │           │  └───────────────┘  │
└────────────────────┘           └─────────────────────┘
         │                                │
         │                                │
┌────────▼────────────────────────────────▼────────┐
│              WORKER PROCESSES (Node.js)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Ingestion │ │Slug      │ │Search    │          │
│  │Processor │ │Resolver  │ │Indexer   │          │
│  │          │ │Processor │ │Processor │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐                        │
│  │Export    │ │Image     │                        │
│  │Generator │ │Uploader  │                        │
│  │Processor │ │Processor │                        │
│  └──────────┘ └──────────┘                        │
└───────────────────────────────────────────────────┘
         │
         │
┌────────▼──────────┐
│  GitHub API       │
│  (External)       │
│  - Rate Limited   │
│  - Unreliable     │
│  - 503 Errors     │
└───────────────────┘
```

---

## 2. COMPLETE REQUEST FLOW

### Flow A: Batch Import Preview (Admin triggers repository scan)

```
1. Frontend → POST /api/admin/import/preview
   Payload: { repo_url, github_token }

2. AdminController.importPreview()
   ↓
3. ImportPreviewService.scanRepository()
   ├─→ RepositoryScanner.getRepoTree() [GitHub API]
   │   └─→ GET /repos/{owner}/{repo}/git/trees/main?recursive=1
   ├─→ Filter .json files
   └─→ Sample validation (first 5 files)

4. ImportBatch.create() [MongoDB]
   Status: PENDING → SCANNING → READY

5. Return: { batch_id, total_documents, preview_stats }

6. Frontend polls GET /api/admin/import/:batch_id
   Every 2 seconds via useBatchImportStatus hook
```

### Flow B: Batch Import Execution (Admin clicks "Start Import")

```
1. Frontend → POST /api/admin/import/start
   Payload: { batch_id }

2. AdminController.startImport()
   ↓
3. ImportBatch.update({ status: 'IMPORTING', started_at })
   ↓
4. ingestionQueue.add('batch_import', { batch_id, github_token, retry_only })
   ↓
5. Return immediately: { job_id, status: 'queued' }

6. Worker Process (separate Node.js process)
   └─→ processIngestion(job)
       ├─→ ImportBatch.findOne({ batch_id })
       ├─→ getRepoTree() [GitHub API]
       ├─→ FOR EACH file:
       │   ├─→ fetchGitHubFile() [GitHub Raw API] ⚠️ FAILURE POINT
       │   ├─→ ingestDocument() [SERVICE]
       │   │   ├─→ validateQwenOutput() [Zod Validation]
       │   │   ├─→ computeContentHash()
       │   │   ├─→ checkDuplicate() [MongoDB]
       │   │   ├─→ buildVersionChain() [MongoDB]
       │   │   ├─→ normalizeDocumentPayload()
       │   │   ├─→ buildDocumentRecord()
       │   │   ├─→ persistIngestion() [MongoDB Transaction] ⚠️ FAILURE POINT
       │   │   │   ├─→ Document.save()
       │   │   │   ├─→ Topic.insertMany()
       │   │   │   ├─→ TopicContent.insertMany()
       │   │   │   └─→ Version.create()
       │   │   └─→ Enqueue background jobs:
       │   │       ├─→ slugResolverQueue.add()
       │   │       └─→ searchIndexQueue.add()
       │   └─→ ImportBatch.save() [after EACH file] ⚠️ PERFORMANCE ISSUE
       └─→ ImportBatch.update({ status: COMPLETED/PARTIAL_SUCCESS })
```

### Flow C: Single Document Ingestion (Direct API call)

```
1. Frontend/API → POST /api/ingest
   Payload: { payload: JSON_STRING }

2. IngestController.ingest()
   ↓
3. ingestionQueue.add('single_ingest', { payload, source })
   ↓
4. Return: { tracking_id, status: 'queued' }

5. Worker Process
   └─→ processIngestion(job)
       └─→ ingestDocument() [Same service as batch import]
```

---

## 3. QUEUE FLOW ANALYSIS

### Queue Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    QUEUE: ingestion                         │
│  Producers: AdminController, IngestController               │
│  Consumers: ingestion.processor.js (concurrency: 5)         │
│  Job Types: batch_import, single_ingest                     │
│  Retry Policy: 3 attempts, exponential backoff              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ On Completion
                            ▼
            ┌───────────────┴───────────────┐
            │                               │
┌───────────▼───────────┐     ┌─────────────▼─────────────┐
│  QUEUE: slug-resolver │     │   QUEUE: search-index     │
│  Producer: ingestDoc  │     │   Producer: ingestDoc     │
│  Consumer: 5          │     │   Consumer: 5             │
│  Jobs: resolve:{docId}│     │   Jobs: index:{docId}     │
└───────────┬───────────┘     └─────────────┬─────────────┘
            │                               │
            │                               │
            ▼                               ▼
    ┌───────────────┐             ┌─────────────────┐
    │ SlugRegistry  │             │ Search Index    │
    │ SlugRedirects │             │ (Future: ES)    │
    └───────────────┘             └─────────────────┘
```

### Queue Dependencies Map

| Queue | Depends On Success Of | Triggers Next | Failure Impact |
|-------|----------------------|---------------|----------------|
| ingestion | None (root) | slug-resolver, search-index | BLOCKS all downstream |
| slug-resolver | ingestion (document exists) | None | URLs broken, 404s |
| search-index | ingestion (topics exist) | None | Search returns stale results |
| export-gen | Any (reads from DB) | None | Export fails, user notified |
| image-upload | None (standalone) | assetRegistry | Images missing in content |

### Critical Coupling Issue

**Current Pattern:** `ingestDocument.service.js` directly enqueues downstream jobs:
```javascript
const slugJob = await slugResolverQueue.add(...);
const searchJob = await searchIndexQueue.add(...);
```

**Problem:** If queues are down or Redis is unavailable, the entire ingestion fails even though document persistence succeeded.

**Solution Needed:** Decouple via database state changes or event-driven architecture.

---

## 4. WORKER DEPENDENCIES

### Worker Initialization (`worker.js`)

```javascript
// Boots 5 workers concurrently
bootWorker(QUEUE_NAMES.INGESTION, processIngestion);
bootWorker(QUEUE_NAMES.SLUG_RESOLVER, processSlugResolver);
bootWorker(QUEUE_NAMES.SEARCH_INDEX, processSearchIndex);
bootWorker(QUEUE_NAMES.EXPORT_GEN, processExportGen);
bootWorker(QUEUE_NAMES.IMAGE_UPLOAD, processImageUpload);
```

### Dependency Matrix

| Worker | Requires MongoDB | Requires Redis | Requires External API | Blocks If |
|--------|-----------------|----------------|---------------------|-----------|
| ingestion | ✅ Yes | ✅ Yes | ✅ GitHub API | GitHub timeout |
| slug-resolver | ✅ Yes | ✅ Yes | ❌ No | MongoDB slow |
| search-index | ✅ Yes | ✅ Yes | ❌ No | MongoDB slow |
| export-gen | ✅ Yes | ✅ Yes | ❌ No | Large payload |
| image-upload | ✅ Yes | ✅ Yes | ✅ AWS S3 | S3 timeout |

### Isolation Assessment

**Current State:** ❌ **NOT ISOLATED**

**Issues:**
1. All workers share same Redis connection pool (potential contention)
2. No priority queues (batch import blocks single document ingestion)
3. No rate limiting between workers
4. Workers don't check if dependencies completed successfully

**Example Failure Cascade:**
```
1. ingestion worker fails mid-batch (GitHub 503)
2. Some documents persisted, some not
3. slug-resolver jobs queued for partial data
4. slug-resolver fails (missing topics)
5. No cleanup mechanism
6. Manual intervention required
```

---

## 5. CONTROLLER → SERVICE → MODEL MAPPING

### Complete Mapping Table

| Controller | Method | Service(s) Called | Model(s) Accessed | External APIs |
|------------|--------|-------------------|-------------------|---------------|
| AdminController | importPreview | ImportPreviewService, RepositoryScanner | ImportBatch | GitHub Git Tree API |
| AdminController | startImport | ImportExecutor | ImportBatch, IngestQueue | GitHub Raw API (via worker) |
| AdminController | getBatchStatus | ImportReportService | ImportBatch | None |
| IngestController | ingest | IngestDocumentService | IngestQueue, Document, Topic, Version | None (queuing only) |
| DocumentController | getById | DocumentQueryService | Document, Topic, TopicContent | None |
| DocumentController | getBySlug | SlugRedirectService, DocumentQueryService | SlugRedirect, Document, Topic | None |
| SearchController | search | SearchService, FormulaSearchService | Topic, FailedSearch | None |
| ExportController | generate | ExportService, ContentAggregatorService | ExportJob, ExportPolicy | None |
| UtilityController | analytics | SearchAnalyticsService, TopicAnalyticsService | PopularSearch, PopularTopic | None |

### Observation

**Tight Coupling Alert:** Controllers directly instantiate services which directly access models. No abstraction layer for:
- Caching
- Rate limiting
- Circuit breaking
- Fallback strategies

---

## 6. DATABASE WRITE FLOW

### Atomic Transaction Flow (`persistIngestion.service.js`)

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 1. Archive previous version (if update)
  if (versionInfo.isUpdate) {
    await Document.updateOne(
      { document_metadata.document_id: docId },
      { $set: { 'document_metadata.is_latest': false } },
      { session }
    );
  }

  // 2. Insert Document
  await Document.create([documentRecord], { session });

  // 3. Bulk insert Topics
  if (bundles.topics.length > 0) {
    await Topic.insertMany(bundles.topics, { session });
  }

  // 4. Bulk insert TopicContents
  if (bundles.topicContents.length > 0) {
    await TopicContent.insertMany(bundles.topicContents, { session });
  }

  // 5. Bulk insert TopicAssets
  if (bundles.topicAssets.length > 0) {
    await TopicAsset.insertMany(bundles.topicAssets, { session });
  }

  // 6. Create Version record
  await Version.create([{
    document_id: bundles.documentId,
    version_number: versionInfo.documentVersion,
    content_hash: contentHash,
    parent_version_id: versionInfo.parentDocumentId
  }], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Write Pattern Analysis

**Strengths:**
- ✅ Uses transactions for atomicity
- ✅ Bulk operations where possible
- ✅ Proper error handling

**Weaknesses:**
- ❌ No retry logic on transaction failures
- ❌ No timeout on long-running transactions
- ❌ No dead letter queue for failed writes
- ❌ Blocking: Entire batch waits for slowest document

**Performance Bottleneck:**
Each file in batch import triggers:
- 1 transaction (6+ writes)
- 2 queue additions (slug + search)
- 1 ImportBatch save

For 21 files: 21 transactions, 42 queue ops, 21 batch saves = **85 database operations**

---

## 7. IMPORT LIFECYCLE

### Current State Machine

```
PENDING ──scan──▶ SCANNING ──complete──▶ READY
   │                                       │
   │                                       │ start
   │                                       ▼
   │                                 IMPORTING
   │                                       │
   │                    ┌──────────────────┼──────────────────┐
   │                    │                  │                  │
   │               (success)         (partial)           (failure)
   │                    │                  │                  │
   │                    ▼                  ▼                  ▼
   └──────────── COMPLETED ◀────── PARTIAL_SUCCESS ──── FAILED
                                    │
                                    │ retry
                                    └──────────────┘
```

### Lifecycle Gaps

1. **No CANCELLED state:** Cannot stop running import
2. **No RETRYING state:** Retry happens silently
3. **No QUEUED state:** Import shows IMPORTING before worker picks up
4. **No validation stage:** VALIDATING exists but unused
5. **No indexing stage:** INDEXING exists but never updated

### Missing Transitions

```
Any State ──admin cancel──▶ CANCELLED
FAILED ──auto-retry──▶ QUEUED (with retry count)
IMPORTING ──timeout──▶ FAILED (stalled detection)
```

---

## 8. BACKGROUND TASK LIFECYCLE

### Current Flow

```
Job Added to Queue
       │
       ▼
Worker Picks Up (active event)
       │
       ▼
Processing (progress events: 10%, 50%, 90%)
       │
       ├───Success──▶ Completed (result returned)
       │
       └───Failure──▶ Failed (error logged)
              │
              │ (if attempts < max)
              ▼
         Re-queued (automatic by BullMQ)
```

### Problem: No Orchestration

Each background task is independent with no awareness of:
- Parent batch status
- Sibling task completion
- Overall pipeline health

**Example Issue:**
```
1. File 1/21 succeeds → slug-resolver job queued
2. File 2/21 fails → batch marked PARTIAL_SUCCESS
3. File 3/21 succeeds → another slug-resolver job queued
4. User sees "completed" but slug jobs still running
5. No way to know when ALL dependent jobs finish
```

---

## 9. FAILURE POINTS ANALYSIS

### Single Points of Failure (SPOF)

| Component | Failure Mode | Impact | Recovery |
|-----------|-------------|--------|----------|
| Redis | Connection lost | All queues stop, workers crash | Manual restart |
| MongoDB | Transaction timeout | Partial writes, data inconsistency | Manual cleanup |
| GitHub API | Rate limit (403) or 503 | Batch import hangs indefinitely | Wait 1 hour |
| Worker Process | Crash mid-ingestion | Job stalled, batch stuck | Manual retry |
| Frontend Polling | Infinite loop | Browser memory leak, API spam | Hard refresh |

### Cascading Failure Scenarios

#### Scenario 1: GitHub Rate Limit During Batch Import

```
1. Worker processing file 15/21
2. GitHub returns 403 (rate limit exceeded)
3. fetchGitHubFile() throws error
4. File marked as failed in ImportBatch
5. Worker continues to file 16/21
6. GitHub STILL rate limited → file 16 fails
7. ... all remaining files fail
8. Batch marked PARTIAL_SUCCESS with 6 failures
9. User must manually retry after 1 hour
10. NO automatic backoff or delay
```

**Root Cause:** No rate limit detection, no exponential backoff, no circuit breaker.

#### Scenario 2: MongoDB Slow During High Load

```
1. Multiple batch imports running concurrently
2. MongoDB CPU spikes, queries slow down
3. Transaction timeout (default 30s)
4. persistIngestion() throws error
5. Document NOT saved, but version chain partially built
6. Error logged, job marked failed
7. Retry re-processes same document
8. Duplicate detection may fail (inconsistent state)
9. Data corruption possible
```

**Root Cause:** No timeout configuration, no retry idempotency, no rollback of partial version chains.

#### Scenario 3: Worker Crash Mid-Transaction

```
1. Worker processing file 10/21
2. Inside persistIngestion() transaction
3. Documents inserted, Topics inserting...
4. Worker process killed (OOM, SIGKILL)
5. Transaction NOT committed or aborted
6. MongoDB holds locks, other queries blocked
7. Next worker retry finds partial data
8. Duplicate key errors or inconsistent state
```

**Root Cause:** No graceful shutdown handler, no transaction cleanup on crash.

---

## 10. COUPLING MAP

### Direct Dependencies (Tight Coupling)

```
┌────────────────────┐
│ ingestion.processor│
└──────────┬─────────┘
           │ DIRECTLY CALLS
           ▼
┌────────────────────┐
│ ingestDocument     │
│ .service.js        │
└──────────┬─────────┘
           │ DIRECTLY ENQUES
           ├──────────────┬──────────────┐
           ▼              ▼              ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │slugResolver│ │searchIndex │ │ (future)   │
    │   Queue    │ │   Queue    │ │ analytics  │
    └────────────┘ └────────────┘ └────────────┘

PROBLEM: If ANY queue is down, entire ingestion fails
even though document persistence succeeded.
```

### Implicit Dependencies

| Component | Assumes | Risk |
|-----------|---------|------|
| slug-resolver | Document exists in DB | Returns 404 if ingestion failed |
| search-index | Topics exist in DB | Indexes incomplete data |
| Frontend polling | Batch status updates every 2s | Infinite loop if backend crashes |
| Worker stall recovery | Job data intact in Redis | Marks wrong batch as failed |

### Recommended Decoupling Strategy

Replace direct queue calls with **event-driven state transitions**:

```
CURRENT:
  persistIngestion() → slugQueue.add()

PROPOSED:
  persistIngestion() → Document.status = 'pending_slug'
  Background watcher detects status change → slugQueue.add()
```

---

## 11. RESILIENT INGESTION PIPELINE DESIGN

### Proposed Orchestration Workflow

Instead of linear execution, implement **stage-based orchestration**:

```
┌─────────────────────────────────────────────────────────────┐
│                    BATCH IMPORT WORKFLOW                     │
└─────────────────────────────────────────────────────────────┘

Stage 1: SCAN
  ├─→ Fetch repo tree
  ├─→ Filter JSON files
  ├─→ Create ImportBatch record
  └─→ Status: READY

Stage 2: VALIDATE (NEW)
  ├─→ Sample 5 files
  ├─→ Check schema validity
  ├─→ Estimate processing time
  └─→ Status: VALIDATED or FAILED

Stage 3: PREPARE (NEW)
  ├─→ Reserve rate limit budget
  ├─→ Check MongoDB capacity
  ├─→ Acquire distributed lock
  └─→ Status: PREPARED

Stage 4: INGEST (parallelized)
  ├─→ Split files into chunks of 5
  ├─→ Process chunks in parallel
  ├─→ Each chunk: fetch → validate → persist
  ├─→ Track per-chunk status
  └─→ Status: INGESTING → PARTIAL_SUCCESS or COMPLETED

Stage 5: POST-PROCESS (async, decoupled)
  ├─→ Enqueue slug resolution (all documents)
  ├─→ Enqueue search indexing (all documents)
  ├─→ Enqueue analytics aggregation
  └─→ Status: POST_PROCESSING

Stage 6: FINALIZE
  ├─→ Wait for all post-process jobs
  ├─→ Generate final report
  ├─→ Release distributed lock
  └─→ Status: COMPLETED or PARTIAL_SUCCESS
```

### Stage State Model

Each stage tracked in ImportBatch:

```javascript
progress: {
  scan: {
    status: 'completed',
    started_at: Date,
    completed_at: Date,
    result: { total_files: 21 }
  },
  validate: {
    status: 'completed',
    started_at: Date,
    completed_at: Date,
    result: { valid: true, warnings: 5 }
  },
  ingest: {
    status: 'in_progress',
    started_at: Date,
    current_chunk: 3,
    total_chunks: 5,
    chunks_completed: 2,
    chunks_failed: 0,
    documents_imported: 10,
    documents_failed: 0
  },
  post_process: {
    status: 'pending',
    slug_jobs_queued: 0,
    search_jobs_queued: 0,
    slug_jobs_completed: 0,
    search_jobs_completed: 0
  }
}
```

### Benefits

1. **Resumable:** Can restart from failed stage
2. **Observable:** Clear visibility into each stage
3. **Parallelizable:** Ingest stage runs chunks concurrently
4. **Decoupled:** Post-process doesn't block ingest completion
5. **Rate Limit Aware:** Prepare stage checks quota before starting

---

## 12. BULLMQ USAGE REVIEW

### Current Configuration

```javascript
// createWorker.js
new Worker(queueName, processor, {
  connection: redisClient,
  concurrency: 5,
  settings: {
    maxStalledCount: 1,
    stalledInterval: 30000,
  }
});

// createQueue.js
new Queue(queueName, {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
});
```

### Assessment

| Feature | Current | Production Ready | Gap |
|---------|---------|------------------|-----|
| Concurrency | 5 (fixed) | ❌ No | Should be dynamic based on load |
| Retry Policy | 3 attempts | ⚠️ Partial | No differentiation between transient/permanent errors |
| Backoff | Exponential 2s | ⚠️ Partial | Should be longer for rate limits |
| Stalled Detection | 30s interval | ✅ Yes | Good |
| Priority Queues | ❌ None | ❌ No | Single document ingestion blocked by batch |
| Rate Limiting | ❌ None | ❌ No | GitHub API will rate limit |
| Dead Letter Queue | ❌ None | ❌ No | Failed jobs lost after 3 retries |
| Job Timeout | ❌ None | ❌ No | Jobs can run forever |
| Idempotency | ❌ Not enforced | ❌ No | Retries may duplicate work |

### Required Improvements

#### 1. Add Job Timeouts

```javascript
defaultJobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  timeout: 300000, // 5 minutes max per job
  removeOnComplete: { count: 100 }, // Keep last 100 completed
  removeOnFail: { count: 1000 } // Keep last 1000 failed for debugging
}
```

#### 2. Implement Priority Queues

```javascript
// High priority: single document ingestion
await ingestionQueue.add('single', payload, { priority: 10 });

// Low priority: batch import
await ingestionQueue.add('batch', payload, { priority: 1 });
```

#### 3. Add Rate Limiter for GitHub API

```javascript
// In queue configuration
{
  limiter: {
    max: 10, // 10 jobs
    duration: 60000, // per minute
    i18n: 'github_api'
  }
}
```

#### 4. Implement Dead Letter Queue

```javascript
// In worker error handler
worker.on('failed', async (job, error) => {
  if (job.attemptsMade >= job.opts.attempts) {
    // Move to DLQ
    await dlqQueue.add('dead_letter', {
      original_job: job.data,
      error: error.message,
      failed_at: new Date()
    });
  }
});
```

#### 5. Enforce Idempotency

```javascript
// In processor
async function processIngestion(job) {
  // Check if already processed
  const existing = await IngestQueue.findOne({ 
    source_file_sha256: job.data.source_sha 
  });
  
  if (existing?.status === 'complete') {
    logger.info({ jobId: job.id }, 'Job already processed, skipping');
    return { status: 'skipped', reason: 'duplicate' };
  }
  
  // Continue processing...
}
```

---

## 13. PROGRESS TRACKING REDESIGN

### Current Approach (Fragile)

```javascript
// Frontend polls every 2 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/admin/import/${batchId}`);
    const data = await response.json();
    setProgress(data.progress.importing.percentage);
  }, 2000);
  return () => clearInterval(interval);
}, []);
```

**Problems:**
- Infinite polling if backend crashes
- No distinction between "processing" and "stuck"
- Percentage meaningless without context
- No visibility into which files failed

### Proposed State Machine

```typescript
interface BatchStatus {
  batch_id: string;
  overall_status: 
    | 'QUEUED'
    | 'SCANNING'
    | 'VALIDATING'
    | 'PREPARING'
    | 'INGESTING'
    | 'POST_PROCESSING'
    | 'FINALIZING'
    | 'COMPLETED'
    | 'PARTIAL_SUCCESS'
    | 'FAILED'
    | 'CANCELLED'
    | 'RETRYING';
  
  current_stage: 'scan' | 'validate' | 'ingest' | 'post_process' | 'finalize';
  
  stages: {
    scan: StageResult;
    validate: StageResult;
    ingest: IngestStageResult;
    post_process: PostProcessStageResult;
  };
  
  progress: {
    percentage: number; // Weighted average
    completed_files: number;
    total_files: number;
    failed_files: number;
    estimated_remaining_seconds: number;
  };
  
  retry_info: {
    retry_count: number;
    last_retry_at: Date;
    next_retry_at?: Date;
    retry_reason?: string;
  };
  
  errors: Array<{
    stage: string;
    file_path?: string;
    error_code: string;
    message: string;
    timestamp: Date;
    recoverable: boolean;
  }>;
  
  metrics: {
    started_at: Date;
    completed_at?: Date;
    duration_ms: number;
    files_per_minute: number;
    avg_file_processing_time_ms: number;
  };
}
```

### Frontend Display Example

```
Batch Import: openstax-chemistry-2e
Status: INGESTING (Stage 3/5)

Progress: ████████████░░░░░░░░ 57%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files:     12/21 completed
           0 failed
           9 pending

Current Stage: Ingesting
  Started: 2 minutes ago
  ETA: 3 minutes remaining
  Speed: 6 files/minute

Recent Activity:
  ✓ openstax-chemistry-2e-ch10.json (2s ago)
  ✓ openstax-chemistry-2e-ch9.json (5s ago)
  ⏳ openstax-chemistry-2e-ch13.json (processing)
  
Background Jobs:
  Slug Resolution: 12 queued, 0 completed
  Search Indexing: 12 queued, 0 completed
```

### Implementation Strategy

1. **Backend:** Add WebSocket or Server-Sent Events for real-time updates
2. **Frontend:** Replace polling with event subscription
3. **Fallback:** Polling with exponential backoff (2s → 4s → 8s → 30s)
4. **Timeout:** Stop polling after 5 minutes or on terminal states

---

## 14. ROBUST RETRY BEHAVIOR DESIGN

### Retry Classification

Not all errors should retry the same way:

| Error Type | Retry Strategy | Max Attempts | Backoff |
|------------|---------------|--------------|---------|
| Network timeout (ETIMEDOUT) | Immediate retry | 5 | Exponential (1s, 2s, 4s, 8s, 16s) |
| GitHub 503 | Delayed retry | 3 | Fixed 60s (rate limit window) |
| GitHub 403 (rate limit) | Delayed retry | 1 | Fixed 3600s (1 hour) |
| MongoDB timeout | Immediate retry | 3 | Exponential (2s, 4s, 8s) |
| Validation error | No retry | 0 | N/A (permanent failure) |
| Schema mismatch | No retry | 0 | N/A (permanent failure) |

### Circuit Breaker Pattern

Implement circuit breaker for external APIs:

```javascript
class CircuitBreaker {
  constructor(options) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker OPEN');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        logger.warn({ failures: this.failures }, 'Circuit breaker opened');
      }
      
      throw error;
    }
  }
}

// Usage
const githubCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000 // 1 minute
});

async function fetchGitHubFile(...) {
  return await githubCircuitBreaker.execute(async () => {
    // Actual fetch logic
  });
}
```

### Dead Letter Queue Design

```javascript
// dlq.processor.js
export default async function processDeadLetter(job) {
  const { original_job, error, failed_at } = job.data;
  
  // Categorize failure
  const category = categorizeError(error);
  
  // Store for manual review
  await DeadLetterDocument.create({
    original_job_id: original_job.job_id,
    original_queue: original_job.queue_name,
    error_category: category,
    error_message: error,
    failed_at,
    data: original_job.payload,
    status: 'pending_review'
  });
  
  // Notify admins for critical failures
  if (category === 'DATA_CORRUPTION' || category === 'SCHEMA_VIOLATION') {
    await notifyAdmins({
      type: 'DLQ_CRITICAL',
      job_id: original_job.job_id,
      error
    });
  }
}
```

---

## 15. EXTERNAL DEPENDENCY REVIEW

### Dependency Matrix

| Dependency | Purpose | Timeout | Retry | Fallback | Failure Impact |
|------------|---------|---------|-------|----------|----------------|
| MongoDB | Primary storage | 30s | 3x exponential | Read-only mode | Complete outage |
| Redis | Queue storage | 10s | 3x exponential | In-memory queue (dev only) | Queue stops |
| GitHub API | Source content | 30s | 3x + rate limit aware | Cached copy | Import fails |
| AWS S3 | Asset storage | 60s | 3x exponential | Local filesystem | Assets missing |

### Timeout Strategy

**Current:** No explicit timeouts on most operations

**Proposed:**

```javascript
// MongoDB
mongoose.set('transactionAsyncLocalStorage', true);
session.withTransaction(async () => {
  // Operations here have 30s timeout
}, { maxCommitTimeMS: 30000 });

// Redis (ioredis)
const redis = new Redis({
  connectTimeout: 10000,
  commandTimeout: 5000
});

// HTTP (undici)
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000)
});
```

### Fallback Behavior

#### MongoDB Unavailable

```javascript
// Graceful degradation
try {
  await Document.findById(id);
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    // Return cached version if available
    const cached = await redis.get(`doc:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }
  }
  throw error;
}
```

#### GitHub Rate Limited

```javascript
// Check rate limit headers
const remaining = response.headers.get('X-RateLimit-Remaining');
const resetAt = response.headers.get('X-RateLimit-Reset');

if (remaining === '0') {
  const waitTime = resetAt * 1000 - Date.now();
  logger.warn({ waitTime }, 'GitHub rate limited, delaying');
  await sleep(waitTime);
  // Retry
}
```

---

## 16. RESUMABLE IMPORT DESIGN

### Current State: Partially Resumable

**What Works:**
- Tracks successful_files array
- Skips already-successful files on retry
- Supports retry_only flag for failed files

**What Doesn't Work:**
- No checkpointing within file processing
- Long-running transactions can't resume
- No partial topic persistence

### Enhanced Resumable Design

#### Checkpoint System

```javascript
// During batch import
for (const file of files) {
  // Checkpoint before starting
  await ImportBatch.updateOne(
    { batch_id },
    { $set: { 
      'current_checkpoint.file': file,
      'current_checkpoint.started_at': new Date()
    }}
  );
  
  try {
    await processFile(file);
    
    // Checkpoint after success
    await ImportBatch.updateOne(
      { batch_id },
      { 
        $push: { successful_files: file },
        $unset: { 'current_checkpoint': '' }
      }
    );
  } catch (error) {
    // Checkpoint preserves failure state
    await ImportBatch.updateOne(
      { batch_id },
      { 
        $push: { failed_files: { file, error } },
        $set: { 
          'current_checkpoint.failed': true,
          'current_checkpoint.error': error.message
        }
      }
    );
  }
}
```

#### Chunk-Based Processing

Instead of processing files sequentially, split into chunks:

```javascript
const CHUNK_SIZE = 5;
const chunks = chunk(files, CHUNK_SIZE);

for (const [chunkIndex, chunk] of chunks.entries()) {
  // Process chunk in parallel
  const results = await Promise.allSettled(
    chunk.map(file => processFile(file))
  );
  
  // Checkpoint after each chunk
  await ImportBatch.updateOne(
    { batch_id },
    { 
      $set: { 
        'progress.ingesting.current_chunk': chunkIndex + 1,
        'progress.ingesting.total_chunks': chunks.length
      }
    }
  );
}
```

**Benefits:**
- Faster: Parallel processing within chunks
- Resilient: One file failure doesn't block entire chunk
- Observable: Progress by chunk, not individual file

---

## 17. FRONTEND/BACKEND COMMUNICATION REDESIGN

### Current State Machine (Incomplete)

```
States: PENDING, SCANNING, READY, IMPORTING, COMPLETED, FAILED, PARTIAL_SUCCESS

Missing: QUEUED, VALIDATING, PREPARING, POST_PROCESSING, CANCELLED, RETRYING
```

### Proposed State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                   BATCH IMPORT STATE MACHINE                 │
└─────────────────────────────────────────────────────────────┘

PENDING
  │
  │ scan_repo
  ▼
SCANNING ──scan_failed──▶ FAILED
  │
  │ scan_complete
  ▼
READY
  │
  │ start_import
  ▼
QUEUED ──timeout (no worker)──▶ FAILED
  │
  │ worker_picked_up
  ▼
VALIDATING ──validation_failed──▶ FAILED
  │
  │ validation_passed
  ▼
PREPARING ──prep_failed (rate limit, db full)──▶ RETRYING
  │                                                   │
  │ prep_complete                                     │ retry_after
  ▼                                                   ▼
INGESTING ──────────────────────────────────────── QUEUED
  │
  │ ingest_complete (all files)
  ├──────────────────────────────┐
  │                              │
  ▼                              ▼
POST_PROCESSING          PARTIAL_SUCCESS
  │                              │
  │ all_jobs_complete            │ retry_failed_files
  ▼                              ▼
FINALIZING                    RETRYING
  │
  │ finalize_complete
  ▼
COMPLETED

Any State ──admin_cancel──▶ CANCELLED (graceful shutdown)
FAILED ──admin_retry──▶ QUEUED (reset retry count)
```

### State Transition Rules

```javascript
const STATE_TRANSITIONS = {
  PENDING: ['SCANNING', 'FAILED'],
  SCANNING: ['READY', 'FAILED'],
  READY: ['QUEUED', 'CANCELLED'],
  QUEUED: ['VALIDATING', 'FAILED'],
  VALIDATING: ['PREPARING', 'FAILED'],
  PREPARING: ['INGESTING', 'RETRYING', 'FAILED'],
  INGESTING: ['POST_PROCESSING', 'PARTIAL_SUCCESS', 'FAILED', 'CANCELLED'],
  POST_PROCESSING: ['FINALIZING', 'PARTIAL_SUCCESS'],
  FINALIZING: ['COMPLETED', 'PARTIAL_SUCCESS'],
  PARTIAL_SUCCESS: ['RETRYING', 'COMPLETED'],
  RETRYING: ['QUEUED', 'FAILED'],
  FAILED: ['RETRYING', 'CANCELLED'],
  CANCELLED: [] // Terminal state
};

function canTransition(from, to) {
  return STATE_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### Frontend Implementation

```typescript
// useBatchImportStatus.ts
export function useBatchImportStatus(batchId: string) {
  const [status, setStatus] = useState<BatchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let consecutiveErrors = 0;
    let backoffDelay = 2000; // Start at 2s
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/admin/import/${batchId}`);
        
        if (response.status === 401) {
          setError('Unauthorized');
          return; // Stop polling on auth error
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setStatus(data);
        consecutiveErrors = 0;
        backoffDelay = 2000; // Reset on success
        
        // Stop polling on terminal states
        if (['COMPLETED', 'FAILED', 'PARTIAL_SUCCESS', 'CANCELLED'].includes(data.overall_status)) {
          return;
        }
        
      } catch (err) {
        consecutiveErrors++;
        
        // Exponential backoff
        backoffDelay = Math.min(backoffDelay * 2, 30000);
        
        // Stop after 5 consecutive errors
        if (consecutiveErrors >= 5) {
          setError('Polling failed after 5 attempts');
          return;
        }
      }
      
      pollInterval = setTimeout(poll, backoffDelay);
    };
    
    poll();
    
    return () => clearTimeout(pollInterval);
  }, [batchId]);
  
  return { status, error };
}
```

---

## 18. OBSERVABILITY REDESIGN

### Current Logging Issues

```javascript
// Current log (insufficient)
logger.info({ batch_id, file: filePath }, 'Document imported successfully');

// Problem: No correlation ID, no timing, no context
```

### Structured Logging Standard

Every log entry must include:

```javascript
{
  // Correlation
  correlation_id: string,      // Unique per batch
  trace_id: string,            // Unique per request chain
  span_id: string,             // Unique per operation
  
  // Context
  batch_id: string,
  job_id: string,
  worker_id: string,
  stage: string,
  
  // Timing
  timestamp: ISO8601,
  duration_ms: number,
  
  // Result
  status: 'success' | 'error' | 'warning',
  error_code?: string,
  
  // Metadata
  file_path?: string,
  document_id?: string,
  retry_count?: number
}
```

### Log Example

```javascript
logger.info({
  correlation_id: 'corr_batch_exp_zwsuweuryqv6',
  trace_id: 'trace_abc123',
  span_id: 'span_def456',
  batch_id: 'batch_exp_zwsuweuryqv6',
  job_id: 'job_789',
  worker_id: 'worker_1',
  stage: 'ingest',
  timestamp: '2026-07-07T18:55:57.056Z',
  duration_ms: 2247,
  status: 'success',
  file_path: 'data/ingested/openstax-chemistry-2e-ch10.json',
  document_id: 'openstax-chemistry-2e',
  topics_processed: 10,
  retry_count: 0
}, 'Document ingestion completed');
```

### Distributed Tracing

Implement OpenTelemetry-compatible tracing:

```javascript
// At batch start
const traceId = generateTraceId();
const correlationId = `corr_${batchId}`;

// Pass through all operations
await processFile(file, { traceId, correlationId });

// In worker
const span = tracer.startSpan('ingest_document', {
  traceId,
  attributes: {
    'batch.id': batchId,
    'file.path': filePath,
    'document.id': documentId
  }
});

try {
  // Processing
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  throw error;
} finally {
  span.end();
}
```

### Metrics to Track

```javascript
// Prometheus-style metrics
const metrics = {
  // Counters
  'batch_import_total': Counter,
  'batch_import_success_total': Counter,
  'batch_import_failed_total': Counter,
  'file_ingested_total': Counter,
  'file_failed_total': Counter,
  
  // Gauges
  'batch_import_in_progress': Gauge,
  'queue_length': Gauge,
  'worker_active_count': Gauge,
  
  // Histograms
  'file_processing_duration_seconds': Histogram,
  'batch_duration_seconds': Histogram,
  'queue_wait_time_seconds': Histogram
};
```

---

## 19. SCALABILITY ANALYSIS

### Assumptions

- 1000 books
- 100 chapters/book = 100,000 chapters
- 50 topics/chapter = 5,000,000 topics
- 20 content blocks/topic = 100,000,000 content blocks

### Current Bottlenecks

#### Database Bottlenecks

**Issue:** Sequential file processing

```javascript
// Current: 1 file at a time
for (const file of files) {
  await processFile(file); // ~3s per file
}
// 21 files × 3s = 63s total
// 100,000 files × 3s = 300,000s = 83 hours ❌
```

**Solution:** Parallel chunk processing

```javascript
// Proposed: 10 chunks of 10 files each, processed in parallel
const chunks = chunk(files, 10);
for (const chunk of chunks) {
  await Promise.all(chunk.map(f => processFile(f))); // ~3s per chunk
}
// 10 chunks × 3s = 30s total
// 10,000 chunks × 3s = 30,000s = 8.3 hours ✅
```

**Further Optimization:** Increase concurrency

```javascript
// With 5 concurrent workers processing chunks
// 10,000 chunks ÷ 5 workers = 2,000 chunks per worker
// 2,000 × 3s = 6,000s = 1.7 hours ✅✅
```

#### Queue Bottlenecks

**Issue:** Single queue for all priorities

```javascript
// Current: Batch import blocks single document ingestion
await ingestionQueue.add('batch_import', largePayload);
await ingestionQueue.add('single_ingest', smallPayload);
// single_ingest waits for batch_import to complete
```

**Solution:** Priority queues

```javascript
// Separate queues by priority
await highPriorityQueue.add('single_ingest', payload, { priority: 10 });
await lowPriorityQueue.add('batch_import', payload, { priority: 1 });
```

#### Memory Bottlenecks

**Issue:** Loading entire JSON files into memory

```javascript
// Current: 3MB file loaded entirely
const doc = await fetchGitHubFile(...); // 3MB in memory
```

**Solution:** Streaming for large files

```javascript
// Proposed: Stream and parse incrementally
const stream = await fetchGitHubFileStream(...);
const parser = new JSONStreamParser();
for await (const chunk of stream) {
  parser.write(chunk); // Process incrementally
}
```

#### Worker Bottlenecks

**Issue:** Fixed concurrency (5) regardless of load

```javascript
// Current: Always 5 concurrent jobs
new Worker(queueName, processor, { concurrency: 5 });
```

**Solution:** Dynamic concurrency

```javascript
// Scale based on CPU/memory availability
const availableMemory = os.freemem();
const concurrency = Math.max(1, Math.floor(availableMemory / (256 * 1024 * 1024)));
// 1 concurrent job per 256MB free memory
```

### Scalability Recommendations

| Component | Current | Target | Improvement |
|-----------|---------|--------|-------------|
| Files/hour | 1,200 | 12,000 | 10× |
| Concurrent batches | 1 | 10 | 10× |
| Queue throughput | 100 jobs/min | 1,000 jobs/min | 10× |
| Database writes | 100/sec | 1,000/sec | 10× |

---

## 20. PRIORITIZED MIGRATION PLAN

### Phase 1: CRITICAL (Must Fix Before Production)

**Estimated Effort:** 3-5 days

#### Task 1.1: Add Job Timeouts
- **Files:** `src/queues/createQueue.js`, `src/workers/createWorker.js`
- **Change:** Add `timeout: 300000` to defaultJobOptions
- **Risk:** Low (jobs will fail faster instead of hanging)
- **Testing:** Verify jobs timeout after 5 minutes

#### Task 1.2: Implement Circuit Breaker for GitHub API
- **Files:** NEW `src/utils/circuitBreaker.js`, `src/services/import/importValidation.service.js`
- **Change:** Wrap all GitHub API calls with circuit breaker
- **Risk:** Medium (may temporarily block imports during testing)
- **Testing:** Simulate 5 consecutive failures, verify circuit opens

#### Task 1.3: Fix Frontend Infinite Polling
- **Files:** `sijil-studio/sijil-frontend/src/hooks/use-batch-import.ts`
- **Change:** Add exponential backoff, stop on terminal states, max 5 errors
- **Risk:** Low (improves UX)
- **Testing:** Kill backend, verify frontend stops polling after 5 errors

#### Task 1.4: Add Graceful Shutdown Handler
- **Files:** `src/workers/worker.js`, `server.js`
- **Change:** Listen for SIGINT/SIGTERM, abort transactions, close connections
- **Risk:** Medium (may affect in-flight jobs)
- **Testing:** Send SIGINT during import, verify clean shutdown

### Phase 2: HIGH PRIORITY (Week 1-2)

**Estimated Effort:** 5-7 days

#### Task 2.1: Implement Priority Queues
- **Files:** `src/queues/index.js`, `src/controllers/admin.controller.js`
- **Change:** Create high/low priority queues, route jobs appropriately
- **Risk:** Medium (requires queue migration)
- **Testing:** Verify single ingestion bypasses batch queue

#### Task 2.2: Add Dead Letter Queue
- **Files:** NEW `src/queues/dlq.js`, NEW `src/workers/processors/dlq.processor.js`
- **Change:** Move failed jobs to DLQ after max retries
- **Risk:** Low (additive feature)
- **Testing:** Force job failure, verify appears in DLQ

#### Task 2.3: Enhance Progress Tracking
- **Files:** `src/models/importBatch.model.js`, `src/services/import/importReport.service.js`
- **Change:** Add stage-based progress, weighted percentage, ETA
- **Risk:** Low (backward compatible)
- **Testing:** Run import, verify detailed progress in frontend

#### Task 2.4: Implement Chunk-Based Processing
- **Files:** `src/workers/processors/ingestion.processor.js`
- **Change:** Process files in chunks of 5 with Promise.allSettled
- **Risk:** High (changes core ingestion logic)
- **Testing:** Compare results with sequential processing

### Phase 3: MEDIUM PRIORITY (Week 3-4)

**Estimated Effort:** 7-10 days

#### Task 3.1: Decouple Queue Enqueuing
- **Files:** `src/services/ingestion/persistIngestion.service.js`, NEW `src/events/documentEvents.js`
- **Change:** Emit events instead of direct queue.add(), separate event processor
- **Risk:** High (architectural change)
- **Testing:** Verify slug/search jobs still created

#### Task 3.2: Add Distributed Tracing
- **Files:** All services and processors
- **Change:** Integrate OpenTelemetry, add trace/span IDs to logs
- **Risk:** Medium (performance overhead ~5%)
- **Testing:** Trace request through entire pipeline

#### Task 3.3: Implement Resumable Checkpoints
- **Files:** `src/workers/processors/ingestion.processor.js`, `src/models/importBatch.model.js`
- **Change:** Add checkpoint field, resume from last checkpoint on retry
- **Risk:** Medium (complex state management)
- **Testing:** Kill worker mid-import, verify resumes correctly

#### Task 3.4: Add Rate Limiting for GitHub API
- **Files:** `src/queues/createQueue.js`
- **Change:** Configure queue limiter for GitHub API calls
- **Risk:** Low (queue-level configuration)
- **Testing:** Trigger rate limit, verify queue slows down

### Phase 4: FUTURE IMPROVEMENTS (Month 2+)

**Estimated Effort:** Ongoing

#### Task 4.1: WebSocket Real-Time Updates
- **Files:** NEW `src/websocket/server.js`, Frontend hook
- **Change:** Replace polling with WebSocket subscriptions
- **Risk:** Medium (infrastructure addition)

#### Task 4.2: Dynamic Worker Scaling
- **Files:** NEW `src/workers/autoScaler.js`
- **Change:** Scale worker count based on queue length
- **Risk:** High (orchestration complexity)

#### Task 4.3: Multi-Region Support
- **Files:** Multiple (database, queue, storage layers)
- **Change:** Support geo-distributed deployments
- **Risk:** Very High (fundamental architecture change)

#### Task 4.4: Search Engine Migration
- **Files:** `src/services/api/search.service.js`
- **Change:** Replace MongoDB text search with Elasticsearch
- **Risk:** High (data migration required)

---

## 21. TESTING REQUIREMENTS

### Unit Tests (Existing - Expand Coverage)

```bash
# Current coverage: ~40%
# Target coverage: 80%

npm test -- --coverage
```

**Missing Tests:**
- Circuit breaker behavior
- Retry logic with different error types
- Transaction rollback scenarios
- Queue priority ordering
- Stalled job recovery

### Integration Tests (New)

```javascript
// tests/integration/batch-import.test.js
describe('Batch Import Pipeline', () => {
  it('should process 21 files successfully', async () => {
    // Mock GitHub API
    // Run batch import
    // Verify all documents in DB
    // Verify slug/search jobs queued
  });

  it('should resume from checkpoint after failure', async () => {
    // Start batch import
    // Kill worker at file 10/21
    // Restart worker
    // Verify resumes from file 11/21
    // Verify files 1-10 not duplicated
  });

  it('should handle GitHub rate limit gracefully', async () => {
    // Mock GitHub returning 403
    // Verify circuit breaker opens
    // Verify batch marked as RETRYING
    // Verify retry scheduled after 1 hour
  });
});
```

### Load Tests (New)

```javascript
// tests/load/batch-import-load.test.js
describe('Batch Import Load Testing', () => {
  it('should handle 10 concurrent batch imports', async () => {
    // Start 10 batch imports simultaneously
    // Measure total completion time
    // Verify no data corruption
    // Verify queue doesn't overflow
  });

  it('should maintain throughput under load', async () => {
    // Continuously submit batch imports for 1 hour
    // Measure files/minute over time
    // Verify no degradation
  });
});
```

### Chaos Tests (Future)

```javascript
// tests/chaos/random-failures.test.js
describe('Chaos Engineering', () => {
  it('should survive random worker crashes', async () => {
    // Start batch import
    // Randomly kill workers during processing
    // Verify batch completes eventually
    // Verify no data loss
  });

  it('should survive MongoDB failover', async () => {
    // Start batch import
    // Kill primary MongoDB node
    // Verify replica set election
    // Verify batch resumes
  });
});
```

---

## 22. RISK ASSESSMENT

### High-Risk Changes

| Change | Risk Level | Mitigation |
|--------|-----------|------------|
| Chunk-based parallel processing | HIGH | Extensive testing, feature flag, gradual rollout |
| Queue decoupling via events | HIGH | Dual-write during transition, rollback plan |
| Distributed tracing | MEDIUM | Performance testing, opt-in initially |
| Dynamic worker scaling | HIGH | Conservative scaling rules, manual override |

### Rollback Strategy

For each phase:

1. **Feature Flags:** Wrap new logic in feature flags
2. **Database Migrations:** Backward-compatible schema changes
3. **Canary Deployment:** Test with 10% of traffic first
4. **Monitoring:** Set up alerts for error rate spikes
5. **Rollback Plan:** Document steps to revert each change

### Regression Risks

| Change | Potential Regression | Detection |
|--------|---------------------|-----------|
| Job timeouts | Valid jobs timeout prematurely | Monitor timeout rate |
| Circuit breaker | False positives block imports | Monitor circuit state |
| Priority queues | Low-priority jobs starve | Monitor queue wait times |
| Chunk processing | Race conditions cause duplicates | Monitor duplicate rate |

---

## 23. SUCCESS METRICS

### Before Implementation

- Batch import failure rate: ~15% (3/21 files fail typically)
- Average import time (21 files): 63 seconds
- Frontend polling duration: Indefinite (until manual stop)
- Mean time to recovery (MTTR): 30+ minutes (manual intervention)
- System availability: ~95% (downtime during failures)

### After Phase 1 (Critical)

- Batch import failure rate: <5%
- Average import time: 63 seconds (unchanged)
- Frontend polling duration: Max 5 minutes
- MTTR: 5 minutes (automatic retry)
- System availability: ~98%

### After Phase 2 (High Priority)

- Batch import failure rate: <2%
- Average import time: 30 seconds (parallel chunks)
- Frontend polling duration: Max 2 minutes
- MTTR: 1 minute (automatic retry with backoff)
- System availability: ~99%

### After Phase 3 (Medium Priority)

- Batch import failure rate: <1%
- Average import time: 15 seconds (optimized parallel)
- Frontend polling duration: Real-time (WebSocket)
- MTTR: <30 seconds (automatic recovery)
- System availability: ~99.5%

### Target (Production Ready)

- Batch import failure rate: <0.1%
- Average import time: <10 seconds
- Frontend polling duration: Real-time
- MTTR: <10 seconds
- System availability: 99.9%

---

## 24. CONCLUSION

### Current State Summary

The SIJIL backend is **functionally complete but operationally fragile**. It successfully ingests content but lacks the resilience, observability, and scalability required for production workloads. The tight coupling between components creates cascading failure patterns that require manual intervention.

### Transformation Roadmap

**Phase 1 (3-5 days):** Address critical stability issues
- Job timeouts prevent infinite hangs
- Circuit breaker protects against GitHub API failures
- Frontend polling improvements prevent browser resource exhaustion
- Graceful shutdown prevents data corruption

**Phase 2 (5-7 days):** Improve reliability and performance
- Priority queues ensure critical jobs aren't blocked
- Dead letter queue captures failed jobs for analysis
- Enhanced progress tracking improves user experience
- Chunk-based processing reduces import time by 50%

**Phase 3 (7-10 days):** Architectural improvements
- Event-driven decoupling increases fault isolation
- Distributed tracing enables root cause analysis
- Resumable checkpoints enable recovery from failures
- Rate limiting prevents external API throttling

**Phase 4 (Ongoing):** Scale and optimize
- WebSocket real-time updates
- Dynamic worker scaling
- Multi-region support
- Search engine migration

### Final Recommendation

**DO NOT deploy to production until Phase 1 is complete.**

The current system will fail under production load, resulting in:
- Data inconsistencies from interrupted transactions
- Poor user experience from infinite polling
- Operational burden from manual failure recovery
- Potential data loss from unhandled edge cases

**Prioritize reliability over features.** The system already has all required functionality. Focus on making it stable, observable, and resilient before adding new capabilities.

---

**Document End**

*This architecture review identifies 24 critical areas requiring attention. Implementation should follow the prioritized migration plan, with thorough testing at each phase.*
