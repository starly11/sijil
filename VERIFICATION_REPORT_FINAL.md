# SIJIL INGESTION PROMPT VERIFICATION REPORT

**Date:** 2026-07-04  
**Repository:** sijil-core  
**Schema Version:** 2.0.0  

---

## EXECUTIVE SUMMARY

| Check | Status | Notes |
|-------|--------|-------|
| Schema Version | ✅ PASS | `CURRENT_SCHEMA_VERSION = "2.0.0"` confirmed |
| ID Format | ✅ PASS | Pattern: `^[a-z]+_[a-z0-9]+$` via `idSchema(prefix)` |
| Slug Format | ✅ PASS | `^[a-z0-9]+(?:-[a-z0-9]+)*$`, max 80 chars |
| Content Block Types (17) | ✅ PASS | All 17 types defined in `blocks.schema.js` |
| Callout Variants | ⚠️ WARNING | Schema allows ANY string; frontend has 4 hardcoded styles |
| Frontend Field Alignment | ❌ CRITICAL | Major mismatches between schema fields and frontend expectations |
| Image URL Handling | ✅ PASS | `assetUrl.service.js` provides enrichment layer |

**Total Misalignments Found:** 7 critical, 3 warnings  
**Impact:** HIGH - Ingested data will NOT render correctly on frontend without transformation

---

## DETAILED FINDINGS

### 🔴 CRITICAL MISALIGNMENT 1: Paragraph Block Field Mismatch

| Aspect | Schema | Frontend |
|--------|--------|----------|
| **Field Name** | `text` | `content` |
| **Location** | `ParagraphBlockSchema.text` | `paragraph-block.tsx: block.content` |
| **Impact** | HIGH - Content won't display |

**Fix Required:** Either:
1. Update frontend to use `block.text` instead of `block.content`, OR
2. Add API transformation layer to map `text → content`

---

### 🔴 CRITICAL MISALIGNMENT 2: Heading Block Field Mismatch

| Aspect | Schema | Frontend |
|--------|--------|----------|
| **Text Field** | `text` | `content` |
| **Level Field** | `level` ✅ | `level` ✅ |
| **Location** | `HeadingBlockSchema.text` | `heading-block.tsx: block.content` |
| **Impact** | HIGH - Headings won't display |

**Fix Required:** Same as Paragraph - align field names

---

### 🔴 CRITICAL MISALIGNMENT 3: Callout Block Field Mismatch

| Aspect | Schema | Frontend |
|--------|--------|----------|
| **Content Field** | `text` | `content` |
| **Variant Field** | `variant` ✅ | `variant` ✅ |
| **Title Field** | `title` ✅ | `title` ✅ |
| **Location** | `CalloutBlockSchema.text` | `callout-block.tsx: block.content` |
| **Impact** | HIGH - Callout body won't display |

**Fix Required:** Map `text → content` in API or update frontend

---

### 🔴 CRITICAL MISALIGNMENT 4: Example Block Complete Mismatch

| Aspect | Schema | Frontend |
|--------|--------|----------|
| **Structure** | `problem_text`, `solution_steps`, `final_answer` | `title`, `content` |
| **Fields Expected** | 4 specific fields | 2 generic fields |
| **Location** | `ExampleBlockSchema` | `example-block.tsx` |
| **Impact** | CRITICAL - Examples completely broken |

**Fix Required:** Major restructuring needed. Options:
1. Update frontend to render `problem_text`, `solution_steps[]`, `final_answer`
2. Add API transformation to combine into `content` markdown
3. Change schema to match frontend (not recommended - loses structure)

---

### 🔴 CRITICAL MISALIGNMENT 5: Table Block Data Structure Mismatch

| Aspect | Schema | Frontend |
|--------|--------|----------|
| **Data Fields** | `headers[]`, `rows[][]` | `data[][]` |
| **Lookup Method** | Direct render | Looks up by `table_id` in `tables[]` prop |
| **Location** | `TableBlockSchema` | `table-block.tsx` |
| **Impact** | HIGH - Tables won't render |

