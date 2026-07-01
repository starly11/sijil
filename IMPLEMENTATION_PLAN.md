# SIJIL Implementation Plan

## Current State Analysis

### Backend (sijil-core) ✅ MOSTLY COMPLETE
- **Server**: Express.js on port 4000 (not 3001!)
- **Routes**: All major routes implemented
  - `/api/subjects` - Subject listing
  - `/api/documents/:id` - Document details
  - `/api/topics/:path` - Topic content
  - `/api/search` - Full-text search
  - `/api/quran/*` - Quran endpoints
  - `/api/admin/*` - Admin operations
  - `/api/exports` - Export jobs
  - `/api/utility/*` - Stats, analytics

### Frontend (sijil-studio/sijil-frontend) ⚠️ NEEDS WORK
- **Framework**: Next.js 16 + React 19 + TypeScript ✅
- **Styling**: Tailwind CSS 4 (needs custom design tokens)
- **API Client**: Configured but wrong base URL (expects 3001, backend runs on 4000)
- **Existing Pages**:
  - Homepage (`/`) - Partially complete
  - Subjects Index (`/subjects`) - Basic implementation
  - Admin pages - Skeleton only
  - Missing: Subject Detail, Book Detail, Topic Reader, Search, Quran, Export, Status

## Critical Issues to Fix

1. **API Base URL Mismatch**: Frontend expects `localhost:3001`, backend runs on `localhost:4000`
2. **Design System**: Need to implement teal/orange color scheme from ARCHITECTURE.md
3. **Missing Screens**: 13 out of 18 screens need implementation
4. **Typography**: Currently using Inter + Merriweather, should be Inter + Source Sans Pro

## Build Sequence

### Phase 1: Foundation Setup (Day 1)
1. Update `.env` with correct API URL (`http://localhost:4000/api`)
2. Update Tailwind config with custom colors (teal #0D9488, orange #EA580C)
3. Update globals.css with new design tokens
4. Update layout.tsx fonts (Inter + Source Sans Pro)
5. Create reusable UI components (Button, Card, Badge, etc.)

### Phase 2: Core Content Screens (Days 2-4)
6. **Subject Detail** (`/subjects/[slug]`) - Show grades and books
7. **Book Detail** (`/documents/[id]`) - Chapter listings, metadata
8. **Topic Reader** (`/topics/[[...slug]]`) - Main reading experience
9. Improve Homepage with better hero and featured sections

### Phase 3: Search & Discovery (Day 5)
10. **Search Results** (`/search`) - Full-text search UI
11. **Formula Search** (`/search/formulas`) - Specialized formula search

### Phase 4: Quran Section (Day 6)
12. **Quran Index** (`/quran`) - Surah listing
13. **Surah Reader** (`/quran/[surahNumber]`) - Individual surah display

### Phase 5: User Features (Day 7)
14. **Export Jobs** (`/exports`) - Export history and downloads
15. **Status Page** (`/status`) - Platform health

### Phase 6: Admin Dashboard (Days 8-10)
16. **Admin Home** (`/admin`) - Dashboard overview
17. **Ingest Queue** (`/admin/ingest`) - Ingestion management
18. **Ingest Detail** (`/admin/ingest/[trackingId]`) - Progress tracking
19. **Batch Import** (`/admin/import`) - GitHub import tool
20. **Import Status** (`/admin/import/[batchId]`) - Batch tracking
21. **Analytics** (`/admin/analytics`) - Traffic metrics
22. **Performance** (`/admin/performance`) - Technical metrics

### Phase 7: Polish (Day 11)
23. Loading skeletons for all pages
24. Error boundaries and fallbacks
25. SEO optimization (meta tags, structured data)
26. Performance optimization
27. Accessibility audit

## File Structure to Create

```
src/
├── app/
│   ├── subjects/
│   │   └── [slug]/
│   │       └── page.tsx          # NEW: Subject Detail
│   ├── documents/
│   │   └── [id]/
│   │       └── page.tsx          # NEW: Book Detail
│   ├── topics/
│   │   └── [[...slug]]/
│   │       └── page.tsx          # IMPROVE: Topic Reader
│   ├── search/
│   │   ├── page.tsx              # NEW: Search Results
│   │   └── formulas/
│   │       └── page.tsx          # NEW: Formula Search
│   ├── quran/
│   │   ├── page.tsx              # IMPROVE: Quran Index
│   │   └── [surahNumber]/
│   │       └── page.tsx          # IMPROVE: Surah Reader
│   ├── exports/
│   │   └── page.tsx              # NEW: Export Jobs
│   ├── status/
│   │   └── page.tsx              # NEW: Status Page
│   └── admin/
│       ├── page.tsx              # IMPROVE: Admin Home
│       ├── ingest/
│       │   ├── page.tsx          # IMPROVE: Ingest Queue
│       │   └── [trackingId]/
│       │       └── page.tsx      # NEW: Ingest Detail
│       ├── import/
│       │   ├── page.tsx          # IMPROVE: Batch Import
│       │   └── [batchId]/
│       │       └── page.tsx      # NEW: Import Status
│       ├── analytics/
│       │   └── page.tsx          # IMPROVE: Analytics
│       └── performance/
│           └── page.tsx          # IMPROVE: Performance
├── components/
│   ├── ui/                       # Base UI components
│   ├── layout/                   # Layout components
│   ├── home/                     # Homepage components
│   ├── subjects/                 # Subject-related components
│   ├── documents/                # Document-related components
│   ├── topics/                   # Topic reader components
│   ├── search/                   # Search components
│   ├── quran/                    # Quran components
│   ├── exports/                  # Export components
│   └── admin/                    # Admin components
└── lib/
    ├── api/                      # API client
    └── utils/                    # Utility functions
```

## Design Tokens to Implement

### Colors
```css
--primary: 174 72% 33%      /* #0D9488 Teal */
--primary-foreground: 0 0% 100%
--accent: 23 80% 48%        /* #EA580C Orange */
--accent-foreground: 0 0% 100%
--background: 30 5% 98%     /* #FAFAF9 Warm White */
--foreground: 24 8% 10%     /* #1C1917 Near Black */
--border: 30 5% 90%         /* #E7E5E4 Light Gray */
```

### Typography
- Headings: Inter (600, 700)
- Body: Source Sans Pro (400, 600)
- Code: JetBrains Mono

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64

### Border Radius
- Cards: 8px
- Buttons: 6px
- Inputs: 4px
