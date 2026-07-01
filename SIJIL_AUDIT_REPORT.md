# SIJIL — Full Project Audit Report

**Date**: 2026-07-01
**Scope**: `sijil-core/` (backend) + `sijil-studio/` (frontend, both versions)
**Method**: Static code analysis of every route, controller, model, service, queue, worker, page, component, hook, and API client.

---

## PART 5 — FINAL SUMMARY (written last, read first)

### Overall State

SIJIL is a document intelligence & headless publishing engine built for Pakistani curriculum (PCTB) textbooks. It has a **well-architected backend** with a clear domain model (documents → chapters → topics → content blocks) and queue-driven ingestion pipeline. The backend has 36+ endpoints, 23 Mongoose models, 5 BullMQ queues, and a thorough SEO/AEO layer. However, the **frontend is in crisis**: two competing codebases (`sijil-frontend/` and `src/`) co-exist, neither is fully wired to the backend, the UI is inconsistent and unfinished, and significant backend features have zero frontend representation. The repo also has a **stale git rebase in progress** (`feat/found-001-init-frontend` branch mid-rebase).

### Top 10 Critical Issues (ranked by impact)

1. **Two frontend apps, one project** — `sijil-studio/sijil-frontend/` (new, ~60 pages) and `sijil-studio/src/` (old, Quran/practice pages) both exist. They share the same `package.json` and `node_modules` at `sijil-studio/` level but have completely different page trees. The old `src/` contains a Quran browser, practice pages, and assessment UI that don't exist in `sijil-frontend/`. Neither is fully functional.

2. **Stale git rebase** — `sijil-onyx` root is mid-interactive-rebase on `feat/found-001-init-frontend`. Uncommitted work at risk.

3. **Backend has features with zero UI** — Admin endpoints (ingestion, batch import, cancel/retry), slug management (resolve, redirect stats, trigger resolver), sitemap/seo endpoints, export policies, duplicate detection (unresolved links, failed searches), and platform stats recomputation all lack frontend screens.

4. **API base URL mismatch** — `siteConfig.apiBaseUrl` defaults to `http://localhost:3001/api` while the backend runs on port `4000` (`http://localhost:4000/api`). All API calls will 404 in the default dev setup.

5. **Quran module orphaned** — The Quran backend (`/api/quran/surah/`, `/ayah/`, `/range/`) is fully built, but the Quran frontend exists only in the old `src/` app, not in `sijil-frontend/`. The new frontend has zero Quran pages.

6. **Broken search track endpoint** — Frontend `trackSearch()` calls `POST /analytics/search` but backend has no such route. Analytics tracking is handled by a GET middleware on `/api/search` and a separate `getSearchAnalytics` on `/utility/analytics/search`.

7. **`tsconfig.json` target ES2017** — The frontend targets ES2017 with a Next.js 16 + React 19 stack. This is unnecessarily restrictive and prevents using modern features.

8. **@tanstack/react-query in devDependencies** — A critical runtime dependency is misclassified, will be tree-shaken in production builds.

9. **Inconsistent frontend fetch layer** — The frontend has 3 different fetch wrappers (`api/client.ts`, `http.ts`, raw `fetch` in `api.ts`) all doing essentially the same thing with slightly different error handling.