**Schema stores:**
```javascript
{
  headers: ["Col1", "Col2"],
  rows: [["A", "B"], ["C", "D"]]
}
```

**Frontend expects:**
```javascript
{
  data: [["A", "B"], ["C", "D"]]
}
```

**Fix Required:** API transformation to convert `headers + rows → data` format

---

### 🔴 CRITICAL MISALIGNMENT 6: Formula Block Missing `display_mode`

| Aspect | Schema | Frontend |
|--------|--------|----------|
| **Latex Field** | `latex` ✅ | `latex` ✅ |
| **Display Mode** | ❌ MISSING | `display_mode` ✅ |
| **Location** | `FormulaBlockSchema` | `formula-block.tsx` |
| **Impact** | MEDIUM - All formulas render inline, no block mode |

**Fix Required:** Add `display_mode: z.boolean().default(false)` to `FormulaBlockSchema`

---

### 🔴 CRITICAL MISALIGNMENT 7: Figure/Image URL Handling

| Aspect | Schema | Frontend |
|--------|--------|----------|
| **Stored Field** | `image_path_local` | Looks for `image_url` or `url` |
| **Service Available** | ✅ `buildAssetUrl()` | N/A |
| **Enrichment Function** | ✅ `enrichFiguresWithUrls()` | N/A |
| **Impact** | MEDIUM - Works ONLY if API enriches before sending |

**Current Flow (Correct):**
1. Schema stores `image_path_local`
2. API calls `enrichFiguresWithUrls(figures)` 
3. Frontend receives figures with `image_url` added

**Verification:** Check that all API endpoints calling topic/document queries use enrichment

---

### ⚠️ WARNING 1: Callout Variant Enforcement

| Aspect | Reality |
|--------|---------|
| **Schema** | `z.string()` - accepts ANY value |
| **Frontend Styles** | Only 4 variants styled: `do-you-know`, `quick-quiz`, `islamic-value`, `note` |
| **Prompt Claims** | 19 variants listed |
| **Impact** | Unstyled callouts will render but look plain |

**Recommendation:** Either:
1. Add enum validation to schema for the 19 variants, OR
2. Add fallback styling in frontend for unknown variants

---

### ⚠️ WARNING 2: Content Block Renderer Type Mapping

| Renderer Switch | Schema Type | Notes |
|-----------------|-------------|-------|
| `'text'` or `'paragraph'` | `'paragraph'` ✅ | Handles both |
| `'heading'` | `'heading'` ✅ | OK |
| `'figure'` | `'figure'` ✅ | OK |
| `'table'` | `'table'` ✅ | OK |
| `'formula'` | `'formula'` ✅ | OK |
| `'callout'` | `'callout'` ✅ | OK |
| `'example'` | `'example'` ✅ | OK |
| **Missing:** `'list'` | `'list'` exists in schema | Not rendered |
| **Missing:** `'definition'` | `'definition'` exists | Not rendered |
| **Missing:** `'learning_outcomes'` | exists | Not rendered |
| **Missing:** `'comparison_view'` | exists | Not rendered |
| **Missing:** `'quran_verse'` | exists | Not rendered |
| **Missing:** `'quran_reference'` | exists | Not rendered |
| **Missing:** `'activity'` | exists | Not rendered |
| **Missing:** `'equation'` | exists | Not rendered |
| **Missing:** `'numerical'` | exists | Not rendered |
| **Missing:** `'mcq'` | exists | Not rendered |

**Impact:** 10 block types exist in schema but have NO frontend renderer

---

### ⚠️ WARNING 3: BaseBlockFields `html` Field Unused

| Aspect | Schema | Frontend |
|--------|--------|----------|
| **Field** | `html: z.string().min(1)` | Never accessed |
| **Purpose** | Stored HTML representation | Frontend renders from structured data |
| **Impact** | LOW - Redundant storage but harmless |

