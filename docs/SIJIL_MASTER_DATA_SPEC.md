# SIJIL MASTER DATA SPECIFICATION v2.0
## Complete Field Dictionary for Qwen/OpenHands Conversion Engine

**Purpose**: This document contains EVERY field from ALL MongoDB models used in SIJIL platform. Use this as the definitive reference when constructing the Master Prompt for the Qwen 3.6 + OpenHands sandbox conversion system.

**Platform**: SIJIL - AI-Powered Educational Content Platform  
**Conversion Target**: PDF/Image → Structured JSON → GitHub Repository → MongoDB Ingestion  
**Processing Time**: 4-5 minutes per book  
**Output Format**: JSON files + Images folder + Assets  

---

## TABLE OF CONTENTS

1. [Core Content Models](#1-core-content-models)
2. [Organizational Models](#2-organizational-models)
3. [Quran Models](#3-quran-models)
4. [Ingestion & Import Models](#4-ingestion--import-models)
5. [SEO & GEO Fields Summary](#5-seo--geo-fields-summary)
6. [System Models](#6-system-models)
7. [Analytics Models](#7-analytics-models)
8. [Master JSON Template](#8-master-json-template)

---

## 1. CORE CONTENT MODELS

### 1.1 DOCUMENT MODEL (`documents` collection)
**Purpose**: Stores structural source textbooks, curriculum frameworks, and publication-level manifest catalogs.

#### Root Fields
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | String | YES | - | Unique document identifier |
| `title` | String | NO | - | Human-readable title |
| `slug` | String | NO | - | URL-friendly slug |
| `schema_version` | String | NO | "2.0.0" | Schema version string |
| `schema_type` | String | YES | - | Type: "textbook", "sop", "course" |
| `is_archived` | Boolean | NO | false | Archive flag |
| `archived_at` | Date | NO | null | Archive timestamp |
| `type_specific_data` | Mixed | NO | {} | Flexible extra data |
| `created_at` | Date | AUTO | - | Creation timestamp |
| `updated_at` | Date | AUTO | - | Update timestamp |

#### `ingest_metadata` Object
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `ingest_id` | String | YES | - | Unique ingestion job ID |
| `engine` | String | NO | - | Conversion engine name |
| `model_version` | String | NO | - | LLM model version used |
| `prompt_version` | String | NO | - | Prompt version used |
| `ingest_timestamp` | Date | NO | - | When ingestion occurred |
| `processing_time_seconds` | Number | NO | - | Total processing time |
| `source_file_name` | String | NO | - | Original PDF/image filename |
| `source_file_sha256` | String | NO | - | SHA256 hash of source file |
| `source_file_size_bytes` | Number | NO | - | File size in bytes |
| `page_count` | Number | NO | - | Total pages in source |
| `image_count` | Number | NO | - | Total images extracted |
| `token_count_input` | Number | NO | - | Input tokens to LLM |
| `token_count_output` | Number | NO | - | Output tokens from LLM |
| `confidence_score` | Number | NO | - | 0-1 confidence score |
| `warnings` | String[] | NO | [] | Warning messages |
| `status` | String | NO | "pending" | Enum: pending, processing, complete, error |
| `zod_validation_passed` | Boolean | NO | false | Schema validation result |
| `zod_errors` | Mixed[] | NO | [] | Validation error details |

#### `document_metadata` Object
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | String | YES | - | Metadata ID |
| `document_id` | String | YES | - | Document reference ID |
| `title` | String | YES | - | Book title |
| `title_vernacular` | String | NO | "" | Title in Urdu |
| `subtitle` | String | NO | "" | Subtitle |
| `document_type` | String | NO | - | Type: textbook, sop, manual |
| `subject` | String | NO | - | Subject name |
| `subject_slug` | String | NO | - | Subject slug |
| `grade_level` | String | NO | - | Grade: "9", "10", "11", "12" |
| `grade_numeric` | Number | NO | - | Numeric grade |
| `language` | String | NO | "english" | Primary language |
| `script_direction` | String | NO | "ltr" | Enum: ltr, rtl |
| `secondary_language` | String | NO | "" | Secondary language |
| `edition_year` | Number | NO | - | Publication year |
| `edition_number` | String | NO | - | Edition number |
| `isbn` | String | NO | "" | ISBN number |
| `publisher` | String | NO | - | Publisher name |
| `board_or_authority` | String | NO | - | Educational board |
| `country` | String | NO | - | Country code |
| `curriculum_standard` | String | NO | - | Curriculum standard |
| `authors` | String[] | NO | [] | List of authors |
| `editors` | String[] | NO | [] | List of editors |
| `reviewers` | String[] | NO | [] | List of reviewers |
| `category` | String | NO | - | Category |
| `sub_category` | String | NO | - | Sub-category |
| `tags` | String[] | NO | [] | Tags for search |
| `rights_status` | String | NO | - | Copyright status |
| `cover_image_url` | String | NO | "" | Cover image URL |
| `thumbnail_url` | String | NO | "" | Thumbnail URL |
| `content_hash` | String | NO | - | Content fingerprint |
| `document_version` | String | NO | "1.0.0" | Document version |
| `parent_document_id` | String | NO | null | Parent document reference |
| `is_latest` | Boolean | NO | true | Is latest version |

##### `document_metadata.access_control` Object
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `is_premium` | Boolean | NO | false | Premium content flag |
| `preview_percentage` | Number | NO | 100 | Preview percentage (0-100) |
| `paywall_trigger_elements` | String[] | NO | [] | Elements behind paywall |
| `allowed_roles` | String[] | NO | ["anonymous"] | Allowed user roles |

#### `container` Object (Chapter-Level)
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | String | YES | - | Container ID |
| `container_type` | String | NO | "chapter" | Type: chapter, unit, module |
| `number` | Number | YES | - | Chapter number |
| `display_label` | String | NO | - | Display label |
| `title` | String | YES | - | Chapter title |
| `title_vernacular` | String | NO | "" | Title in Urdu |
| `slug` | String | YES | - | Chapter slug |
| `page_range.start` | Number | NO | - | Start page |
| `page_range.end` | Number | NO | - | End page |
| `total_pages` | Number | NO | - | Total pages in chapter |
| `global_objectives` | String[] | NO | [] | Learning objectives |
| `chapter_summary_verbatim` | String | NO | "" | Chapter summary |
| `opening_quote` | String | NO | "" | Opening quote |
| `opening_image_description` | String | NO | "" | Opening image description |

#### `topic_refs` Array
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | String | YES | - | Topic ID |
| `slug` | String | YES | - | Topic slug |
| `slug_global` | String | YES | - | Global unique slug |
| `title` | String | YES | - | Topic title |
| `display_order` | Number | NO | 0 | Display order |
| `url_path` | String | YES | - | Full URL path |

#### `document_aggregates` Object
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `total_topics` | Number | 0 | Total topics |
| `total_blocks` | Number | 0 | Total content blocks |
| `total_formulas` | Number | 0 | Total formulas |
| `total_images` | Number | 0 | Total images |
| `total_tables` | Number | 0 | Total tables |
| `total_mcqs` | Number | 0 | Total MCQs |
| `total_short_questions` | Number | 0 | Total short questions |
| `total_numerical_problems` | Number | 0 | Total numerical problems |
| `total_key_terms` | Number | 0 | Total key terms |
| `total_flashcards` | Number | 0 | Total flashcards |
| `all_key_terms` | String[] | [] | All key terms list |
| `all_formulas` | String[] | [] | All formulas list |
| `all_figures` | String[] | [] | All figures list |

##### `document_aggregates.difficulty_distribution` Object
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `easy` | Number | 0 | Easy count |
| `medium` | Number | 0 | Medium count |
| `hard` | Number | 0 | Hard count |

#### `seo_master` Object - CRITICAL FOR SEO/AEO/GEO
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `meta_title` | String | "" | SEO meta title |
| `meta_description` | String | "" | SEO meta description |
| `canonical_url` | String | "" | Canonical URL |
| `og_title` | String | "" | Open Graph title |
| `og_description` | String | "" | Open Graph description |
| `og_image` | String | "" | Open Graph image URL |
| `og_type` | String | "article" | Open Graph type |
| `twitter_card` | String | "summary_large_image" | Twitter card type |
| `keywords` | String[] | [] | SEO keywords |
| `focus_keyword` | String | "" | Primary focus keyword |
| `robots` | String | "index, follow" | Robots meta |
| `sitemap_priority` | Number | 0.5 | Sitemap priority (0-1) |
| `sitemap_changefreq` | String | "monthly" | Sitemap change frequency |
| `json_ld_schemas` | String[] | [] | JSON-LD schema types |

##### `seo_master.aeo` Object - ANSWER ENGINE OPTIMIZATION
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `primary_question` | String | "" | Primary question this content answers |
| `featured_snippet_block` | String | "" | Optimized block for featured snippets |
| `answer_type` | String | "definition" | Type: definition, list, table, steps |
| `entity_type` | String | "Concept" | Entity type for knowledge graphs |
| `faq_count` | Number | 0 | Number of FAQs |

##### `seo_master.geo` Object - GENERATIVE ENGINE OPTIMIZATION
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `entity_name` | String | "" | Entity name for LLMs |
| `entity_type` | String | "EducationalTopic" | Entity type |
| `authoritative_source` | String | "" | Authoritative source citation |
| `citation_format` | String | "" | Citation format |
| `trustworthiness_signals` | String[] | [] | Trust signals (E-E-A-T) |
| `llm_summary` | String | "" | LLM-generated summary for RAG |

#### `publishing` Object
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | String | "draft" | Enum: draft, processing, published |
| `published_at` | Date | null | Publication timestamp |
| `updated_at` | Date | null | Last update timestamp |
| `url_path` | String | "" | Published URL path |

##### `publishing.export_manifest` Object
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `web` | String | "not_published" | Web export status |
| `json_raw` | String | "not_generated" | Raw JSON status |
| `pdf_formatted` | String | "not_generated" | PDF export status |
| `epub` | String | "not_generated" | EPUB export status |
| `lms_scorm` | String | "not_generated" | SCORM package status |
| `flashcard_deck` | String | "not_generated" | Flashcard deck status |
| `formula_pack_pdf` | String | "not_generated" | Formula pack PDF status |

#### `version_control` Object
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `document_version` | String | "1.0.0" | Version string |
| `schema_version` | String | "2.0.0" | Schema version |
| `prompt_version` | String | - | Prompt version used |
| `commit_timestamp` | Date | - | Git commit timestamp |
| `commit_hash` | String | "" | Git commit hash |
| `change_log` | String | "" | Change log |
| `previous_version_id` | String | null | Previous version ID |
| `is_latest` | Boolean | true | Is latest version |

---

### 1.2 TOPIC MODEL (`topics` collection)
**Purpose**: Stores sub-chapters with localization, indexing, and telemetry.

#### Root Fields
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | String | YES | - | Unique topic ID |
| `document_id` | String | YES | - | Parent document ID |
| `chapter_id` | String | YES | - | Parent chapter ID |
| `parent_topic_id` | String | NO | null | Parent topic for nesting |
| `title` | String | YES | - | Topic title |
| `title_vernacular` | String | NO | "" | Title in Urdu |
| `slug` | String | YES | - | Topic slug |
| `slug_global` | String | YES | - | Global unique slug (unique, indexed) |
| `url_path` | String | YES | - | Full URL path |
| `section_number` | String | NO | - | Section number |
| `display_order` | Number | NO | 0 | Display order |
| `topic_type` | String | NO | "content" | Enum: content, exercise, intro, summary, quran |
| `difficulty` | String | NO | "medium" | Enum: easy, medium, hard |
| `difficulty_score` | Number | NO | - | 0-1 difficulty score |
| `estimated_read_time_minutes` | Number | NO | - | Estimated read time |
| `bloom_level` | String | NO | - | Bloom's taxonomy level |
| `subject` | String | NO | - | Subject name |
| `grade_numeric` | Number | NO | - | Numeric grade |
| `language` | String | NO | "english" | Language |
| `locale` | String | NO | "en" | Locale |
| `publishing_status` | String | NO | "draft" | Enum: draft, processing, published |
| `keywords` | String[] | NO | [] | Keywords |
| `key_terms_preview` | String[] | NO | [] | Preview of key terms |
| `formula_count` | Number | NO | 0 | Formula count |
| `figure_count` | Number | NO | 0 | Figure count |
| `mcq_count` | Number | NO | 0 | MCQ count |
| `has_interactive` | Boolean | NO | false | Has interactive elements |
| `source_page_start` | Number | NO | - | Source page start |
| `source_page_end` | Number | NO | - | Source page end |
| `word_count` | Number | NO | 0 | Word count |
| `version` | String | NO | "1.0.0" | Version |
| `is_latest` | Boolean | NO | true | Is latest |
| `is_archived` | Boolean | NO | false | Is archived |
| `archived_at` | Date | NO | null | Archive timestamp |

#### `design_theme` Object
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `is_hardcoded` | Boolean | false | Use hardcoded theme |
| `palette.primary` | String | "var(--fallback-primary)" | Primary color |
| `palette.secondary` | String | "var(--fallback-secondary)" | Secondary color |
| `palette.accent` | String | "var(--fallback-accent)" | Accent color |
| `palette.surface` | String | "var(--fallback-surface)" | Surface color |

#### `seo` Object
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `meta_title` | String | "" | Meta title |
| `meta_description` | String | "" | Meta description |
| `canonical_url` | String | "" | Canonical URL |
| `focus_keyword` | String | "" | Focus keyword |
| `keywords` | String[] | [] | Keywords |
| `breadcrumb` | String[] | [] | Breadcrumb trail |
| `json_ld_types` | String[] | [] | JSON-LD schema types |

#### `geo` Object - GENERATIVE ENGINE OPTIMIZATION
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `llm_summary` | String | "" | LLM-generated summary for RAG |
| `authoritative_source` | String | "" | Authoritative source |
| `citation_format` | String | "" | Citation format |
| `entity_name` | String | "" | Entity name |
| `entity_type` | String | "" | Entity type |
| `trustworthiness_signals` | String[] | [] | E-E-A-T trust signals |
| `source_citations[]` | Object[] | - | Source citations array |

##### `geo.source_citations[]` Object
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `verbatim_quote` | String | "" | Verbatim quote |
| `page_number` | Number | null | Page number |
| `context` | String | "" | Context |

#### `design_meta` Object
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `primary_color_theme` | String | - | Primary color theme |
| `icon_suggestion` | String | - | Suggested icon |
| `layout_template` | String | "standard" | Enum: standard, two-col, formula-heavy, image-heavy, comparison |
| `animation_complexity` | String | - | Animation complexity |

#### `internal_links_suggested` Array
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `slug` | String | "" | Target slug |
| `title` | String | "" | Target title |
| `url_path` | String | "" | Target URL path |
| `relevance` | String | "" | Relevance description |

---

### 1.3 TOPIC CONTENT MODEL (`topic_content` collection)
**Purpose**: Stores rich content blocks, entities, and Quran data.

#### Root Fields
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | String | YES | - | Unique content ID |
| `topic_id` | String | YES | - | Topic ID |
| `document_id` | String | YES | - | Document ID |
| `raw_text` | String | NO | - | Raw extracted text |
| `clean_html` | String | NO | - | Cleaned HTML |
| `content_blocks` | Mixed[] | NO | [] | **ARRAY OF CONTENT BLOCKS** |

#### `content_blocks[]` Array - RICH CONTENT STRUCTURE
Each block has a `type` field. Types: `paragraph`, `heading`, `formula`, `diagram`, `figure`, `table`, `callout`, `quiz`

**Example Structures:**

```json
{"type": "paragraph", "id": "para_001", "content": "Text...", "order": 1}
{"type": "heading", "id": "head_001", "level": 2, "content": "Heading", "order": 2}
{"type": "formula", "id": "form_001", "latex": "E = mc^2", "name": "Mass-Energy", "variables": [...], "order": 3}
{"type": "diagram", "id": "diag_001", "diagram_type": "p5js", "code": "// p5.js code", "caption": "...", "order": 4}
{"type": "figure", "id": "fig_001", "image_url": "/assets/...", "caption": "...", "alt": "...", "order": 5}
{"type": "table", "id": "tab_001", "headers": [...], "rows": [...], "caption": "...", "order": 6}
{"type": "callout", "id": "call_001", "variant": "info", "title": "Note", "content": "...", "order": 7}
{"type": "quiz", "id": "quiz_001", "question": "?", "options": ["A","B","C","D"], "correct_answer": "A", "order": 8}
```

#### `formulas` Array
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Formula ID |
| `formula_id` | String | Formula identifier |
| `name` | String | Formula name |
| `latex` | String | LaTeX representation |
| `text` | String | Plain text |
| `variables[]` | Object[] | Variables with symbol, name, unit, description |
| `formula_type` | String | Type classification |
| `subject_area` | String | Subject area |
| `source_page` | Number | Source page |
| `block_order_ref` | Number | Reference to content_blocks order |

#### `key_terms` Array
| Field | Type | Description |
|-------|------|-------------|
| `term` | String | Term |
| `definition` | String | Definition |
| `term_type` | String | Term type |
| `first_occurrence_page` | Number | First page |
| `related_terms` | String[] | Related terms |

#### `examples` Array
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Example ID |
| `example_number` | String | Example number |
| `title` | String | Title |
| `problem_text` | String | Problem |
| `solution_steps` | String[] | Steps |
| `final_answer` | String | Answer |
| `formula_used` | String | Formula |
| `source_page` | Number | Page |

#### `callouts` Array
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Callout ID |
| `variant` | String | Variant: info, warning, tip, note |
| `title` | String | Title |
| `text` | String | Text |
| `source_page` | Number | Page |

#### `ai_answer_hub` Array - FOR AEO
| Field | Type | Description |
|-------|------|-------------|
| `question_intent` | String | Question intent |
| `answer_markdown` | String | Markdown answer |
| `answer_plain` | String | Plain answer |
| `answer_type` | String | Type |
| `confidence` | Number | 0-1 confidence |
| `citation` | String | Citation |

#### `faq` Array - FOR SCHEMA.ORG
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | FAQ ID |
| `question` | String | Question |
| `answer` | String | Answer |
| `schema_type` | String | Schema type |
| `source_page` | Number | Page |

#### `entity_extraction` Object
| Field | Type | Description |
|-------|------|-------------|
| `core_concepts` | String[] | Core concepts |
| `scientific_laws` | String[] | Laws |
| `historical_figures` | String[] | Figures |
| `units_and_standards` | String[] | Units |
| `instruments_mentioned` | String[] | Instruments |
| `cross_concept_links[]` | Object[] | Cross-links |

#### `downloadable_outputs` Object
| Field | Type | Description |
|-------|------|-------------|
| `formula_pack` | String[] | Formula pack URLs |
| `cheat_sheet_summary` | String | Summary |
| `exam_hot_spots` | String[] | Hot spots |
| `revision_notes_markdown` | String | Notes |

#### `source_citations` Array
| Field | Type | Description |
|-------|------|-------------|
| `verbatim_quote` | String | Quote |
| `page_number` | Number | Page |
| `context` | String | Context |

#### `quran_data` Mixed
**MUST NOT contain Arabic glyphs** - Urdu translation only.

---

### 1.4 TOPIC ASSESSMENT MODEL (`topic_assessments` collection)
**Purpose**: Stores quizzes, exercises, and activities.

#### Root Fields
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | String | YES | - | Assessment ID |
| `topic_id` | String | YES | - | Topic ID |
| `document_id` | String | YES | - | Document ID |

#### `book_mcqs` Array
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | MCQ ID |
| `question_number` | String | Number |
| `question_text` | String | Question |
| `options.a/b/c/d` | String | Options |
| `correct_answer` | String | a/b/c/d |
| `explanation` | String | Explanation |
| `difficulty` | String | easy/medium/hard |
| `source_page` | Number | Page |
| `past_paper_years` | String[] | Years |

#### `book_short_questions` Array
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Question ID |
| `question_text` | String | Question |
| `model_answer` | String | Answer |
| `marks` | Number | Marks |
| `source_page` | Number | Page |

#### `book_problems` Array (Numerical)
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Problem ID |
| `problem_text` | String | Problem |
| `given` | Mixed | Given data |
| `required` | String | To find |
| `solution_steps` | String[] | Steps |
| `final_answer` | String | Answer |
| `diagram_required` | Boolean | Diagram? |
| `source_page` | Number | Page |

#### `activities` Array (Lab)
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Activity ID |
| `title` | String | Title |
| `activity_type` | String | Type |
| `apparatus` | String[] | Apparatus |
| `procedure_steps` | String[] | Steps |
| `precautions` | String[] | Precautions |
| `expected_result` | String | Result |

#### `flashcards` Array
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Flashcard ID |
| `front` | String | Front |
| `back` | String | Back |
| `cloze` | String | Cloze |

---

### 1.5 TOPIC ASSET MODEL (`topic_assets` collection)
**Purpose**: Stores figures and tables.

#### Root Fields
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | String | YES | - | Asset ID |
| `topic_id` | String | YES | - | Topic ID |
| `document_id` | String | YES | - | Document ID |

#### `figures` Array
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Figure ID |
| `figure_number` | String | Number |
| `caption` | String | Caption |
| `alt` | String | Alt text |
| `source_page` | Number | Page |
| `image_url` | String | URL |
| `image_path_local` | String | Local path |
| `render_strategy` | String | image/svg/animation/3d |
| `svg_code` | String | SVG code |
| `animation_type` | String | Animation type |
| `has_labels` | Boolean | Has labels |
| `label_descriptions` | String[] | Labels |
| `unsplash_search_query` | String | Unsplash query |

#### `tables` Array
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Table ID |
| `table_number` | String | Number |
| `caption` | String | Caption |
| `headers` | String[] | Headers |
| `rows` | String[][] | Rows |
| `render_as` | String | styled-table/chart/infographic |

---

## 2. ORGANIZATIONAL MODELS

### 2.1 FORMULA INDEX MODEL (`formula_index` collection)
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Formula ID |
| `name` | String | Name |
| `latex` | String | LaTeX |
| `text` | String | Text |
| `latex_normalized` | String | Normalized |
| `variables` | String[] | Variables |
| `topic_id` | String | Topic ID |
| `document_id` | String | Document ID |
| `subject` | String | Subject |
| `grade` | Number | Grade |

---

## 3. QURAN MODELS

### 3.1 QURAN SURAH MODEL (`quran_surahs` collection)
| Field | Type | Description |
|-------|------|-------------|
| `surah_number` | Number | 1-114 |
| `name_arabic` | String | Arabic name |
| `name_english` | String | English name |
| `name_urdu` | String | Urdu name |
| `total_ayahs` | Number | Total ayahs |
| `revelation_type` | String | Meccan/Medinan |

### 3.2 QURAN AYAH MODEL (`quran_ayahs` collection)
| Field | Type | Description |
|-------|------|-------------|
| `surah` | Number | Surah number |
| `ayah` | Number | Ayah number |
| `text_uthmani` | String | Arabic text |
| `translation_ur` | String | Urdu translation |
| `translation_en` | String | English translation |
| `juz` | Number | Juz number |
| `page` | Number | Page number |

---

## 4. INGESTION & IMPORT MODELS

### 4.1 INGEST QUEUE MODEL (`ingest_queue` collection)
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Ingest ID |
| `source_file_name` | String | Filename |
| `source_file_sha256` | String | SHA256 |
| `status` | String | pending/processing/complete/error |
| `attempts` | Number | Attempts |
| `processing_time_seconds` | Number | Time |

### 4.2 IMPORT BATCH MODEL (`import_batches` collection)
| Field | Type | Description |
|-------|------|-------------|
| `batch_id` | String | Batch ID |
| `repo_url` | String | GitHub URL |
| `repo_owner` | String | Owner |
| `repo_name` | String | Repo name |
| `commit_sha` | String | Commit SHA |
| `status` | String | PENDING/SCANNING/VALIDATING/READY/IMPORTING/COMPLETED/FAILED |
| `total_documents` | Number | Total docs |
| `imported_documents` | Number | Imported |
| `failed_documents` | Number | Failed |
| `successful_files[]` | Object[] | Success list |
| `failed_files[]` | Object[] | Failure list |
| `warnings[]` | Object[] | Warnings |
| `errors[]` | Object[] | Errors |
| `progress` | Object | Progress tracking |

### 4.3 ASSET REGISTRY MODEL (`asset_registry` collection)
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Asset ID |
| `type` | String | figure/table_export/document_cover/etc |
| `local_path` | String | Local path |
| `sha256` | String | SHA256 |
| `file_size_bytes` | Number | Size |

---

## 5. SEO & GEO FIELDS SUMMARY

### SEO Fields
- `meta_title`, `meta_description`, `canonical_url`
- `og_title`, `og_description`, `og_image`, `og_type`
- `twitter_card`
- `keywords`, `focus_keyword`
- `robots`, `sitemap_priority`, `sitemap_changefreq`
- `json_ld_schemas`, `breadcrumb`

### AEO Fields (Answer Engine Optimization)
- `primary_question`, `featured_snippet_block`
- `answer_type`, `entity_type`, `faq_count`
- `ai_answer_hub[]`, `faq[]`

### GEO Fields (Generative Engine Optimization)
- `entity_name`, `entity_type`
- `authoritative_source`, `citation_format`
- `trustworthiness_signals[]`, `llm_summary`
- `source_citations[]` with verbatim quotes

---

## 6. SYSTEM MODELS

### 6.1 EXPORT JOB MODEL
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Export ID |
| `topic_id` | String | Topic ID |
| `format` | String | formula_pack/mcq_pack/etc |
| `status` | String | pending/processing/complete/error |
| `output_url` | String | Output URL |

### 6.2 VERSION MODEL
| Field | Type | Description |
|-------|------|-------------|
| `scope` | String | document/topic |
| `entity_id` | String | Entity ID |
| `version` | String | Version |
| `diff_summary` | String | Diff |

### 6.3 SLUG REGISTRY MODEL
| Field | Type | Description |
|-------|------|-------------|
| `slug` | String | Slug |
| `slug_global` | String | Global slug |
| `entity_type` | String | document/chapter/topic |
| `url_path` | String | URL path |

### 6.4 SLUG REDIRECT MODEL
| Field | Type | Description |
|-------|------|-------------|
| `old_slug`, `new_slug` | String | Slugs |
| `old_url_path`, `new_url_path` | String | Paths |
| `redirect_type` | String | 301 |

### 6.5 AUDIT LOG MODEL
| Field | Type | Description |
|-------|------|-------------|
| `action` | String | Action type |
| `admin_id` | String | Admin ID |
| `batch_id` | String | Batch ID |
| `result` | String | success/failure/partial |

### 6.6 PLATFORM STATS MODEL (Singleton)
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | "global_stats" |
| `total_documents` | Number | Total |
| `total_topics` | Number | Total |
| `recent_arrivals[]` | Object[] | Last 10 |

---

## 7. ANALYTICS MODELS

### 7.1 FAILED SEARCH MODEL
| Field | Type | Description |
|-------|------|-------------|
| `query` | String | Query |
| `count` | Number | Count |

### 7.2 POPULAR SEARCH MODEL
| Field | Type | Description |
|-------|------|-------------|
| `query` | String | Query |
| `count` | Number | Count |
| `top_result_id` | String | Top result |

### 7.3 POPULAR TOPIC MODEL
| Field | Type | Description |
|-------|------|-------------|
| `topic_id` | String | Topic ID |
| `view_count` | Number | Views |
| `last_30_days_views` | Number | Recent views |

### 7.4 UNRESOLVED LINK MODEL
| Field | Type | Description |
|-------|------|-------------|
| `slug_ref` | String | Slug |
| `source_topic_id` | String | Source |
| `reviewed` | Boolean | Reviewed |

---

## 8. MASTER JSON TEMPLATE

Your Qwen/OpenHands converter MUST produce JSON with this exact structure:

```json
{
  "_id": "chem-12-chapter-01",
  "schema_version": "2.0.0",
  "schema_type": "textbook",
  
  "ingest_metadata": {
    "ingest_id": "ingest_001",
    "engine": "qwen-openhands",
    "model_version": "qwen-3.6",
    "prompt_version": "v2.0",
    "processing_time_seconds": 285,
    "source_file_name": "chemistry-12.pdf",
    "source_file_sha256": "abc123...",
    "page_count": 250,
    "image_count": 85,
    "confidence_score": 0.95,
    "status": "complete",
    "zod_validation_passed": true
  },
  
  "document_metadata": {
    "_id": "chem-12-chapter-01",
    "document_id": "chem-12-chapter-01",
    "title": "Chemistry Class 12",
    "title_vernacular": "کیمسٹری کلاس 12",
    "subject": "Chemistry",
    "subject_slug": "chemistry",
    "grade_level": "12",
    "grade_numeric": 12,
    "language": "english",
    "secondary_language": "urdu",
    "publisher": "FBISE",
    "board_or_authority": "Federal Board",
    "country": "PK",
    "tags": ["chemistry", "class-12", "fbise"],
    "cover_image_url": "/assets/covers/chem-12.jpg"
  },
  
  "container": {
    "_id": "chem-12-chap-01",
    "container_type": "chapter",
    "number": 1,
    "title": "Chemical Bonding",
    "title_vernacular": "کیمیائی بانڈنگ",
    "slug": "chemical-bonding",
    "global_objectives": ["Understand ionic bonds"],
    "chapter_summary_verbatim": "This chapter covers..."
  },
  
  "topic_refs": [
    {
      "_id": "chem-12-topic-01",
      "slug": "introduction-to-bonding",
      "slug_global": "chemistry-12-introduction-to-bonding",
      "title": "Introduction to Chemical Bonding",
      "display_order": 1,
      "url_path": "/topics/chemistry/12/chemical-bonding/introduction-to-bonding"
    }
  ],
  
  "document_aggregates": {
    "total_topics": 10,
    "total_formulas": 25,
    "total_images": 30,
    "total_mcqs": 50,
    "all_key_terms": ["bond", "ion", "electron"],
    "all_formulas": ["E=mc²"]
  },
  
  "seo_master": {
    "meta_title": "Chemistry Class 12 - Chemical Bonding | SIJIL",
    "meta_description": "Complete guide to chemical bonding...",
    "canonical_url": "https://si
