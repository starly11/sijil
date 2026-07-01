# SIJIL Platform Architecture & Design System

## 🎯 Platform Vision
A robust, SEO/AEO-focused educational platform organizing thousands of books, SOPs, formulas, and Quranic content in a hierarchical, user-friendly structure optimized for search engines and reader experience.

---

## 🏗️ ARCHITECTURE OVERVIEW

### Public Site (11 Screens)
1. **Homepage** `/` - Entry point with subject browsing, featured content, search
2. **Subjects Index** `/subjects` - Complete listing of all subjects with metadata
3. **Subject Detail** `/subjects/[slug]` - Grades and books available for specific subject
4. **Book Detail** `/documents/[id]` - Chapter listings, book metadata, related resources
5. **Topic Reader** `/topics/[[...slug]]` - Main reading experience with navigation
6. **Search Results** `/search?q=` - Full-text search results with filters
7. **Formula Search** `/search/formulas` - Specialized formula/equation search
8. **Quran Section** `/quran` - Surah index with metadata
9. **Surah Reader** `/quran/[surahNumber]` - Individual surah display with translations
10. **Export Jobs** `/exports` - User's export history and downloads
11. **Status Page** `/status` - Platform health and system status

### Admin Dashboard (7 Screens)
12. **Admin Home** `/admin` - Dashboard overview, quick stats, recent activity
13. **Ingest Queue** `/admin/ingest` - Document ingestion management
14. **Ingest Detail** `/admin/ingest/[trackingId]` - Progress tracking for individual ingests
15. **Batch Import** `/admin/import` - GitHub repo bulk import tool
16. **Import Status** `/admin/import/[batchId]` - Batch operation tracking
17. **Analytics** `/admin/analytics` - Traffic, engagement, SEO metrics
18. **Performance** `/admin/performance` - Technical metrics, API latency, errors

---

## 🎨 DESIGN SYSTEM

### Color Palette
**Primary**: Teal `#0D9488` (trust, knowledge, growth)
**Accent**: Orange `#EA580C` (energy, action, highlights)
**Neutral Scale**:
- Background: `#FAFAF9` (warm white)
- Surface: `#FFFFFF` (pure white)
- Border: `#E7E5E4` (light gray)
- Text Primary: `#1C1917` (near black)
- Text Secondary: `#57534E` (medium gray)
- Dark Mode Background: `#0C0A09`
- Dark Mode Surface: `#1C1917`

**Semantic Colors**:
- Success: `#10B981` (green)
- Warning: `#F59E0B` (amber)
- Error: `#EF4444` (red)
- Info: `#3B82F6` (blue)

### Typography
**Headings**: Inter (weights: 600, 700)
**Body**: Source Sans Pro (weights: 400, 600)
**Monospace**: JetBrains Mono (for formulas, code)

### UI Style Guidelines
- **Design Language**: Flat design with subtle depth
- **Border Radius**: 8px (cards), 6px (buttons), 4px (inputs)
- **Spacing Scale**: 4px base unit
- **Micro-interactions**: Hover 150ms ease-out, Focus 2px ring, Active scale(0.98)

---

## 📁 CONTENT HIERARCHY
```
Subject → Grade → Book → Chapter → Topic
```

### URL Structure
- Subjects: `/subjects` → `/subjects/mathematics`
- Books: `/documents/[documentId]`
- Topics: `/topics/subject/grade/book/chapter/topic-slug`
- Quran: `/quran` → `/quran/1`
- Search: `/search?q=query`

---

## 🔌 API ENDPOINT MAPPING

### Public Endpoints
| Endpoint | Method | Purpose | Screen |
|----------|--------|---------|--------|
| `/api/subjects` | GET | List all subjects | Subjects Index |
| `/api/subjects/:slug` | GET | Subject details | Subject Detail |
| `/api/documents/:id` | GET | Book/chapter details | Book Detail |
| `/api/topics/:path` | GET | Topic content | Topic Reader |
| `/api/search` | GET | Full-text search | Search Results |
| `/api/quran/surahs` | GET | List surahs | Quran Section |
| `/api/quran/:surahNumber` | GET | Surah content | Surah Reader |
| `/api/exports` | GET | Export history | Export Jobs |
| `/api/status` | GET | Platform health | Status Page |

### Admin Endpoints
| Endpoint | Method | Purpose | Screen |
|----------|--------|---------|--------|
| `/api/admin/stats` | GET | Dashboard stats | Admin Home |
| `/api/admin/ingest` | POST/GET | Ingestion management | Ingest Queue |
| `/api/admin/ingest/:id` | GET | Ingest progress | Ingest Detail |
| `/api/admin/import/github` | POST | GitHub batch import | Batch Import |
| `/api/admin/import/:batchId` | GET | Import status | Import Status |
| `/api/admin/analytics` | GET | Traffic/SEO metrics | Analytics |
| `/api/admin/performance` | GET | Technical metrics | Performance |

---

## 🚀 BUILD SEQUENCE

### Phase 1: Foundation (Days 1-2)
- Next.js 16 + TypeScript setup
- Tailwind CSS with custom design tokens
- Base layout components (Header, Footer, Nav)
- Dark mode system

### Phase 2: Core Content Screens (Days 3-5)
- Homepage, Subjects Index, Subject Detail
- Book Detail, Topic Reader

### Phase 3: Search & Discovery (Days 6-7)
- Search Results, Formula Search

### Phase 4: Quran Section (Day 8)
- Quran Index, Surah Reader

### Phase 5: User Features (Day 9)
- Export Jobs, Status Page

### Phase 6: Admin Dashboard (Days 10-12)
- All 7 admin screens

### Phase 7: Polish (Days 13-14)
- Loading states, SEO, Performance, Accessibility

---

## 📊 SUCCESS METRICS
- Lighthouse: 95+
- FCP: < 1.5s
- TTI: < 3.5s
- Organic traffic: 20% MoM growth
- Bounce rate: < 40%

---

## 🛠️ TECH STACK
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4
- **Components**: Radix UI + custom
- **State**: TanStack Query
- **Icons**: Lucide React
- **Deployment**: Vercel/Docker
- **Monitoring**: Sentry, Vercel Analytics

---

*Single source of truth for SIJIL development.*