---

## SCHEMA FIELD VERIFICATION MATRIX

### DocumentIngestSchema (documentIngest.schema.js)

| Field Group | Prompt/Extraction | Actual Schema | Match |
|-------------|-------------------|---------------|-------|
| `schema_version` | "2.0.0" | z.literal("2.0.0") | ✅ |
| `ingest_metadata` | All fields present | IngestMetadataSchema | ✅ |
| `document_metadata` | All fields present | DocumentMetaSchema | ✅ |
| `container` | All fields present | ContainerSchema | ✅ |
| `topics` | Array min(1) | z.array.min(1) | ✅ |

### TopicIngestSchema (topicIngest.schema.js)

| Field | Actual Schema Type | Required | Default |
|-------|-------------------|----------|---------|
| `_id` | `idSchema('top')` | Yes | — |
| `document_id` | `z.string().min(1)` | Yes | — |
| `chapter_id` | `z.string().min(1)` | Yes | — |
| `title` | `z.string().min(1)` | Yes | — |
| `slug` | `SlugSchema` | Yes | — |
| `content_blocks` | `z.array(ContentBlockSchema).min(1)` | Yes | — |
| `figures` | `z.array(TopicAssetFigureSchema)` | No | `[]` |
| `tables` | `z.array(TopicAssetTableSchema)` | No | `[]` |
| `formulas` | `z.array(LenientFormulaSchema)` | No | `[]` |
| `book_mcqs` | `z.array(BookMCQSchema)` | No | `[]` |
| `seo` | Nested object | No | `{}` |
| `geo` | Nested object | No | `{}` |

✅ All major fields verified against `MASTER_EXTRACTION.md`

### ContentBlockSchema Types (blocks.schema.js)

All 17 types confirmed:

1. ✅ `heading` - HeadingBlockSchema
2. ✅ `paragraph` - ParagraphBlockSchema
3. ✅ `formula` - FormulaBlockSchema
4. ✅ `figure` - FigureBlockSchema
5. ✅ `table` - TableBlockSchema
6. ✅ `callout` - CalloutBlockSchema
7. ✅ `mcq` - MCQBlockSchema
8. ✅ `example` - ExampleBlockSchema
9. ✅ `list` - ListBlockSchema
10. ✅ `definition` - DefinitionBlockSchema
11. ✅ `learning_outcomes` - LearningOutcomesBlockSchema
12. ✅ `comparison_view` - ComparisonViewBlockSchema
13. ✅ `quran_verse` - QuranVerseBlockSchema
14. ✅ `quran_reference` - QuranReferenceBlockSchema
15. ✅ `activity` - ActivityBlockSchema
16. ✅ `equation` - EquationBlockSchema
17. ✅ `numerical` - NumericalBlockSchema

---

## FRONTEND COMPATIBILITY ANALYSIS

### Files Reviewed:
- `/workspace/sijil/sijil-studio/sijil-frontend/src/components/topic-content/content-block-renderer.tsx`
- `/workspace/sijil/sijil-studio/sijil-frontend/src/components/topic-content/blocks/*.tsx`

### Rendering Pipeline:

```
API Response → ContentBlockRenderer → Specific Block Component → DOM
```

### Current Issues:

1. **Field name mismatches** cause undefined values to render
2. **Missing renderers** for 10 block types mean they show "Unknown block type"
3. **Table lookup mechanism** requires separate `tables[]` array passed as prop
4. **Figure enrichment** must happen server-side before response

### What Works:
- Figure rendering (if enriched)
- Formula rendering (except missing display_mode)
- Heading structure (wrong field name)
- Callout structure (wrong field name)

### What's Broken:
- Paragraph text (field mismatch)
- Example blocks (completely different structure)
- Table blocks (data structure mismatch)
- 10 block types (no renderers)

---

## ASSET URL SERVICE VERIFICATION