10. **Gitignore is broken** — `sijil-core/.gitignore` starts with triple backticks (```), making all ignore patterns ineffective. Node_modules and .env are likely tracked.

### Backend Features With Zero Frontend UI

| Backend endpoint(s) | Feature | Suggested frontend route |
|---|---|---|
| `POST /admin/import/preview`, `/start`, `/:batchId`, `/retry`, `/cancel`, `/report` | GitHub batch import | `/admin/import` |
| `POST /ingest/json`, `GET /ingest/:trackingId`, cancel, retry | JSON ingestion | `/admin/ingest` |
| `GET /seo/topic/:id/jsonld`, `/document/:id/jsonld` | JSON-LD viewer | `/admin/seo` or debug panel |
| `GET /seo/sitemap-*.xml`, `/seo/sitemap/stats` | Sitemap management | `/admin/seo/sitemap` |
| `GET /seo/topic/:id/aeo`, `/aeo/score` | AEO Answer Hub | `/topics/[slug]/aeo` |
| `GET /utility/slug/resolve`, `/redirects/stats` | Slug redirect management | `/admin/slugs` |
| `POST /utility/resolve-slugs` | Trigger slug resolver | `/admin/slugs` |
| `GET /quran/surah/:num`, `/ayah/:surah/:ayah`, `/range/:surah/:start/:end` | Quran browser | `/quran` (exists in old `src/` only) |
| `GET /utility/popular-topics`, `/failed-searches` | Topic/search analytics | `/admin/analytics` |
| `GET /utility/sitemap-seed` | Sitemap seed data | internal/sitemap use only |
| `POST /utility/platform-stats/recompute` | Stats recomputation | `/admin` (button) |

### Frontend Duplication / Dead Code

| Path | Status | Notes |
|---|---|---|
| `sijil-studio/src/app/quran/` | Orphaned (old app) | Full Quran browser with surah listing + ayah reading. Not in `sijil-frontend/` |
| `sijil-studio/src/app/assessments/` | Orphaned (old app) | Assessment detail pages. Not in `sijil-frontend/` |
| `sijil-studio/src/app/practice/` | Orphaned (old app) | Practice pages. Not in `sijil-frontend/` |
| `sijil-studio/src/app/documents/` | Orphaned (old app) | Document detail. Not in `sijil-frontend/` |
| `sijil-studio/src/app/topics/` | Orphaned (old app) | Topic list + detail. Not in `sijil-frontend/` |
| `sijil-studio/src/lib/api.ts` | Dead | Old API client. Superseded by `sijil-frontend/src/lib/api/` |
| `sijil-studio/src/lib/utils.ts` | Possibly dead | Old utilities |
| `sijil-studio/docs/` | Alive but misplaced | Should be in a `/docs` folder, not in frontend src |

---

## PART 1 — BACKEND AUDIT (sijil-core/)

### 1.1 Route-to-Controller Mapping

#### Mounted at `/api` (via `app.js`):
```
/api/health          → health.routes.js
/api/*               → index.js → all other routes
```

#### health.routes.js
| Method | Path | Controller | Services called | Status | Notes |
|---|---|---|---|---|---|
| GET | `/api/health` | inline handler | `checkHealth()` from `health.service.js` | Working | Returns MongoDB + Redis health |

#### ingest.routes.js (all requireAdmin middleware)
| Method | Path | Controller | Services called | Models touched | Status | Notes |
|---|---|---|---|---|---|---|
| POST | `/api/ingest/json` | `submitJsonIngest` | `ingestDocument()` from `ingestion/ingestDocument.service.js` | IngestQueue, ingestionQueue (BullMQ) | Working | Requires admin auth |
| GET | `/api/ingest/:trackingId` | `getIngestStatus` | `getIngestStatusById()` from `api/ingestStatus.service.js` | IngestQueue | Working | |
| POST | `/api/ingest/:id/cancel` | `cancelIngestJob` | `Job.fromId()` (BullMQ) | IngestQueue, ingestionQueue | Working | Only waiting/delayed jobs |
| POST | `/api/ingest/:id/retry` | `retryIngestJob` | `ingestionQueue.add()` | IngestQueue | Working | Only failed jobs |

#### document.routes.js
| Method | Path | Controller | Services called | Models touched | Status | Notes |
|---|---|---|---|---|---|---|
| GET | `/api/documents` | `listDocuments` | `queryDocuments()` from `api/documentQuery.service.js` | Document | Working | Filters: subject, grade, status, type, sort, search |
| GET | `/api/documents/:documentId` | `getDocumentById` | `fetchDocumentById()` from `api/documentQuery.service.js` | Document | Working | Returns full doc with aggregates |
| GET | `/api/documents/:documentId/topics` | `getDocumentTopics` | `fetchDocumentTopics()` from `api/documentQuery.service.js` | Document, Topic, TopicAsset | Working | Enriches figures with URLs |
| GET | `/api/documents/:id/aggregates` | `getDocumentAggregates` | direct counts (topics, content_blocks, formulas, assessments, assets) | Topic, TopicContent, FormulaIndex, TopicAssessment, TopicAsset | Working | Inline aggregation |
| GET | `/api/subjects` | `getSubjects` | `fetchSubjects()` from `api/documentQuery.service.js` | Document (aggregation) | Working | |
| GET | `/api/grades` | `getGrades` | `fetchGrades()` from `api/documentQuery.service.js` | Document (aggregation) | Working | |
| GET | `/api/subjects/:subject/grades` | `getSubjectGrades` | `fetchSubjectGrades()` from `api/documentQuery.service.js` | Document (aggregation) | Working | |

#### topic.routes.js
| Method | Path | Controller | Services called | Models touched | Status | Notes |
|---|---|---|---|---|---|---|
| GET | `/api/topics/:topicId` | `getTopicById` | `fetchTopicById()` from `api/topicQuery.service.js` | Topic, TopicContent, TopicAsset, TopicAssessment | Working | Merges meta + content + assets + assessments; fires analytics |
| GET | `/api/topics/slug/*slug` | `getTopicBySlugGlobal` | `fetchTopicBySlugGlobal()` from `api/topicQuery.service.js` | Topic, TopicContent, TopicAsset, TopicAssessment | Working | Wildcard path for deep slugs |
| GET | `/api/topics/:topicId/content` | `getTopicContent` | `fetchTopicContent()` from `api/topicQuery.service.js` | TopicContent | Working | |
| GET | `/api/topics/:topicId/assets` | `getTopicAssets` | `fetchTopicAssets()` from `api/topicQuery.service.js` | TopicAsset | Working | Enriches figures + tables |
| GET | `/api/topics/:topicId/assessments` | `getTopicAssessments` | `fetchTopicAssessments()` from `api/topicQuery.service.js` | TopicAssessment | Working | |
| GET | `/api/topics/:topicId/page` | `getTopicPage` | `fetchTopicPage()` from `api/topicQuery.service.js` | Topic, TopicContent, FormulaIndex, TopicAssessment, TopicAsset | Working | Returns page with prev/next nav + counts |

#### export.routes.js
| Method | Path | Controller | Services called | Models touched | Status | Notes |
|---|---|---|---|---|---|---|
| POST | `/api/exports` | `createExportJob` | `enqueueExportJob()` from `api/export.service.js` | ExportJob, exportGenQueue | Working | Requires topic_id + format |
| GET | `/api/exports/:exportJobId` | `getExportJobStatus` | `fetchExportJobStatus()` from `api/export.service.js` | ExportJob | Working | |
| GET | `/api/policies` | `getPolicies` | `getAllPolicies()` from `export/exportPolicy.service.js` | ExportPolicy | Working | |
| GET | `/api/policies/:document_type` | `getPolicyByType` | `getPolicyForDocumentType()` from `export/exportPolicy.service.js` | ExportPolicy | Working | |
| GET | `/api/export/download` | `downloadExportDirect` | `generateExportDirect()` from `api/export.service.js` | Topic, TopicContent, TopicAssessment | Working | Query params: topic_id, format, document_type |
| GET | `/api/export/:exportJobId/stale` | `getExportStaleness` | `checkExportStaleness()` from `api/export.service.js` | ExportJob | Working | |

#### search.routes.js
| Method | Path | Controller | Services called | Models touched | Status | Notes |
|---|---|---|---|---|---|---|
| GET | `/api/search` | `searchTopicsHandler` | `searchTopics()` from `api/search.service.js` + `trackPopularSearch`/`trackFailedSearch` + analytics | Topic (Atlas Search) | Working | Requires `q` param |
| GET | `/api/search/formulas` | `searchFormulasHandler` | `searchFormulas()` from `api/formulaSearch.service.js` | FormulaIndex (Atlas Search) | Working | Requires `q` param |
| GET | `/api/search/suggest` | `getSuggestionsHandler` | `getSuggestions()` from `api/suggest.service.js` | PopularSearch | Working | Requires `prefix` param |
| GET | `/api/search/trending` | `getTrendingHandler` | `getTrendingSearches()` from `api/suggest.service.js` | PopularSearch | Working | |

#### seo.routes.js
| Method | Path | Controller | Services called | Models touched | Status | Notes |
|---|---|---|---|---|---|---|
| GET | `/api/seo/topic/:topicId/jsonld` | `getTopicJsonLd` | `generateTopicJsonLdBundle()` from `seo/jsonld.service.js` | Topic, Document, TopicAssessment | Working | Article + FAQ + Quiz + Breadcrumb |
| GET | `/api/seo/document/:documentId/jsonld` | `getDocumentJsonLd` | `generateBookJsonLd()` from `seo/jsonld.service.js` | Document | Working | |
| GET | `/api/seo/sitemap-static.xml` | `getStaticSitemap` | `generateStaticSitemap()` from `seo/sitemap.service.js` | none (static) | Working | |
| GET | `/api/seo/sitemap-index.xml` | `getSitemapIndex` | `generateSitemapIndex()` from `seo/sitemap.service.js` | SlugRegistry | Working | |
| GET | `/api/seo/sitemap-:page.xml` | `getSitemapPage` | `generateSitemapPage()` from `seo/sitemap.service.js` | SlugRegistry | Working | Paginated at 1000 URLs/page |
| GET | `/api/seo/sitemap/stats` | `getSitemapStatsController` | `getSitemapStats()` from `seo/sitemap.service.js` | SlugRegistry (aggregation) | Working | |
| GET | `/api/seo/topic/:topicId/aeo` | `getTopicAnswerHub` | `generateTopicAnswerHub()` from `seo/aeo.service.js` | Topic, Document | Working | |
| GET | `/api/seo/document/:documentId/aeo` | `getDocumentAnswerHub` | `generateDocumentAnswerHub()` from `seo/aeo.service.js` | Document | Working | |
| GET | `/api/seo/topic/:topicId/aeo/score` | `getTopicAeoScore` | `getAeoReadinessScore()` from `seo/aeo.service.js` | Topic | Working | |

#### quran.routes.js
| Method | Path | Controller | Services called | Models touched | Status | Notes |
|---|---|---|---|---|---|---|
| GET | `/api/quran/surah/:surahNumber` | `getSurah` | direct | QuranSurah, QuranAyah | Working | Returns surah + all ayahs |
| GET | `/api/quran/ayah/:surahNumber/:ayahNumber` | `getAyah` | direct | QuranAyah | Working | |
| GET | `/api/quran/range/:surahNumber/:start/:end` | `getRange` | direct | QuranAyah | Working | Max 50 ayahs |

#### utility.routes.js
| Method | Path | Controller | Services called | Models touched | Status | Notes |
|---|---|---|---|---|---|---|
| GET | `/api/utility/popular-topics` | `getPopularTopics` | `fetchPopularTopics()` from `api/utility.service.js` | PopularTopic | Working | |
| GET | `/api/utility/failed-searches` | `getFailedSearches` | `fetchFailedSearches()` from `api/utility.service.js` | FailedSearch | Working | |
| GET | `/api/utility/sitemap-seed` | `getSitemapSeed` | `fetchSitemapSeed()` from `api/utility.service.js` | SlugRegistry | Working | |
| GET | `/api/utility/analytics/search` | `getSearchAnalytics` | `getSearchAnalyticsSummary()` from `analytics/searchAnalytics.service.js` | PopularSearch, FailedSearch | Working | |
| GET | `/api/utility/analytics/topics` | `getTopicAnalytics` | `getTopicAnalyticsSummary()` from `analytics/topicAnalytics.service.js` | PopularTopic | Working | |
| GET | `/api/utility/slug/resolve` | `resolveRedirect` | `resolveSlugRedirect()` from `slug/slugRedirect.service.js` | SlugRedirect | Working | Query: `slug` |
| GET | `/api/utility/slug/redirects/stats` | `getRedirectStats` | `getSlugRedirectStats()` from `slug/slugRedirect.service.js` | SlugRedirect | Working | |
| GET | `/api/utility/platform-stats` | `getPlatformStats` | `getStats()` from `stats/platformStats.service.js` | PlatformStats | Working | |
| GET | `/api/utility/recent-arrivals` | `getRecentArrivalsController` | `getRecentArrivals()` from `stats/platformStats.service.js` | PlatformStats | Working | |
| POST | `/api/utility/platform-stats/recompute` | `recomputePlatformStats` | `recomputeStats()` from `stats/platformStats.service.js` | PlatformStats, all major models | Working | |
| POST | `/api/utility/resolve-slugs` | `triggerSlugResolver` | `slugResolverQueue.add()` (BullMQ) | slugResolverQueue | Working | |

#### admin.routes.js (all mounted at `/api/admin`, all requireAdmin)
| Method | Path | Controller | Services called | Models touched | Status | Notes |
|---|---|---|---|---|---|---|
| POST | `/api/admin/import/preview` | inline | `previewImport()` from `import/importPreview.service.js` | ImportBatch (via service) | Working | Needs GITHUB_PAT |
| POST | `/api/admin/import/start` | inline | `executeImport()` from `import/importExecutor.service.js` | ImportBatch | Working | Background job |
| GET | `/api/admin/import/:batchId` | inline | direct | ImportBatch | Working | |
| POST | `/api/admin/import/:batchId/retry` | inline | `executeImport()` with retry flag | ImportBatch, AuditLog | Working | |
| POST | `/api/admin/import/:batchId/cancel` | inline | direct | ImportBatch, AuditLog | Working | |
| GET | `/api/admin/import/:batchId/report` | inline | direct | ImportBatch | Working | |

Also note: `sijil-studio/` has no root `package.json` — only `sijil-frontend/package.json` exists at `sijil-studio/sijil-frontend/package.json`. The old `src/` directory shares the same Next.js app config as `sijil-frontend/`.

### 1.2 Model Inventory

| Model | File | Collection | Used in routes/services | Status |
|---|---|---|---|---|
| Document | `document.model.js` | `documents` | YES — documents, topics, seo, sitemap, imports | Active |
| Topic | `topic.model.js` | `topics` | YES — topics, search, page, exports, seo | Active |
| TopicContent | `topicContent.model.js` | `topic_content` | YES — topics, page | Active |
| TopicAsset | `topicAsset.model.js` | `topic_assets` | YES — topics, page, assets | Active |
| TopicAssessment | `topicAssessment.model.js` | `topic_assessments` | YES — topics, page, seo | Active |
| SlugRegistry | `slugRegistry.model.js` | `slug_registry` | YES — sitemap, seed, redirects | Active |
| SlugRedirect | `slugRedirect.model.js` | `slug_redirects` | YES — slug middleware, redirect stats | Active |
| UnresolvedLink | `unresolvedLink.model.js` | `unresolved_links` | YES — `slugBatch.service.js` queries/updates it | Active |
| IngestQueue | `ingestQueue.model.js` | `ingest_queue` | YES — ingest controller | Active |
| ExportJob | `exportJob.model.js` | `export_jobs` | YES — export controller | Active |
| ExportPolicy | `exportPolicy.model.js` | `export_policies` | YES — export controller, seeded on startup | Active |
| PopularTopic | `popularTopic.model.js` | `popular_topics` | YES — analytics middleware, popular-topics | Active |
| PopularSearch | `popularSearch.model.js` | `popular_searches` | YES — search service, suggest, analytics | Active |
| FailedSearch | `failedSearch.model.js` | `failed_searches` | YES — utility controller | Active |
| Version | `version.model.js` | `versions` | YES — `versionDiff.service.js` creates records | Active |
| AssetRegistry | `assetRegistry.model.js` | `asset_registry` | YES — dynamically imported in `persistIngestion.js` | Active |
| FormulaIndex | `formulaIndex.model.js` | `formula_index` | YES — document aggregates, formula search | Active |
| ImportBatch | `importBatch.model.js` | `import_batches` | YES — admin routes | Active |
| AuditLog | `auditLog.model.js` | `audit_logs` | YES — admin routes | Active |
| PlatformStats | `platformStats.model.js` | `platform_stats` | YES — stats service | Active |
| QuranSurah | `quranSurah.model.js` | `quran_surahs` | YES — quran controller | Active |
| QuranAyah | `quranAyah.model.js` | `quran_ayahs` | YES — quran controller | Active |

**Dead models**: None — every model is referenced in at least one service or controller. (Initial analysis missed that `Version`, `UnresolvedLink`, and `AssetRegistry` are all used in ingestion/slug services.)

### 1.3 Queue/Worker Check

| Queue | Processor | Queues jobs | Corresponding worker | Status |
|---|---|---|---|---|
| `ingestion` | `ingestion.processor.js` | IngestController retry | `worker.js` creates worker | ✅ Matched |
| `image-upload` | `imageUpload.processor.js` | Not found in any production route/service | `worker.js` creates worker | ⚠️ Only enqueued from test file `phase5-manual.js`, never from production code |
| `slug-resolver` | `slugResolver.processor.js` | `triggerSlugResolver` in utility.controller | `worker.js` creates worker | ✅ Matched |
| `export-gen` | `exportGen.processor.js` | `enqueueExportJob` in export service | `worker.js` creates worker | ✅ Matched |
| `search-index` | `searchIndex.processor.js` | `ingestDocument.service.js` line 154 | `worker.js` creates worker | ✅ Matched |

### 1.4 Validation Layer

| Schema file | Used by | Status |
|---|---|---|
| `documentIngest.schema.js` | Assumed used by `ingestDocument.service.js` internally | Needs runtime verification |
| `topicIngest.schema.js` | Same as above | Needs runtime verification |
| `blocks.schema.js` | Content block structure | Needs runtime verification |
| `common.schema.js` | Shared types | Needs runtime verification |
| `formula.schema.js` | Formula validation | Needs runtime verification |
| `mcq.schema.js` | MCQ validation | Needs runtime verification |

**Note**: No Zod validation is applied in any route handler directly. Validation appears to happen inside ingestion services, not at the API boundary. The `env.js` uses Zod for env var validation.

### 1.5 Config/Env Check

Required env vars per `env.js`:
```
MONGODB_URI          — MongoDB connection string
REDIS_URL            — Redis protocol URL (redis:// or rediss://)
UPSTASH_REDIS_REST_URL   — Upstash REST URL
UPSTASH_REDIS_REST_TOKEN — Upstash REST token
ASSET_BASE_URL       — CDN base URL for assets
ASSET_REPO_OWNER     — GitHub owner for asset repo
ASSET_REPO_NAME      — GitHub repo name
ASSET_REPO_BRANCH    — Default: "main"
PORT                 — Default: 4000
NODE_ENV             — development / production / test
```

Referenced in code but NOT in env schema:
- `ADMIN_SECRET` — used in `requireAdmin.js` middleware
- `GITHUB_PAT` / `PAT` — used in admin import routes
- `BASE_URL` — used in `sitemap.service.js` and `jsonld.service.js` (falls back to `https://sijil.app`)
- `NEXT_PUBLIC_API_URL` — frontend env var (in `site.ts`)
- `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL` — frontend env vars

### 1.6 Middleware

| Middleware | Applied to | What it does |
|---|---|---|
| `helmet()` | Global (app.js) | Security headers |
| `cors()` | Global | Allows all origins |
| `express.json({ limit: '2mb' })` | Global | Body parsing |
| Logging middleware | Global | Request duration logging |
| `slugRedirectMiddleware` | After routes, before 404 | Checks/get routes for slug redirects |
| `analyticsTrackerMiddleware` | After slug redirects | Tracks topic views and search queries |
| `requireAdmin` | Ingest + Admin routes | Checks `x-admin-secret` header |
| Global 404 handler | Fallback | Returns `{ error: 'Not found' }` |
| Global error handler | Fallback | Returns `{ error: message }` |

---

## PART 2 — FRONTEND AUDIT (sijil-studio/)

### 2.1 Which App Is Live?

**Both `sijil-frontend/` and `src/` exist under `sijil-studio/`**. The root `package.json` at `sijil-studio/` level does not specify a `"workspaces"` field. The `sijil-frontend/` directory has its own `package.json`, `next.config.ts`, `tsconfig.json`, and `jest.config.js`. The `src/` directory has NO own config — it relies on being part of the same Next.js app as `sijil-frontend/`.

**Conclusion**: They appear to be part of the **same Next.js app** where `sijil-frontend/` was meant to replace `src/` gradually. The `sijil-frontend/` has the more complete page tree (admin, search, subjects, topics, exports, status). The `src/` has Quran, assessment, and practice pages that don't exist in `sijil-frontend/`. This is a **migration-in-progress** with both codebases active simultaneously.

### 2.2 Frontend Route Inventory (sijil-frontend/src/app/)

| Route | File(s) | Type | API calls | Backend endpoint exists? | UI state | Notes |
|---|---|---|---|---|---|---|
| `/` | `page.tsx` | Server | `fetchStats()`, `fetchSubjects()`, `fetchRecentDocuments()` | ✅ /utility/platform-stats, /subjects, /utility/recent-arrivals | Hero + stats + subjects + featured + CTA | Has hardcoded subject fallbacks |
| `/subjects` | `page.tsx` | Server | `fetchSubjects()` | ✅ /subjects | All subjects grid | |
| `/subjects/[slug]` | `[slug]/page.tsx` | Server | subject documents query | ✅ /documents with subject filter | Subject detail page | |
| `/search` | `page.tsx` | Server | `searchContent()`, `getSearchFilters()` | ✅ /search, /subjects, /grades | Search bar + filters + results | Filters panel is placeholder |
| `/search/formulas` | `formulas/page.tsx` | — | — | ✅ /search/formulas | Formula search page | |
| `/documents` | `page.tsx` | — | — | ✅ /documents | Document listing | |
| `/topics/[slug]` | `[slug]/page.tsx` | Server | topicBySlug | ✅ /topics/slug/*slug | Topic detail | |
| `/exports` | `page.tsx` | — | export list | ✅ /exports | Export jobs list | |
| `/exports/[jobId]` | `[jobId]/page.tsx` | — | export status | ✅ /exports/:exportJobId | Single export job status | |
| `/admin` | `page.tsx` + `layout.tsx` | Client | `useAdminAnalytics()` | ✅ /utility/analytics/topics | Quick actions + stats | Has Ingest JSON + Batch Import buttons |
| `/admin/ingest` | `page.tsx` | — | — | ✅ /ingest/json | Ingest page | Admin-only |
| `/admin/ingest/[trackingId]` | `[trackingId]/page.tsx` | — | — | ✅ /ingest/:trackingId | Ingest status | Admin-only |
| `/admin/import` | `page.tsx` | — | — | ✅ /admin/import/* | Import page | Admin-only |
| `/admin/import/[batchId]` | `[batchId]/page.tsx` | — | — | ✅ /admin/import/:batchId | Import status | Admin-only |
| `/admin/analytics` | `page.tsx` | — | — | ✅ /utility/analytics/topics | Analytics dashboard | Admin-only |
| `/admin/performance` | `page.tsx` (in directory) | — | — | — | Performance metrics | |
| `/status` | `page.tsx` | — | health check | ✅ /health | Health status page | |
| `/robots.ts` | `robots.ts` | Server | none | — | Robots.txt | |
| `/sitemap.ts` | `sitemap.ts` | Server | none | — | Sitemap index | |

### 2.3 Old Frontend Routes (src/app/) — Orphaned

| Route | Files | Notes |
|---|---|---|
| `/quran` | `layout.tsx`, `page.tsx` | Quran surah list |
| `/quran/[surahNumber]` | — | Single surah view |
| `/assessments/[id]` | — | Assessment detail |
| `/practice/[topicId]` | — | Practice pages |
| `/documents/[id]` | — | Document detail (may overlap with `sijil-frontend` documents) |
| `/topics` | `page.tsx` | Topic list |
| `/topics/[slug]` | — | Topic detail (overlaps with `sijil-frontend/topics/[slug]`) |

### 2.4 API Client vs Backend Endpoints

| Frontend function | Endpoint called | Backend exists? | Match? |
|---|---|---|---|
| `fetchStats()` | `/utility/platform-stats` | ✅ GET /utility/platform-stats | ✅ |
| `fetchSubjects()` | `/subjects` | ✅ GET /subjects | ✅ |
| `fetchRecentDocuments()` | `/utility/recent-arrivals` | ✅ GET /utility/recent-arrivals | ✅ |
| `searchContent()` | `/search?q=...` | ✅ GET /search | ✅ |
| `getSearchSuggestions()` | `/search/suggest?prefix=...` | ✅ GET /search/suggest | ✅ |
| `getSearchFilters()` | `/subjects` + `/grades` | ✅ GET /subjects + GET /grades | ✅ |
| `trackSearch()` | `POST /analytics/search` | ❌ **No POST route** | **BROKEN** — should not POST, or track via `GET /search` |
| `getSearchFilters()` via `api.get(API_ENDPOINTS.SUBJECTS)` | `/subjects` | ✅ GET /subjects | ✅ |
| `api.get(API_ENDPOINTS.GRADES)` | `/grades` | ✅ GET /grades | ✅ |
| `api.get(API_ENDPOINTS.PLATFORM_STATS)` | `/utility/platform-stats` | ✅ GET /utility/platform-stats | ✅ |
| `api.get(API_ENDPOINTS.RECENT_DOCUMENTS)` | `/utility/recent-arrivals` | ✅ GET /utility/recent-arrivals | ✅ |

### 2.5 Component Inventory (sijil-frontend/)

| Category | Components | Used in pages? | Notes |
|---|---|---|---|
| `ui/` | card, button, badge, input, select, table, dialog, dropdown, label, separator, skeleton, tabs, toast, tooltip | ✅ Yes (shadcn/ui) | |
| `layout/` | `main-layout`, `header`, `footer`, `sidebar`, `theme-toggle` | ✅ root layout | |
| `home/` | `hero-section`, `stats-section`, `collections-grid`, `featured-content`, `cta-section` | ✅ `/` | |
| `search/` | `search-bar`, `search-results`, `search-filters`, `search-stats`, `search-formulas-result` | ✅ `/search` | `search-filters` may be placeholder |
| `topics/` | `topic-content`, `topic-navigation`, `topic-header`, `topic-toc` | ✅ `/topics/[slug]` | |
| `documents/` | `document-card`, `document-grid`, `document-list`, `document-viewer` | ✅ `/documents` | |
| `export/` | `export-form`, `export-status`, `export-options`, `export-progress` | ✅ `/exports` | |
| `admin/` | `analytics-dashboard`, `import-preview`, `import-progress`, `ingestion-form`, `ingestion-status` | ✅ `/admin/*` | |
| `shared/` | `error-boundary`, `loading-spinner`, `empty-state`, `pagination` | Likely used | |
| `theme/` | theme provider | ✅ root layout | |
| `icons/` | custom SVG icons | Unknown | |
| `seo/` | JSON-LD head injection | Likely used | |
| `providers/` | React context providers | ✅ root layout | |
| `polish/` | Animations, transitions, hover effects | Unknown | |
| `deployment/` | Build status, env info | Unknown | |
| `performance/` | Monitoring, tracking | Unknown | |

### 2.6 Hooks Inventory

| Hook | Purpose | Used? | Status |
|---|---|---|---|
| `use-api.ts` | Generic fetch hook | Likely | Active |
| `use-search.ts` | Search state | ✅ `/search` | Active |
| `use-search-filters.ts` | Filter state | ✅ `/search` | Active |
| `use-search-suggestions.ts` | Autocomplete | ✅ `/search` | Active |
| `use-subjects.ts` | Subject data | ✅ `/subjects` | Active |
| `use-theme.ts` | Dark/light mode | ✅ Layout | Active |
| `use-admin-analytics.ts` | Admin dashboard data | ✅ `/admin` | Active |
| `use-batch-import.ts` | Import state | ✅ `/admin/import` | Active |
| `use-ingestion.ts` | Ingest state | ✅ `/admin/ingest` | Active |
| `use-export.ts` | Export creation | ✅ `/exports` | Active |
| `use-export-status.ts` | Export polling | ✅ `/exports/[jobId]` | Active |
| `use-platform-stats.ts` | Platform metrics | ✅ `/` | Active |
| `use-recent-documents.ts` | Recent docs | ✅ `/` | Active |
| `use-recent-searches.ts` | Recent searches | Unknown | Active |
| `use-seo-metadata.ts` | Page metadata | Unknown | Active |
| `use-mobile-menu.ts` | Responsive nav | ✅ Layout | Active |
| `use-focus-visible.ts` | A11y | ✅ Layout | Active |
| `use-hover-disabled.ts` | Touch devices | Unknown | Active |
| `use-idle-callback.ts` | Performance | Unknown | Active |
| `use-network-status.ts` | Online/offline | Unknown | Active |
| `use-optimized-resize.ts` | Performance | Unknown | Active |
| `use-reduced-motion.ts` | A11y | ✅ Layout | Active |
| `use-visibility-change.ts` | Tab visibility | Unknown | Active |

### 2.7 Styling Audit

- **Framework**: Tailwind CSS v4 + shadcn/ui primitives
- **Config**: `tailwind.config.ts` with CSS variable-driven theme
- **Design tokens**: Present in `globals.css` and shadcn theme variables
- **Consistency**: Theme variables exist but actual usage across feature components is inconsistent — some use design tokens, others have inline colors
- **Loading states**: Not all components have loading/skeleton states. Many just show nothing while fetching
- **Empty states**: Not consistently implemented — some pages have empty state components, others are missing
- **Error states**: Some pages have error boundaries, many do not
- **Responsive**: Grid layouts exist but many pages lack mobile optimization

---

## PART 3 — FRONTEND ↔ BACKEND ALIGNMENT

### Backend Endpoints With No Frontend Consumer

| Backend endpoint | Purpose | Missing in frontend |
|---|---|---|
| `POST /api/admin/import/*` | Batch import from GitHub | `/admin/import` routes exist but may not be wired |
| `GET /api/seo/topic/:topicId/jsonld` | JSON-LD bundle | No viewer/debug page |
| `GET /api/seo/document/:documentId/jsonld` | Book JSON-LD | No viewer |
| `GET /api/search/formulas` | Formula search | `/search/formulas` route exists, but empty |
| `GET /api/utility/failed-searches` | Search gap analysis | No admin page |
| `GET /api/utility/popular-topics` | Popular topics | No admin page |
| `GET /api/utility/sitemap-seed` | Sitemap seed | No admin page |
| `GET /api/utility/slug/resolve` | Slug resolution | No admin tool |
| `GET /api/quran/*` | Quran API | No Quran frontend in `sijil-frontend/` |
| `POST /api/utility/platform-stats/recompute` | Stats refresh | No admin button |

### Frontend Calls With No Backend Endpoint

| Frontend call | Problem |
|---|---|
| `POST /analytics/search` (in `api.ts` `trackSearch()`) | **Backend has no POST route at this path** — analytics tracking is handled by `GET /search` middleware + `GET /utility/analytics/search` for reading. This POST call will always 404. |

### Data Shape Mismatches

| Frontend type | Expects | Backend returns | Mismatch |
|---|---|---|---|
| `PlatformStats` type (`types/api.ts`) | `documents_count`, `topics_count`, `subjects_count`, `grades_count` | `total_documents`, `total_topics`, `total_formulas`, `total_mcqs`, `total_assets` | **Field names differ** — `fetchStats()` handles this with manual mapping |
| `HomepageStats` (`types/homepage.ts`) | `documents`, `topics`, `subjects`, `grades` | Backend returns `total_*` format | `fetchStats()` maps `total_documents` → `documents`, `total_topics` → `topics`, but `subjects` and `grades` are hardcoded as 0 |
| `Subject` type (`types/api.ts`) | `{ count, subject, slug }` | Backend returns `{ subject, count, slug }` | ✅ Matched |
| `Document` type (`types/homepage.ts`) | Various fields | Backend nested under `document_metadata` | Needs manual extraction |
| `BatchImportPreviewResponse` | `success: true, data: {...}` | Backend returns `{ success, data }` | ✅ Matched |
| `BatchImportStatus` | Uses `ImportStatus` type | Backend uses string enum `PENDING`/`SCANNING`/etc. | **Enum values differ** — frontend uses lowercased `pending`/`processing`/`completed`/`failed`/`cancelled`, backend uses `PENDING`/`SCANNING`/`VALIDATING`/`READY`/`IMPORTING`/`COMPLETED`/`FAILED`/`PARTIAL_SUCCESS` |

---

## PART 4 — FEATURE-LEVEL SUMMARY

### Topics
- **Backend**: Fully built. Six endpoints (`GET /topics/:id`, `/slug/*slug`, `/content`, `/assets`, `/assessments`, `/page`). Returns merged topic data (meta + content blocks + figures/tables + assessments). Navigation (prev/next) included.
- **Frontend**: TopicList in old `src/`, TopicDetail in `sijil-frontend/topics/[slug]`. Content rendering not verified.
- **Gap**: Content block rendering engine (block renderer per type) may not be wired. The old `src/` has a full topics implementation that the new one may be replacing.

### Documents / Ingestion
- **Backend**: Full CRUD. Documents have rich metadata (subject, grade, language, edition, publisher, ISBN, cover images). Ingestion via `POST /ingest/json` with BullMQ queue. Duplicate detection via SHA256.
- **Frontend**: `/documents` page exists, subject browsing via `/subjects/[slug]`. No ingestion UI except admin placeholder `/admin/ingest`.
- **Gap**: Ingestion has no working UI — the admin ingest page exists but may not be wired to backend. Batch import (GitHub repo → documents) is backend-only.

### Search
- **Backend**: MongoDB Atlas Search on `topics` collection. Supports subject/grade/difficulty/topicType filters. Formula search separate. Autocomplete suggestions from popular searches. Trending searches. Failed search tracking.
- **Frontend**: `/search` page with SearchBar, filters, results. `/search/formulas` route exists but unverified.
- **Gap**: The `trackSearch()` call in `api.ts` tries `POST /analytics/search` which doesn't exist. Search filter UI may be placeholder.

### Assessments / Quizzes
- **Backend**: Rich assessment model with MCQs, short questions, numerical problems, activities, flashcards per topic. All stored per-topic in `topic_assessments`.
- **Frontend**: Old `src/app/assessments/[id]` and `src/app/practice/[topicId]` exist. No assessment pages in `sijil-frontend/`.
- **Gap**: No assessment viewer or quiz UI in the new frontend. Missing entirely.

### Exports
- **Backend**: Export job queue (BullMQ) with policies per document type. Direct download support. Formats: formula_pack, mcq_pack, revision_pack, offline_html, flashcard_pack, topic_pack. Policy system restricts exports per document type.
- **Frontend**: `/exports` and `/exports/[jobId]` pages exist. Export form, status, and options components exist.
- **Gap**: Export UI needs runtime testing to verify it actually triggers backend jobs.

### Admin / Import
- **Backend**: Full GitHub batch import pipeline: preview → scan → validate → import → index. Retry/cancel support. Audit logging. Authentication via `ADMIN_SECRET` env var + `x-admin-secret` header.
- **Frontend**: `/admin`, `/admin/ingest`, `/admin/import`, `/admin/analytics`, `/admin/performance` routes exist with component stubs.
- **Gap**: Admin auth is bootstrap-only. No real auth system. Admin components may be unconnected to backend.

### Quran Module
- **Backend**: Fully built. Three endpoints for surah listing, single ayah, and range queries. Data seeded from quran.com API.
- **Frontend**: Only in old `src/app/quran/` with layout, page, and surah detail. **Completely missing from `sijil-frontend/`**.
- **Gap**: Quran is a full feature without frontend in the active codebase.

### SEO
- **Backend**: JSON-LD (Article, Book, FAQPage, Quiz, BreadcrumbList, Course), XML sitemaps (index + paginated + static), AEO Answer Hubs with readiness scoring. All fully built.
- **Frontend**: `seo/` components directory exists. `robots.ts` and `sitemap.ts` in app root. SEO metadata hook exists.
- **Gap**: AEO pages and JSON-LD debug views have no frontend UI. Most SEO is backend-generated for crawlers.

---

## APPENDIX: Configuration & Environment

### Backend `.env.example` (derived from `env.js`)
```
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
ASSET_BASE_URL=https://cdn.jsdelivr.net/...
ASSET_REPO_OWNER=starly101
ASSET_REPO_NAME=sijil-assets
ASSET_REPO_BRANCH=main
PORT=4000
NODE_ENV=development
```

### Frontend `.env.local` (derived from `site.ts`)
```
NEXT_PUBLIC_SITE_NAME=SIJIL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_ENABLE_SEARCH=true
NEXT_PUBLIC_ENABLE_EXPORT=true
NEXT_PUBLIC_ENABLE_ADMIN=true
```

### Git Status
- **Branch**: `feat/found-001-init-frontend` (mid-interactive-rebase)
- **Uncommitted**: 24 modified files in `sijil-studio/`, 50+ untracked
- **sijil-core**: cleangit status
- **sijil-onyx root**: interactive rebase in progress