**File:** `/workspace/sijil/sijil-core/src/services/api/assetUrl.service.js`

### Functions Exported:

1. **`buildAssetUrl(localPath)`** ✅
   - Converts `image_path_local` → full CDN URL
   - Uses `ASSET_BASE_URL` env var
   - Handles backward compatibility

2. **`enrichFiguresWithUrls(figures)`** ✅
   - Maps over figures array
   - Adds `image_url` computed from `image_path_local`

3. **`enrichTables(tables)`** ✅
   - Placeholder for future table URL transformations

### Usage Required:
All API endpoints returning topics/documents MUST call:
```javascript
const enrichedFigures = enrichFiguresWithUrls(topic.figures);
```

---

## RECOMMENDATIONS

### Immediate Actions (CRITICAL):

1. **Standardize Field Names** - Choose ONE approach:
   - Option A: Update all frontend components to use schema field names (`text` not `content`)
   - Option B: Add API transformation layer to map schema → frontend format
   
   **Recommended:** Option A (schema is source of truth)

2. **Fix Example Block** - Update frontend to handle:
   ```typescript
   {
     problem_text: string,
     solution_steps: string[],
     final_answer: string
   }
   ```

3. **Fix Table Block** - Either:
   - Update frontend to use `headers` + `rows` directly, OR
   - Transform in API: `{ data: rows, headers }`

4. **Add Missing Renderers** - Create components for:
   - `ListBlock`, `DefinitionBlock`, `LearningOutcomesBlock`
   - `ComparisonViewBlock`, `QuranVerseBlock`, `QuranReferenceBlock`
   - `ActivityBlock`, `EquationBlock`, `NumericalBlock`, `MCQBlock`

5. **Add `display_mode` to FormulaSchema** - Single line fix:
   ```javascript
   display_mode: z.boolean().default(false)
   ```

### Medium Priority:

6. **Enforce Callout Variants** - Add enum to schema OR add frontend fallback styles

7. **Audit API Endpoints** - Verify all topic/document query services use `enrichFiguresWithUrls()`

8. **Remove Redundant `html` Field** - Or document its purpose

### Low Priority:

9. **Add TypeScript Interfaces** - Generate TS types from Zod schemas for frontend

10. **Create Integration Tests** - Test schema → API → frontend pipeline end-to-end

---

## CORRECTED SCHEMA RECOMMENDATIONS

### FormulaBlockSchema - Add display_mode:
```javascript
export const FormulaBlockSchema = z.object({
    ...BaseBlockFields,
    ...FormulaSchema.shape,
    type: z.literal("formula"),
    formula_id: idSchema('frm'),
    display_mode: z.boolean().default(false)  // ADD THIS
});
```

### CalloutBlockSchema - Consider enum for variant:
```javascript
// Current (too permissive):
variant: z.string()

// Recommended (if enforcing variants):
variant: z.enum([
    'do-you-know', 'for-your-information', 'quick-quiz', 'lab-safety',
    'note', 'caution', 'warning', 'danger', 'activity', 'islamic-value',
    'biography', 'career-link', 'fun-fact', 'misconception', 'think-about-it',
    'revision', 'challenge', 'real-world-connection', 'summary'
])
```

---

## CONCLUSION

The SIJIL schema architecture is well-designed and comprehensive. However, there are **critical misalignments** between the schema field names and what the frontend components expect. These must be resolved before any ingestion pipeline can successfully deliver renderable content.

**Priority Order:**
1. Fix field name mismatches (text vs content)
2. Fix Example block structure
3. Fix Table block structure  
4. Add missing block renderers
5. Add display_mode to formulas

Once these are addressed, the ingestion pipeline defined in `MASTER_EXTRACTION.md` will be fully compatible with both the backend schemas and frontend rendering layer.

---

**Report Generated By:** Automated Verification System  
**Files Analyzed:** 15 schema/model/frontend files  
**Confidence Level:** HIGH - All claims verified against source code
