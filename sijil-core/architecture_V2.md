cat > /mnt/user-data/outputs/PLATFORM_MASTER_ARCHITECTURE_v2.md << 'DOCEOF'

# DOCUMENT INTELLIGENCE PLATFORM — MASTER ARCHITECTURE

## The Constitution v2.0: Schema · Infrastructure · SEO/AEO/GEO · Operations

### June 2026 | Muhammad Ali (Starly) | DO NOT DEVIATE FROM THIS DOCUMENT



---



> **What this document is:**

> The single source of truth before any code is written, any prompt is engineered,

> or any database collection is created. Qwen treats this as law during ingestion.

> Engineers treat this as the contract. Nothing ships that contradicts this.

>

> **What changed in v2.0:**

> + Immutable ID system (nanoid) — slugs are now cosmetic only

> + Topic collection split into 4 focused collections (performance fix)

> + BullMQ + Redis replaces MongoDB as job queue (reliability fix)

> + Zod validation layer between Qwen output and database (quality fix)

> + Re-ingestion versioning with content_hash diffing (data integrity fix)

> + Slug redirect table for zero dead links (404 elimination)

> + Atlas Search / OpenSearch replaces custom search_index (scale fix)

> + Presentation layer fully isolated from content layer (design fix)



---



# PART 1 — PLATFORM IDENTITY & MISSION



## What This Platform Is



A **Document Intelligence & Headless Publishing Engine** that:

1. Ingests any PDF/document — textbook, legal, SOP, course, policy, manual, finance

2. Converts it into deeply structured, semantically rich, validated JSON

3. Splits that JSON into performance-optimized collections

4. Publishes it as beautiful, animated, SEO/AEO/GEO-optimized web content

5. Serves it headlessly to any frontend, LMS, mobile app, or API consumer

6. Makes every formula, table, diagram, concept, and question interactive and discoverable



## What Makes It Unstoppable



| Advantage | How |

|---|---|

| Qwen 3.5 — 1M context | Full chapter in one shot. No chunking. No stitching errors. |

| Schema-first | Every field locked before a single PDF is touched |

| Immutable IDs | Slug changes never cause 404s. Ever. |

| 4-collection split | Topics never bloat. Queries stay fast at 100+ books/month. |

| AEO-native | Every topic outputs featured-snippet-ready answer blocks |

| GEO-native | Every entity extracted, linked, source-cited for AI crawlers |

| Zod validation | Malformed AI output never reaches the database |

| Write-once, publish-everywhere | One pipeline → web, PDF, EPUB, LMS, API, Anki |



---



# PART 2 — DOCUMENT TYPE REGISTRY



Every document type shares the Base Schema (Part 3).

Each type extends it with its own fields under `type_specific_data`.



| Type Key | Human Label | Examples |

|---|---|---|

| `textbook` | School/University Textbook | PCTB, NCERT, OpenStax |

| `course` | Online Course / Training | Udemy scripts, corporate training decks |

| `sop` | Standard Operating Procedure | Factory, hospital, IT runbooks |

| `legal` | Contract / Policy / Agreement | NDAs, ToS, employment contracts |

| `kyc_onboarding` | KYC / Onboarding Forms | Bank forms, HR onboarding packets |

| `research_paper` | Academic Paper | Journals, theses, white papers |

| `manual` | Technical / User Manual | Product manuals, API docs |

| `finance` | Financial Report / Audit | Annual reports, balance sheets |

| `curriculum` | Curriculum / Syllabus | Board syllabi, course outlines |

| `reference` | Encyclopedia / Glossary / Dictionary | Reference works, term databases |



## Type-Specific Fields



### TEXTBOOK

```

chapter_number, chapter_number_display

student_learning_outcomes[]           // SLOs exactly as printed

chapter_summary_verbatim              // printed summary, word for word

exercise_section {

  mcqs[], short_questions[], long_questions[],

  numerical_problems[], past_paper_questions[]

}

callout_types: [

  "do-you-know", "for-your-information", "quick-quiz",

  "lab-safety", "activity", "note", "caution", "warning",

  "islamic-value", "quran-verse", "biography", "career-link",

  "fun-fact", "misconception", "think-about-it", "revision",

  "challenge", "extension", "real-world-connection"

]

quran_module {                        // only for Islamic/Quran books

  surah, ayah, word_alignments[],

  textbook_urdu_translation, tafsir_snippet

  // RULE: NO Arabic glyphs in any JSON field. Ever.

}

diagram_render_strategy: "svg" | "image" | "animation"

```



### COURSE

```

course_metadata {

  total_modules, total_lessons, total_duration_minutes

  difficulty: "beginner" | "intermediate" | "advanced"

  prerequisites[], certification: bool, instructor_name

}

module { module_number, title, lessons[] }

lesson {

  lesson_number, title, duration_minutes

  lesson_type: "video" | "reading" | "quiz" | "project" | "live"

  transcript_text, key_takeaways[], resources[]

  assignment { type, instructions, rubric }

}

quiz { questions[], pass_score, attempts_allowed }

project { title, brief, deliverables[], evaluation_criteria[] }

```



### SOP

```

sop_metadata {

  sop_id, department, effective_date, review_date,

  version, approved_by, revision_history[]

}

scope_and_purpose

roles_and_responsibilities[] { role, responsibilities[] }

procedure_steps[] {

  step_number, title, description, responsible_role,

  inputs[], outputs[], decision_point: bool,

  if_yes_goto, if_no_goto, warnings[], notes[],

  estimated_time_minutes, compliance_tags[]

}

references[], glossary[]

```



### LEGAL

```

document_parties[] {

  name, role: "party_a"|"party_b"|"witness"|"notary"

  entity_type: "individual"|"company"|"government"

}

effective_date, expiry_date, jurisdiction

clauses[] {

  clause_number, clause_title, clause_text_verbatim

  clause_type: "obligation"|"right"|"definition"|"exclusion"|"penalty"

  party_affected

  risk_flag: "high" | "medium" | "low" | null

  plain_english_summary, action_required: bool, deadline

}

defined_terms[] { term, definition }

signatures_required[], amendment_history[]

```



### KYC / ONBOARDING

```

form_fields[] {

  field_id, label, field_type, required: bool,

  validation_rule, regulatory_ref,

  data_sensitivity: "public"|"internal"|"confidential"|"restricted"

}

sections[] { title, fields[] }

instructions_verbatim, required_attachments[], submission_process

```



### RESEARCH PAPER

```

abstract_verbatim, keywords_author_supplied[]

methodology { design, sample, tools[], analysis_method }

hypothesis, findings_summary, limitations[], future_work[]

citations[] { citation_id, authors[], year, title, journal, doi, url }

figures[] { figure_number, caption, description }

tables[] { table_number, caption, data[][] }

conflict_of_interest, funding_source

```



### MANUAL

```

product_name, product_model, product_version, target_audience

safety_warnings[] { severity: "danger"|"warning"|"caution", text }

specifications_table { headers[], rows[][] }

installation_steps[], troubleshooting[] { symptom, cause, solution }

maintenance_schedule[], warranty_info, support_contact

```



### FINANCE

```

reporting_period { start_date, end_date }

company_name, fiscal_year

financial_statements[] {

  statement_type: "balance_sheet"|"income_statement"|"cash_flow"|"equity"

  line_items[] { label, current_period, prior_period, variance, variance_pct }

}

auditor_name, audit_opinion

key_ratios[] { name, value, benchmark, interpretation }

risk_factors[], management_discussion_verbatim

```



---



# PART 3 — THE BASE SCHEMA



Every ingested document produces this structure.

Type-specific fields merge under `type_specific_data`.



```jsonc

{

  // ═══════════════════════════════════════════════════

  // LAYER 0: SCHEMA & INGEST METADATA

  // ═══════════════════════════════════════════════════

  "schema_version": "2.0.0",

  "schema_type": "textbook",



  "ingest_metadata": {

    "ingest_id": "ing_7f3kx9p2m",          // nanoid, generated by queue service

    "engine": "Qwen3.5-1M-OpenHands",

    "model_version": "qwen3.5-235b-a22b",

    "prompt_version": "v3.0",

    "ingest_timestamp": "2026-06-21T10:00:00Z",

    "processing_time_seconds": 210,

    "source_file_name": "physics-grade9-pctb-2024.pdf",

    "source_file_sha256": "a3f9c...",      // fingerprint — prevents duplicate ingestion

    "source_file_size_bytes": 8420000,

    "page_count": 284,

    "image_count": 815,

    "token_count_input": 84000,

    "token_count_output": 120000,

    "confidence_score": 0.94,              // 0.0–1.0, Qwen self-assessed

    "warnings": [],                        // ["Page 47 had low OCR confidence"]

    "status": "complete",                  // pending|processing|complete|error

    "zod_validation_passed": true,

    "zod_errors": []

  },



  // ═══════════════════════════════════════════════════

  // LAYER 1: DOCUMENT METADATA

  // ═══════════════════════════════════════════════════

  "document_metadata": {

    // IDENTITY — both fields always present

    "_id": "doc_8k2np4qr",                 // IMMUTABLE nanoid. Generated before Qwen runs.

    "document_id": "pk-pctb-phys-9",       // human-readable, deterministic

    // ↑ _id never changes. document_id slug can be corrected if misspelled.



    "title": "Physics Class 9",

    "title_vernacular": "",

    "subtitle": "",

    "document_type": "textbook",

    "subject": "Physics",

    "subject_slug": "physics",

    "grade_level": "Grade 9",

    "grade_numeric": 9,

    "language": "english",

    "script_direction": "ltr",

    "secondary_language": "urdu",

    "edition_year": 2024,

    "edition_number": "3rd",

    "isbn": "",

    "publisher": "Punjab Curriculum and Textbook Board (PCTB)",

    "board_or_authority": "Punjab",

    "country": "Pakistan",

    "curriculum_standard": "PCTB 2024",

    "authors": ["Author Name 1"],

    "editors": [],

    "reviewers": [],

    "category": "education",

    "sub_category": "science",

    "tags": ["physics", "grade-9", "pctb", "pakistan", "mechanics"],

    "rights_status": "public_domain_educational",

    "cover_image_url": "",

    "thumbnail_url": "",



    // VERSIONING — see Part 6 for re-ingestion rules

    "content_hash": "sha256-of-raw-pdf-bytes",

    "document_version": "1.0.0",

    "parent_document_id": null,            // null for first ingest, set on re-ingest

    "is_latest": true,



    // ACCESS CONTROL (Monetization & Gating)

    "access_control": {

      "is_premium": "boolean",

      "preview_percentage": "number (0-100)",

      "paywall_trigger_elements": "array of strings (e.g., ['assessments', 'flashcards'])",

      "allowed_roles": "array of strings (e.g., ['anonymous', 'free_user', 'premium_subscriber'])"

    }

  },



  // ═══════════════════════════════════════════════════

  // LAYER 2: CONTAINER (Chapter / Module / Section)

  // ═══════════════════════════════════════════════════

  "container": {

    "_id": "ch_5m7qr3np",                  // IMMUTABLE nanoid

    "container_type": "chapter",

    "number": 1,

    "display_label": "Chapter 1",

    "title": "Physical Quantities and Measurements",

    "title_vernacular": "",

    "slug": "physical-quantities-and-measurements",

    "page_range": { "start": 5, "end": 27 },

    "total_pages": 22,

    "global_objectives": [],

    "chapter_summary_verbatim": "",

    "opening_quote": "",

    "opening_image_description": ""

  },



  // ═══════════════════════════════════════════════════

  // LAYER 3: TOPICS — reference array only

  // Full topic data lives in split collections (see Part 5)

  // ═══════════════════════════════════════════════════

  "topic_refs": [

    {

      "_id": "top_9x82j1k",

      "slug": "vernier-callipers",

      "slug_global": "pk-pctb-phys-9-ch1-vernier-callipers",

      "title": "Vernier Callipers",

      "display_order": 5,

      "url_path": "/curriculum/pk/grade-9/physics/vernier-callipers-top9x82j1k"

    }

    // ... one ref per topic

  ],



  // ═══════════════════════════════════════════════════

  // LAYER 4: DOCUMENT-LEVEL AGGREGATES

  // ═══════════════════════════════════════════════════

  "document_aggregates": {

    "total_topics": 12,

    "total_formulas": 34,

    "total_images": 47,

    "total_tables": 8,

    "total_mcqs": 20,

    "total_short_questions": 15,

    "total_numerical_problems": 10,

    "total_key_terms": 67,

    "total_flashcards": 45,

    "all_key_terms": [],

    "all_formulas": [],

    "all_figures": [],

    "difficulty_distribution": { "easy": 3, "medium": 6, "hard": 3 }

  },



  // ═══════════════════════════════════════════════════

  // LAYER 5: SEO / AEO / GEO — document level

  // ═══════════════════════════════════════════════════

  "seo_master": {

    "meta_title": "",

    "meta_description": "",

    "canonical_url": "",

    "og_title": "",

    "og_description": "",

    "og_image": "",

    "og_type": "article",

    "twitter_card": "summary_large_image",

    "keywords": [],

    "focus_keyword": "",

    "robots": "index, follow",

    "sitemap_priority": 0.8,

    "sitemap_changefreq": "monthly",

    "json_ld_schemas": ["Book", "EducationalOccupationalProgram", "LearningResource"],

    "aeo": {

      "primary_question": "",

      "featured_snippet_block": "",

      "answer_type": "definition",

      "entity_type": "Concept",

      "faq_count": 0

    },

    "geo": {

      "entity_name": "",

      "entity_type": "EducationalTopic",

      "authoritative_source": "PCTB Physics Grade 9 (2024)",

      "citation_format": "PCTB Physics Grade 9 (2024), Chapter 1",

      "trustworthiness_signals": ["official_curriculum", "board_published"],

      "llm_summary": ""

    }

  },



  // ═══════════════════════════════════════════════════

  // LAYER 6: PUBLISHING

  // ═══════════════════════════════════════════════════

  "publishing": {

    "status": "draft",

    "published_at": null,

    "updated_at": null,

    "url_path": "/curriculum/pk/grade-9/physics/chapter-1",

    "export_manifest": {

      "web": "published",

      "json_raw": "available",

      "pdf_formatted": "not_generated",

      "epub": "not_generated",

      "lms_scorm": "not_generated",

      "flashcard_deck": "not_generated",

      "formula_pack_pdf": "not_generated"

    },

    "syndication_targets": []

  },



  // ═══════════════════════════════════════════════════

  // LAYER 7: VERSION CONTROL

  // ═══════════════════════════════════════════════════

  "version_control": {

    "document_version": "1.0.0",

    "schema_version": "2.0.0",

    "prompt_version": "v3.0",

    "commit_timestamp": "2026-06-21T10:00:00Z",

    "commit_hash": "",

    "change_log": "Initial ingestion",

    "previous_version_id": null,

    "is_latest": true

  },



  // ═══════════════════════════════════════════════════

  // LAYER 8: TYPE-SPECIFIC EXTENSION

  // ═══════════════════════════════════════════════════

  "type_specific_data": {

    // Merged from Part 2 based on schema_type

  }

}

```



---



# PART 4 — THE IMMUTABLE ID SYSTEM



## The Problem This Solves



Slugs change. A typo gets fixed. A chapter is renamed. A topic merges with another.

Every slug change breaks every URL that references it — 404s, broken internal links,

broken external links, broken search index entries.



**Immutable IDs mean zero of that happens. Ever.**



## The Law



```

RULE 1: Every Document, Chapter, and Topic gets a nanoid the moment it enters

        the ingest queue. Qwen never generates IDs. Qwen only generates slugs.



RULE 2: The _id field is set ONCE. It is never regenerated, never overwritten,

        never modified — not on re-ingest, not on slug correction, not on version update.



RULE 3: All database lookups and API fetches use _id internally.

        Slugs are used ONLY for URL display and human readability.



RULE 4: URL structure always appends a short ID suffix to the slug:

        /curriculum/physics/vernier-callipers-top9x82j1k

        The router reads everything after the last hyphen as the ID.

        The slug portion is purely cosmetic and can change freely.



RULE 5: When a slug changes, the old slug is written to slug_redirects

        collection as a 301 redirect. Zero dead links. Always.

```



## ID Prefixes (for readable logs and debugging)



```

doc_   → Document          (e.g. doc_8k2np4qr)

ch_    → Chapter/Container (e.g. ch_5m7qr3np)

top_   → Topic             (e.g. top_9x82j1k)

blk_   → Content Block     (e.g. blk_2p4qr7mn)

frm_   → Formula           (e.g. frm_3r5ks8vx)

fig_   → Figure/Image      (e.g. fig_1n3mp6qt)

mcq_   → MCQ               (e.g. mcq_4s6nt9wy)

faq_   → FAQ item          (e.g. faq_7v9qw2kz)

ing_   → Ingest job        (e.g. ing_7f3kx9p2m)

exp_   → Export job        (e.g. exp_2k4mr7qp)

```



## Node.js ID Generation (ingest service, NOT Qwen)



```javascript

import { nanoid } from 'nanoid'



function generateId(prefix) {

  return `${prefix}${nanoid(10)}`

  // e.g. "top_9x82j1kpqr"

}



// Generated BEFORE Qwen runs, injected into Qwen's system prompt

const topicIds = generateTopicIds(expectedTopicCount)

```



---



# PART 5 — COLLECTION SPLIT ARCHITECTURE



## Why One Big `topics` Collection Will Destroy You



A single topic with blocks + figures + tables + MCQs + FAQ + SEO + entities

can easily reach 500KB–2MB. MongoDB's document limit is 16MB, but performance

degrades well before that. At 100 books/month with ~12 topics per chapter

and ~10 chapters per book, you'll have 12,000 topics in 3 months.

A 1MB average means 12GB of topic data in one collection, every query scanning massive documents.



**The fix: split topics into 4 focused collections.**



## The 4 Collections



```

topics              → metadata only (fast for listings, search, navigation)

topic_content       → blocks, html, raw_text (heavy, fetched only on topic page load)

topic_assets        → figures, images, SVGs, CDN URLs (fetched separately, cacheable)

topic_assessments   → MCQs, short_q, long_q, numericals, flashcards (fetched on demand)

```



## topics (metadata only — always fast)



```javascript

{

  _id: "top_9x82j1k",                    // immutable nanoid

  document_id: "pk-pctb-phys-9",

  chapter_id: "ch_5m7qr3np",

  title: "Vernier Callipers",

  title_vernacular: "ورنیئر کیلیپرز",

  slug: "vernier-callipers",

  slug_global: "pk-pctb-phys-9-ch1-vernier-callipers",

  design_theme: {
    is_hardcoded: { type: "Boolean", default: false },
    palette: {
      primary: { type: "String", default: "var(--fallback-primary)" },
      secondary: { type: "String", default: "var(--fallback-secondary)" },
      accent: { type: "String", default: "var(--fallback-accent)" },
      surface: { type: "String", default: "var(--fallback-surface)" }
    }
  },

  url_path: "/curriculum/pk/grade-9/physics/vernier-callipers-top9x82j1k",

  section_number: "1.5",

  display_order: 5,

  topic_type: "content",                 // content|exercise|intro|summary|quran

  difficulty: "medium",

  difficulty_score: 0.55,

  estimated_read_time_minutes: 4,

  bloom_level: "understand",

  subject: "physics",

  grade_numeric: 9,

  language: "english",

  locale: { type: "String", default: "en", index: true },

  publishing_status: {
    type: "String",
    enum: ["draft", "processing", "published"],
    default: "draft",
    index: true
  },

  keywords: ["vernier callipers", "least count", "zero error"],

  key_terms_preview: ["Least Count", "Zero Error"],  // first 5 only, for cards

  formula_count: 2,

  figure_count: 3,

  mcq_count: 5,

  has_interactive: true,

  source_page_start: 11,

  source_page_end: 16,

  seo: {

    meta_title: "Vernier Callipers — Physics Grade 9 Chapter 1 | StudyVault",

    meta_description: "Learn Vernier Callipers...",

    canonical_url: "",

    focus_keyword: "vernier callipers least count",

    keywords: [],

    breadcrumb: ["Home", "Physics", "Grade 9", "Chapter 1", "Vernier Callipers"],

    json_ld_types: ["TechArticle", "FAQPage", "LearningResource"]

  },

  geo: {

    llm_summary: "Vernier Callipers are precision measuring instruments...",

    authoritative_source: "PCTB Physics Grade 9 (2024), Chapter 1, Page 11",

    citation_format: "PCTB Physics Grade 9 (2024), Chapter 1, Section 1.5, Page 11",

    trustworthiness_signals: ["official_curriculum", "board_published"]

  },

  design_meta: {

    primary_color_theme: "blue",

    icon_suggestion: "ruler",

    layout_template: "standard",         // standard|two-col|formula-heavy|image-heavy|comparison

    animation_complexity: "medium"

  },

  created_at: ISODate,

  updated_at: ISODate,

  __v: { type: "Number" },

  version: "1.0.0",

  is_latest: true

}



// MongoDB Indexes on topics:

// { slug_global: 1 }           unique

// { _id: 1 }                   unique

// { document_id: 1 }

// { subject: 1, grade_numeric: 1 }

// { difficulty_score: 1 }

// { topic_type: 1 }

// Atlas Search index on: title, keywords, key_terms_preview

```



## topic_content (heavy content — fetched on topic page load only)



```javascript

{

  _id: "tc_9x82j1k",                    // same suffix as topic._id for easy join

  topic_id: "top_9x82j1k",

  document_id: "pk-pctb-phys-9",



  raw_text: "All text in topic concatenated...",  // for AI processing

  clean_html: "<h2>1.5 Vernier Callipers</h2>...", // for frontend render



  content_blocks: [

    // See Part 7 — full block spec

    // Every block has: _id, type, block_order, source_page, html, presentation_profile

  ],



  formulas: [

    {

      _id: "frm_3r5ks8vx",

      formula_id: "pk-pctb-phys-9-ch1-f01",

      name: "Least Count Formula",

      latex: "LC = \\frac{\\text{Smallest MSD}}{\\text{Total VSD}}",

      text: "LC = Smallest MSD / Total VSD",

      variables: [

        { symbol: "LC", name: "Least Count", unit: "mm", description: "..." }

      ],

      formula_type: "definition",

      subject_area: "measurement",

      source_page: 12,

      block_order_ref: 5

    }

  ],



  key_terms: [

    {

      term: "Least Count",

      definition: "The smallest value that can be measured by an instrument.",

      term_type: "technical",

      first_occurrence_page: 12,

      related_terms: ["zero error", "vernier scale"]

    }

  ],



  examples: [

    {

      _id: "ex_...",

      example_number: "1.1",

      title: "Calculating Zero Error",

      problem_text: "...",

      solution_steps: [],

      final_answer: "0.2 mm",

      formula_used: "",

      source_page: 13

    }

  ],



  callouts: [

    {

      _id: "cb_...",

      variant: "do-you-know",

      title: "Did You Know?",

      text: "Pierre Vernier invented the vernier scale in 1631.",

      source_page: 12,

      block_order_ref: 4

    }

  ],



  ai_answer_hub: [

    {

      question_intent: "What is the least count of a Vernier Calliper?",

      answer_markdown: "The **least count** of a standard Vernier Calliper is **0.1 mm**...",

      answer_plain: "The least count of a standard Vernier Calliper is 0.1mm...",

      answer_type: "formula",

      confidence: 1.0,

      citation: "PCTB Physics Grade 9 (2024), Chapter 1, Section 1.5, Page 12"

    }

  ],



  faq: [

    {

      _id: "faq_...",

      question: "What is zero error in a Vernier Calliper?",

      answer: "Zero error occurs when...",

      schema_type: "FAQPage",

      source_page: 13

    }

  ],



  entity_extraction: {

    core_concepts: ["Least Count", "Zero Error", "Main Scale", "Vernier Scale"],

    scientific_laws: [],

    historical_figures: ["Pierre Vernier"],

    units_and_standards: ["mm", "cm", "SI units"],

    instruments_mentioned: ["Vernier Calliper", "Screw Gauge", "Meter Rule"],

    cross_concept_links: [

      {

        target_entity: "Screw Gauge",

        target_entity_id: null,           // null until resolver runs

        slug_ref: "ref:micrometer-screw-gauge",

        fallback_anchor_text: "Micrometer Screw Gauge",

        relationship_type: "comparative_instrument",

        resolved: false,

        resolved_url: null,

        context: "Screw gauge gives higher precision (0.01mm) vs Vernier Calliper (0.1mm)"

      }

    ]

  },



  downloadable_outputs: {

    formula_pack: [],

    cheat_sheet_summary: "...",

    exam_hot_spots: [],

    revision_notes_markdown: ""

  },



  source_citations: [

    {

      verbatim_quote: "A vernier callipers consists of a main scale fixed jaw...",

      page_number: 12,

      context: "Opening definition paragraph"

    }

  ],



  __v: { type: "Number" },

  quran_data: null

  // If Quran content: { surah, ayah_start, ayah_end, surah_name_english,

  //   juz, manzil, textbook_urdu_translation, word_alignments[], tafsir_snippet }

  // RULE: NO Arabic glyphs in any field. Urdu only. Position-based mapping only.

}

```



## topic_assets (images, figures, SVGs — separately cacheable)



```javascript

{

  _id: "ta_9x82j1k",

  topic_id: "top_9x82j1k",

  document_id: "pk-pctb-phys-9",



  figures: [

    {

      _id: "fig_1n3mp6qt",

      figure_number: "1.5",

      caption: "A Vernier Calliper showing main and vernier scales.",

      alt: "Diagram of a Vernier Calliper with labeled main scale, vernier scale, fixed jaw, movable jaw, and depth gauge. The vernier scale is shown aligned at division 4 indicating a reading of 0.4mm.",

      source_page: 12,

      image_url: "",                     // CDN URL after upload

      image_path_local: "images/page0012_img001.jpeg",

      render_strategy: "image",          // image|svg|animation|3d

      svg_code: "",

      animation_type: "",               // css|lottie|framer|gsap

      has_labels: true,

      label_descriptions: ["Main scale showing mm divisions"],



      unsplash_search_query: "string (Highly descriptive, contextual search query generated by Qwen to look up premium real-world stock/academic photography fallbacks)",



      embedded_text_ocr: {

        detected_languages: "array of strings (ISO language codes, e.g., ['en', 'ur'])",

        extracted_strings: "array of strings (Raw unformatted text extracted or visible inside the diagram for deep indexing)"

      }

    }

  ],



  tables: [

    {

      _id: "tbl_...",

      table_number: "1.1",

      caption: "Comparison of Measuring Instruments",

      headers: ["Instrument", "Least Count", "Error Type"],

      rows: [

        ["Meter Rule", "1 mm", "Parallax"],

        ["Vernier Calliper", "0.1 mm", "Zero Error"],

        ["Screw Gauge", "0.01 mm", "Backlash"]

      ],

      source_page: 13,

      table_type: "comparison",

      render_as: "styled-table"          // styled-table|chart|infographic

    }

  ],

  __v: { type: "Number" }

}

```



## topic_assessments (on-demand — fetched only on quiz/exercise pages)



```javascript

{

  _id: "tasm_9x82j1k",

  topic_id: "top_9x82j1k",

  document_id: "pk-pctb-phys-9",



  book_mcqs: [

    {

      _id: "mcq_4s6nt9wy",

      question_number: "1",

      question_text: "The least count of a standard Vernier Calliper is:",

      options: { a: "0.01 mm", b: "0.1 mm", c: "1 mm", d: "10 mm" },

      correct_answer: "b",

      explanation: "The standard Vernier Calliper has 10 vernier divisions...",

      difficulty: "easy",

      bloom_level: "remember",

      source_page: 27,

      past_paper_years: []

    }

  ],



  book_short_questions: [

    {

      _id: "sq_...",

      question_number: "1",

      question_text: "Define least count.",

      model_answer: "The least count is the smallest measurement...",

      marks: 2,

      difficulty: "easy",

      source_page: 27

    }

  ],



  book_problems: [

    {

      _id: "num_...",

      problem_number: "1",

      problem_text: "A Vernier Calliper has MSR 2.3cm and vernier division 4 coincides...",

      given: { main_scale_reading: "2.3 cm", vernier_division: 4, least_count: "0.01 cm" },

      required: "Total length",

      solution_steps: ["Vernier reading = 4 × 0.01 = 0.04 cm", "Total = 2.3 + 0.04 = 2.34 cm"],

      final_answer: "2.34 cm",

      formula_used: "Total = MSR + (VSD × LC)",

      diagram_required: false,

      marks: 3,

      difficulty: "medium",

      source_page: 28

    }

  ],



  activities: [

    {

      _id: "act_...",

      title: "Measuring with a Vernier Calliper",

      activity_type: "lab",

      apparatus: ["Vernier Calliper", "Wooden block", "Coins"],

      procedure_steps: [],

      precautions: [],

      expected_result: "",

      source_page: 14

    }

  ],



  flashcards: [

    {

      _id: "fc_...",

      front: "What is the least count of a standard Vernier Calliper?",

      back: "0.1 mm (or 0.01 cm)",

      cloze: "The least count of a Vernier Calliper is {{0.1 mm}}.",

      difficulty: "easy",

      topic_id: "top_9x82j1k"

    }

  ],

  __v: { type: "Number" }

}

```



---



# PART 6 — VERSIONING & RE-INGESTION SYSTEM



## The Problem



Book v1 gets ingested. Publisher releases Book v2 with updated chapters.

Now: slugs changed, pages changed, entities changed, formulas changed.

Without a versioning system, re-ingestion silently corrupts live data.



## The Solution: content_hash + parent_document_id



```

RE-INGESTION WORKFLOW:



1. New PDF arrives in ingest queue

2. Ingest service computes SHA256 of the PDF file

3. Query documents collection: find({ source_file_sha256: hash })

   → If found: DUPLICATE. Skip. Log. Do not re-ingest.

   → If not found: continue



4. Check if a document with same document_id already exists (different hash)

   → If yes: this is a VERSION UPDATE



5. On version update:

   a. Set existing document.is_latest = false

   b. Create new document with:

      - New _id (new nanoid)

      - Same document_id (human-readable slug stays same)

      - parent_document_id = old document._id

      - document_version incremented (1.0.0 → 2.0.0)

      - All new topic _ids (new nanoids — old topics remain untouched)

   c. Write diff summary to versions collection

   d. Old topic URLs still resolve (old IDs still in slug_registry)

   e. New topic URLs go live when publishing.status = "published"

   f. slug_redirects updated for any changed slugs



6. On content correction (not a full re-ingest):

   - Update only the affected topic_content / topic_assessments document

   - Increment topic version (1.0.0 → 1.0.1)

   - Write to versions collection

   - Do NOT change topic._id

```



## Versioning Fields Required on Every Document and Topic



```javascript

// On documents collection:

content_hash: "sha256-of-raw-pdf-bytes",

document_version: "1.0.0",              // semver

parent_document_id: null,              // previous version's _id

is_latest: true



// On topics collection:

version: "1.0.0",

parent_topic_id: null,

is_latest: true

```



---



# PART 7 — CONTENT BLOCK TYPES (Full Spec)



Every block in `content_blocks[]` requires ALL of:

`_id`, `type`, `block_order`, `source_page`, `html`, `presentation_profile`



## Complete Block Type List



```

STRUCTURAL:   heading | paragraph | list | divider | page_break

MEDIA:        figure | video_embed | audio_embed

DATA:         table | comparison_table | timeline | specification_list

MATH:         formula | equation | example | numerical

ASSESSMENT:   mcq | short_question | long_question | numerical_problem

CALLOUT:      callout  (with variant field — see variant list in Part 9)

ENGAGEMENT:   flashcard | quiz_inline | activity | lab_procedure

SPECIAL:      quran_verse | definition | biography_box | career_link

NAVIGATION:   learning_outcomes | chapter_summary | exercise_header

DESIGN:       infographic | comparison_view | process_flow | hierarchy_diagram

```



## Block Spec (every block type, every field)



```jsonc

// ALL BLOCKS — shared fields

{

  "_id": "blk_2p4qr7mn",               // immutable nanoid

  "type": "heading",                   // from type list above

  "block_order": 1,                    // starts at 1, no gaps, no duplicates

  "source_page": 11,                   // positive integer always



  // PRESENTATION ISOLATION — frontend owns this entirely

  // Qwen NEVER populates tailwind_classes or animation_trigger

  "presentation_profile": {

    "visual_layer_type": "standard_card",  // standard_card|full_bleed|sidebar|inline

    "theme_overrides": {},             // empty object by default, never null

    "animation_trigger": "on-scroll", // on-scroll|on-load|on-hover|none

    "tailwind_classes": ""            // populated by frontend renderer, never by Qwen

  },



  // Then type-specific fields below...

}



// HEADING

{ "level": 2, "text": "1.5 Vernier Callipers",

  "slug_anchor": "vernier-callipers",

  "html": "<h2 id='vernier-callipers'>1.5 Vernier Callipers</h2>" }



// PARAGRAPH

{ "text": "Full verbatim paragraph text.",

  "contains_formula": false,

  "key_terms_in_text": ["Vernier Calliper", "least count"],

  "html": "<p>Full verbatim paragraph text.</p>" }



// FORMULA

{ "formula_id": "frm_3r5ks8vx",

  "name": "Least Count Formula",

  "latex": "LC = \\frac{\\text{Smallest MSD}}{\\text{Total VSD}}",

  "text": "LC = Smallest MSD / Total VSD",      // BOTH always required

  "formula_type": "definition",

  "variables": [{ "symbol": "LC", "name": "Least Count", "unit": "mm" }],

  "html": "<div class='formula'><span class='katex'>...</span></div>" }



// FIGURE

{ "figure_id": "fig_1n3mp6qt",

  "figure_number": "1.5",

  "caption": "Exact caption from textbook.",

  "alt": "Detailed 20+ word description of image content, all labels, measurements.",

  "image_url": "",

  "image_path_local": "images/page0012_img001.jpeg",

  "render_strategy": "image",          // image|svg|animation

  "svg_code": "",

  "html": "<figure><img src='' alt='...'><figcaption>...</figcaption></figure>" }



// TABLE

{ "table_id": "tbl_...",

  "table_number": "1.1",

  "caption": "Comparison of Measuring Instruments",

  "headers": ["Instrument", "Least Count", "Error Type"],

  "rows": [["Meter Rule", "1 mm", "Parallax"]],

  "table_type": "comparison",

  "render_as": "styled-table",

  "html": "<table class='data-table'>...</table>" }



// CALLOUT

{ "callout_id": "cb_...",

  "variant": "do-you-know",

  "title": "Did You Know?",

  "text": "Pierre Vernier invented the vernier scale in 1631.",

  "icon": "lightbulb",

  "html": "<div class='callout callout-do-you-know'>...</div>" }



// MCQ

{ "mcq_id": "mcq_4s6nt9wy",

  "question_number": "1",

  "question_text": "The least count of Vernier Callipers is:",

  "options": { "a": "0.01 mm", "b": "0.1 mm", "c": "1 mm", "d": "10 mm" },

  "correct_answer": "b",

  "explanation": "",

  "html": "<div class='mcq'>...</div>" }



// EXAMPLE

{ "example_id": "ex_...", "example_number": "1.1",

  "title": "Calculating Zero Error",

  "problem_text": "...",

  "solution_steps": ["Step 1...", "Step 2..."],

  "final_answer": "0.2 mm",

  "html": "<div class='example'>...</div>" }



// LIST

{ "list_type": "unordered",

  "items": ["Item 1", "Item 2"],

  "html": "<ul><li>Item 1</li><li>Item 2</li></ul>" }



// DEFINITION

{ "term": "Least Count",

  "definition_text": "The smallest measurement that an instrument can make.",

  "html": "<div class='definition'><strong>Least Count:</strong>...</div>" }



// LEARNING OUTCOMES

{ "outcomes": ["Define physical quantities...", "Determine least count..."],

  "html": "<div class='slo-box'>...</div>" }



// COMPARISON VIEW

{ "caption": "Precision comparison of measuring instruments",

  "headers": ["Instrument", "Precision", "Error Type"],

  "rows": [["Meter Rule", "1 mm", "Parallax"]],

  "design_hint": "render as visual cards not plain table",

  "html": "<div class='comparison-grid'>...</div>" }



// QURAN VERSE

// CRITICAL: NO Arabic glyphs in ANY field. Urdu only. Position-based mapping only.

{ "surah": 114, "ayah": 2,

  "textbook_urdu_translation": "سب انسانوں کے بادشاہ کی (عبادت کرو۔)",

  "word_alignments": [

    { "position": 1, "urdu_meaning": "بادشاہ", "grammar_note": null }

  ],

  "tafsir_snippet": "",

  "html": "<div class='quran-verse' data-surah='114' data-ayah='2'>...</div>" }

```



---



# PART 8 — SLUG SYSTEM & URL ARCHITECTURE



## Slug Generation Rules (Qwen outputs these as suggestions — Node.js sanitizes before DB write)



```

1. All slugs: lowercase, hyphens only, no special chars, no leading/trailing hyphens

2. Max 80 characters

3. Regex that must pass: /^[a-z0-9]+(?:-[a-z0-9]+)*$/

4. Document slug:  from document title  → "physics-class-9"

5. Chapter slug:   from chapter title   → "physical-quantities-and-measurements"

6. Topic slug:     from heading text    → "vernier-callipers"

7. Global slug:    document + ch-N + topic → "physics-class-9-ch1-vernier-callipers"

8. Duplicate slugs in same chapter: append section number → "errors-in-measurement-1-9"

9. Quran topics:   "surah-[n]-ayah-[start]-[end]"

10. Exercise topic: "ch[N]-exercises" — display_order always 999

11. Intro topic:    "ch[N]-introduction" — display_order always 0

12. Cross-references: prefix with "ref:" during ingest → resolver strips it post-ingest

```



## SLUG FORMATTING LAW (Node.js ingest service, not Qwen)



```javascript

function sanitizeSlug(raw) {

  return raw

    .toLowerCase()

    .trim()

    .replace(/[^\w\s-]/g, '')          // remove special chars except hyphens

    .replace(/[\s_]+/g, '-')           // spaces and underscores → hyphens

    .replace(/-+/g, '-')               // collapse multiple hyphens

    .replace(/^-+|-+$/g, '')           // strip leading/trailing hyphens

    .slice(0, 80)                      // max 80 chars

}



// Validate after sanitization

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

if (!SLUG_REGEX.test(slug)) throw new Error(`Invalid slug: ${slug}`)

```



## URL Pattern Law



```

PATTERN: /[section]/[breadcrumb-slugs]/[topic-slug]-[short-id]



EXAMPLES:

  /curriculum/pk/grade-9/physics/vernier-callipers-top9x82j1k

  /courses/web-dev/javascript-basics/closures-top3m5qr7np

  /legal/employment/termination-clause-top1k8nv4qz



NEXT.JS ROUTER:

  // pages/[...path].tsx or app/[...slug]/page.tsx

  const segments = params.slug  // ["curriculum","pk","grade-9","physics","vernier-callipers-top9x82j1k"]

  const lastSegment = segments[segments.length - 1]

  const shortId = lastSegment.split('-').pop()   // "top9x82j1k"

  const topic = await db.topics.findOne({ _id: shortId })

  // slug text is IRRELEVANT to the lookup — only the ID matters

```



## Slug Redirect System (zero dead links)



```javascript

// slug_redirects collection

{

  old_slug: "vernier-calipers",          // typo that was fixed

  new_slug: "vernier-callipers",

  _id: "top_9x82j1k",                   // same topic, never changes

  old_url_path: "/curriculum/.../vernier-calipers-top9x82j1k",

  new_url_path: "/curriculum/.../vernier-callipers-top9x82j1k",

  redirect_type: "301",

  created_at: ISODate

}



// Next.js middleware.ts checks slug_redirects before returning 404

// If old URL found → 301 redirect to new URL

// Since ID suffix never changes, even the "old" URL still resolves

// The redirect is purely for the slug text portion

```



## Slug Resolver Job (cross-concept links)



```javascript

// Two-pass resolution workflow:



// PASS 1 — Ingest: Qwen outputs slug_refs

"cross_concept_links": [{

  "target_entity": "Screw Gauge",

  "target_entity_id": null,

  "slug_ref": "ref:micrometer-screw-gauge",

  "resolved": false,

  "resolved_url": null

}]



// PASS 2 — Resolver job (runs post-ingest and nightly)

// Node.js worker:

async function resolveLinks() {

  const unresolved = await db.topic_content.find({

    'entity_extraction.cross_concept_links.resolved': false

  })



  for (const topic of unresolved) {

    for (const link of topic.entity_extraction.cross_concept_links) {

      if (link.resolved) continue

      const targetSlug = link.slug_ref.replace('ref:', '')

      const registry = await db.slug_registry.findOne({ slug: targetSlug })



      if (registry) {

        link.target_entity_id = registry._id

        link.resolved_url = registry.url_path

        link.resolved = true

      } else {

        // Log to unresolved_links for human QA review

        await db.unresolved_links.insertOne({

          slug_ref: link.slug_ref,

          source_topic_id: topic.topic_id,

          created_at: new Date()

        })

      }

    }

    await topic.save()

  }

}

```



---



# PART 9 — QUEUE & PIPELINE ARCHITECTURE



## Why NOT MongoDB as Queue



MongoDB's `ingest_queue` collection works for storing state but is a poor job queue.

It has no retry logic, no backoff, no worker concurrency control, no dead-letter queues,

and no real-time job monitoring. At 100 books/month with occasional failures,

this becomes painful fast.



**Use BullMQ + Redis for jobs. MongoDB only stores persistent state.**



## The Full Pipeline



```

PDF Arrives (upload / URL / file drop)

     │

     ▼

┌─────────────────┐

│   API Server    │  POST /api/ingest

│  (Express)      │  → validate file

│                 │  → compute SHA256

│                 │  → check duplicate (MongoDB)

│                 │  → generate all IDs (nanoid)

│                 │  → write to MongoDB ingest_queue (status: pending)

│                 │  → push job to BullMQ ingestion queue

└────────┬────────┘

         │

         ▼

┌─────────────────────────────────────────────────────┐

│   BullMQ Worker (Node.js)                           │

│                                                     │

│  Step 1: Pull PDF → extract text + images           │

│  Step 2: Inject IDs into Qwen system prompt         │

│  Step 3: Send chapter to Qwen → receive JSON        │

│  Step 4: Zod validation → reject or flag errors     │

│  Step 5: Slug sanitization (Node.js, not Qwen)      │

│  Step 6: Write to MongoDB (4 split collections)     │

│  Step 7: Write to slug_registry                     │

│  Step 8: Upload images to CDN                       │

│  Step 9: Trigger slug resolver job                  │

│  Step 10: Update ingest_queue status → complete     │

│  Step 11: Trigger Atlas Search index update         │

└─────────────────────────────────────────────────────┘

         │

         ▼

┌─────────────────┐

│   BullMQ Queues │

│                 │

│  ingestion      │  → main pipeline (concurrency: 3)

│  image-upload   │  → async CDN uploads (concurrency: 10)

│  slug-resolver  │  → runs after each ingest + nightly

│  export-gen     │  → PDF/EPUB generation (concurrency: 2)

│  search-index   │  → Atlas Search sync (concurrency: 1)

└─────────────────┘

```



## BullMQ Configuration



```javascript

import { Queue, Worker } from 'bullmq'

import { Redis } from 'ioredis'



const redis = new Redis({ host: 'localhost', port: 6379 })



// Queues

export const ingestionQueue = new Queue('ingestion', { connection: redis })

export const imageQueue = new Queue('image-upload', { connection: redis })

export const resolverQueue = new Queue('slug-resolver', { connection: redis })

export const exportQueue = new Queue('export-gen', { connection: redis })



// Worker with retry logic

new Worker('ingestion', async (job) => {

  const { ingestId, pdfPath, documentId } = job.data

  // ... pipeline steps

}, {

  connection: redis,

  concurrency: 3,

  defaultJobOptions: {

    attempts: 3,

    backoff: { type: 'exponential', delay: 5000 }

  }

})

```



## MongoDB `ingest_queue` (state storage, not job runner)



```javascript

{

  _id: "ing_7f3kx9p2m",

  source_file_name: "physics-grade9.pdf",

  source_file_sha256: "a3f9c...",

  document_id: "pk-pctb-phys-9",

  bullmq_job_id: "42",               // reference to BullMQ job

  status: "complete",                // pending|processing|complete|error|duplicate

  attempts: 1,

  error_log: [],

  created_at: ISODate,

  completed_at: ISODate,

  processing_time_seconds: 210

}

```



---



# PART 10 — ZOD VALIDATION LAYER



## Why This Is Not Optional



Qwen is powerful but not perfect. At 100 books/month, even a 1% malformed output rate

means ~12 corrupted topics entering your database every month.

Without validation, you only discover errors when a page breaks in production.



**Every Qwen output passes through Zod before touching MongoDB.**



## Validation Tiers



```

TIER 1 — HARD REJECT (re-queue the job):

  - Output is not valid JSON

  - schema_version field missing or wrong

  - topics array is empty

  - Any topic missing _required_ fields: _id, title, slug, display_order



TIER 2 — AUTO-FIX THEN CONTINUE:

  - meta_title over 60 chars → truncate to 57 + "..."

  - meta_description over 160 chars → truncate to 157 + "..."

  - Slug fails regex → run sanitizeSlug() automatically

  - source_page is string instead of number → parseInt()

  - block_order has gaps → renumber sequentially

  - MCQ has wrong correct_answer format → normalize to "a"|"b"|"c"|"d"



TIER 3 — FLAG FOR HUMAN REVIEW (continue but mark):

  - confidence_score below 0.80

  - warnings[] array is non-empty

  - Any figure with alt under 20 words

  - Any formula missing latex OR text field

  - raw_text word count implausibly low (<50 words for a topic)

  - MCQ with fewer or more than 4 options

```



## Zod Schema Skeleton



```javascript

import { z } from 'zod'



const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80)



const FormulaSchema = z.object({

  latex: z.string().min(1),            // both fields required, never empty

  text: z.string().min(1),

  name: z.string().min(1),

  formula_type: z.enum(["definition", "derivation", "law", "empirical"]),

  source_page: z.number().int().positive()

})



const MCQSchema = z.object({

  question_text: z.string().min(1),

  options: z.object({ a: z.string(), b: z.string(), c: z.string(), d: z.string() }),

  correct_answer: z.enum(["a", "b", "c", "d"]),

  source_page: z.number().int().positive()

})



const ContentBlockSchema = z.object({

  _id: z.string().startsWith("blk_"),

  type: z.enum([

    "heading","paragraph","formula","figure","table","callout",

    "mcq","example","list","definition","learning_outcomes",

    "comparison_view","quran_verse","activity","equation","numerical"

  ]),

  block_order: z.number().int().positive(),

  source_page: z.number().int().positive(),

  html: z.string().min(1),

  presentation_profile: z.object({

    visual_layer_type: z.string(),

    theme_overrides: z.object({}),

    animation_trigger: z.enum(["on-scroll","on-load","on-hover","none"]),

    tailwind_classes: z.string()

  })

})



const TopicMetaSchema = z.object({

  _id: z.string().startsWith("top_"),

  title: z.string().min(1),

  slug: SlugSchema,

  display_order: z.number().int().min(0),

  difficulty: z.enum(["easy","medium","hard"]),

  source_page_start: z.number().int().positive()

  // ... all required fields

})



// Validation function

async function validateQwenOutput(raw) {

  try {

    const parsed = JSON.parse(raw)

    const result = TopicMetaSchema.safeParse(parsed)

    if (!result.success) {

      return { valid: false, tier: 1, errors: result.error.issues }

    }

    return { valid: true, data: result.data }

  } catch (e) {

    return { valid: false, tier: 1, errors: [{ message: "Invalid JSON" }] }

  }

}

```



---



# PART 11 — SEARCH ARCHITECTURE



## Do Not Build Search Yourself



At 100 books/month, 12,000+ topics in 3 months, a custom search_index collection

with manual text matching will become your biggest regret.

The performance degrades. The relevance is poor. You can't do fuzzy matching.

You can't rank by subject + grade + difficulty + keyword simultaneously.



**Use MongoDB Atlas Search from day one. It costs almost nothing at this scale.**



## Atlas Search Index Configuration



```javascript

// Atlas Search index definition (set via Atlas UI or mongocli)

{

  "mappings": {

    "dynamic": false,

    "fields": {

      "title": [{ "type": "string", "analyzer": "lucene.english" }],

      "keywords": [{ "type": "string" }],

      "key_terms_preview": [{ "type": "string" }],

      "subject": [{ "type": "string" }],

      "grade_numeric": [{ "type": "number" }],

      "difficulty": [{ "type": "string" }],

      "topic_type": [{ "type": "string" }],

      "document_id": [{ "type": "string" }]

    }

  }

}

```



## Search Query (Express route)



```javascript

// GET /api/search?q=vernier+callipers&subject=physics&grade=9

app.get('/api/search', async (req, res) => {

  const { q, subject, grade, difficulty, page = 1 } = req.query

  

  const pipeline = [

    {

      $search: {

        index: "topics_search",

        compound: {

          must: [{ text: { query: q, path: ["title", "keywords", "key_terms_preview"],

                           fuzzy: { maxEdits: 1 } } }],

          filter: [

            ...(subject ? [{ text: { query: subject, path: "subject" } }] : []),

            ...(grade ? [{ equals: { value: parseInt(grade), path: "grade_numeric" } }] : [])

          ]

        }

      }

    },

    { $project: { title: 1, slug: 1, url_path: 1, subject: 1, grade_numeric: 1,

                  difficulty: 1, score: { $meta: "searchScore" } } },

    { $skip: (page - 1) * 20 },

    { $limit: 20 }

  ]

  

  const results = await db.topics.aggregate(pipeline).toArray()

  res.json(results)

})

```



## Additional Search Collections (not search_index — these are analytics)



```javascript

// popular_topics — updated by Redis counters, synced hourly

{ topic_id, view_count, search_hit_count, last_30_days_views }



// popular_searches — what users actually type

{ query, count, last_searched, top_result_id }



// failed_searches — queries that returned 0 results

{ query, count, created_at }

// ↑ This is your content gap radar. High failed_searches = what to ingest next.

```



---



# PART 12 — COMPLETE MONGODB COLLECTIONS



```javascript

// DATABASE: platform_db



// CORE CONTENT (4-collection split)

1. documents              → document metadata, container, seo_master, publishing

2. topics                 → topic metadata only (lightweight, always fast)

3. topic_content          → blocks, html, formulas, faq, entities, citations

4. topic_assets           → figures, tables (separately cacheable by CDN)

5. topic_assessments      → mcqs, problems, activities, flashcards



// SLUG & URL SYSTEM

6. slug_registry          → { slug, slug_global, _id, document_id, topic_id, url_path }

7. slug_redirects         → { old_slug, new_slug, _id, old_url_path, new_url_path, type: "301" }

8. unresolved_links       → { slug_ref, source_topic_id, created_at }



// QUEUE & JOBS (state only — jobs run in BullMQ/Redis)

9. ingest_queue           → { _id, source_file, sha256, status, bullmq_job_id, error_log }

10. export_jobs           → { _id, topic_id, format, status, output_url, created_at }



// SEARCH & ANALYTICS

11. popular_topics        → { topic_id, view_count, search_hit_count }

12. popular_searches      → { query, count, last_searched }

13. failed_searches       → { query, count, created_at }



// VERSIONING

14. versions              → { document_id, version, diff_summary, snapshot_ref, timestamp }



// ASSETS

15. asset_registry        → { _id, type, topic_id, local_path, cdn_url, render_strategy }



// FORMULA SEARCH

16. formula_index         → { _id, name, latex, text, topic_id, subject, grade }



// INDEXES ON EVERY COLLECTION:

// topics:        { _id:1 } { slug_global:1 unique } { document_id:1 } { subject:1, grade_numeric:1 }

// slug_registry: { slug:1 unique } { _id:1 } { document_id:1 }

// ingest_queue:  { source_file_sha256:1 unique } { status:1 }

// formula_index: { subject:1 } { topic_id:1 }

```



---



# PART 13 — API ROUTES (Node.js + Express)



```

// INGEST

POST   /api/ingest                    → Upload PDF, trigger pipeline

GET    /api/ingest/:id/status         → Poll job status

POST   /api/ingest/:id/cancel         → Cancel pending job

POST   /api/ingest/:id/retry          → Retry failed job



// DOCUMENTS

GET    /api/documents                 → List (paginated, filter by subject/grade/type)

GET    /api/documents/:id             → Document metadata + topic_refs

GET    /api/documents/:id/aggregates  → Counts: formulas, figures, MCQs

DELETE /api/documents/:id             → Soft delete (sets status: archived)



// TOPICS

GET    /api/topics/:id                → Topic metadata (from topics collection)

GET    /api/topics/:id/content        → Full content blocks + html

GET    /api/topics/:id/assets         → Figures + tables

GET    /api/topics/:id/assessments    → MCQs + problems + flashcards

GET    /api/topics/:id/related        → Related via cross_concept_links

GET    /api/topics/by-slug/:slug      → Lookup by slug (uses slug_registry)



// SEARCH

GET    /api/search                    → Atlas Search (q, subject, grade, difficulty, page)

GET    /api/search/formulas           → Formula search (q, subject, latex)

GET    /api/search/suggest            → Autocomplete suggestions



// ASSETS

GET    /api/assets/:id                → Asset CDN URL

POST   /api/assets/upload             → Upload image to CDN



// EXPORT

POST   /api/export/:topic_id/:format  → Queue export job (pdf|epub|scorm|anki)

GET    /api/export/:job_id/status     → Check export status

GET    /api/export/:job_id/download   → Download completed export



// UTILITY

GET    /api/sitemap                   → XML sitemap for all published topics

GET    /api/health                    → System health (Redis, MongoDB, BullMQ)

POST   /api/resolve-slugs             → Manually trigger resolver job

GET    /api/failed-searches           → Content gap report

GET    /api/popular                   → Popular topics + searches

```



---



# PART 14 — SEO / AEO / GEO — COMPLETE FIELD CHECKLIST



## SEO (Standard Search)



```

✅ meta_title             — 50-60 chars, focus keyword first

✅ meta_description       — 150-160 chars, includes value signal

✅ canonical_url          — always set, prevents duplicate content penalties

✅ focus_keyword          — 1 primary, in title + first paragraph

✅ secondary_keywords     — 3-5, in headings and body

✅ og_title, og_description, og_image — for social sharing previews

✅ twitter_card           — summary_large_image

✅ breadcrumb array       → renders as JSON-LD BreadcrumbList

✅ robots: "index, follow"

✅ sitemap_priority       — 0.9 for high-traffic topics, 0.5 for exercise pages

✅ sitemap_changefreq     — "monthly" for stable content

✅ internal_links_suggested[] — resolved from cross_concept_links

✅ heading hierarchy      — H1: chapter title, H2: topic, H3: subtopic

✅ estimated_read_time    — signals content depth to crawlers

✅ word_count             — educational long-form content ranks better

✅ past_paper_years       — "2022 board exam question" = high search intent

```



## AEO (Answer Engine Optimization — Google SGE, Bing Copilot)



```

✅ featured_snippet_block — 40-60 words, direct answer, starts with subject noun

✅ answer_type            — definition|list|steps|comparison|formula|table

✅ faq[] with FAQPage schema markup — each question + 1 paragraph answer

✅ ai_answer_hub[] with markdown AND plain text versions

✅ "How to..." step blocks — HowTo schema, numbered steps

✅ Definition paragraphs  — must start with "X is a..." or "X refers to..."

✅ Comparison tables      — triggers comparison-style featured snippets

✅ Formula blocks with alt text descriptions

✅ citation_anchor on every answer block — gives Google source to credit

✅ answer_plain field     — AI parsers prefer clean text over markdown

```



## GEO (Generative Engine Optimization — ChatGPT, Perplexity, Claude, Gemini)



```

✅ llm_summary            — 2-3 sentence factual paragraph, first-person authority voice

✅ authoritative_source   — "PCTB Physics Grade 9 (2024)" — exact, never vague

✅ citation_format        — "PCTB Physics Grade 9 (2024), Chapter 1, Page 12"

✅ entity_name + entity_type — schema.org compatible

✅ trustworthiness_signals — ["official_curriculum", "board_published", "peer_reviewed"]

✅ source_citations with verbatim quotes + page numbers — AI needs exact provenance

✅ named entity extraction — people, places, dates, concepts, formulas, units

✅ cross_concept_links    — semantic graph signals topic authority

✅ JSON-LD @context schema.org — machine-readable entity definitions

✅ speakable schema       — marks content safe for AI voice reading

✅ no_hallucination rule  — every factual claim has source_page; AI crawlers reward this

```



## JSON-LD Schema by Document Type



```javascript

textbook topic    → TechArticle + FAQPage + LearningResource + BreadcrumbList

course lesson     → Course + CourseInstance + VideoObject (if transcript)

sop               → HowTo + HowToStep

legal doc         → LegalDocument (use Article as fallback)

research paper    → ScholarlyArticle

manual            → TechArticle + HowTo

finance report    → Article (no perfect schema type — use Article + custom properties)

reference         → DefinedTerm + DefinedTermSet

```



---



# PART 15 — DESIGN SYSTEM



## Subject Color Map



```

Physics          → Blue     #3B82F6  (blue-500)

Chemistry        → Purple   #8B5CF6  (violet-500)

Biology          → Green    #10B981  (emerald-500)

Mathematics      → Orange   #F59E0B  (amber-500)

Urdu             → Teal     #14B8A6  (teal-500)

Pakistan Studies → Red      #EF4444  (red-500)

Islamiat/Quran   → Gold     #EAB308  (yellow-500)

English          → Indigo   #6366F1  (indigo-500)

Computer         → Cyan     #06B6D4  (cyan-500)

Legal            → Slate    #64748B  (slate-500)

SOP/Manual       → Gray     #6B7280  (gray-500)

Finance          → Emerald  #059669  (emerald-600)

Course           → Rose     #F43F5E  (rose-500)

```



## Callout Variants (Complete List)



```

do-you-know              → Blue bg,    lightbulb icon

for-your-information     → Amber bg,   info-circle icon

quick-quiz               → Purple bg,  help-circle icon

lab-safety               → Red bg,     alert-triangle icon

note                     → Gray bg,    file-text icon

caution                  → Orange bg,  alert-circle icon

warning                  → Red border, alert-octagon icon

danger                   → Red bg,     skull icon

activity                 → Green bg,   hand icon

example                  → Blue-gray,  code icon

islamic-value            → Gold bg,    star-and-crescent icon

quran-verse              → Gold-green gradient, RTL typography

biography                → Sepia bg,   user icon

career-link              → Teal bg,    briefcase icon

fun-fact                 → Coral bg,   zap icon

misconception            → Pink bg,    x-circle icon

think-about-it           → Indigo bg,  brain icon

challenge                → Orange border, trophy icon

extension                → Purple border, arrow-up-right icon

real-world-connection    → Green border,  globe icon

revision                 → Blue border,   rotate-ccw icon

summary                  → Gray border,   list icon

```



## Animation Strategy Per Block Type



```

heading          → fade-in-up on scroll        (Framer Motion)

paragraph        → no animation               (performance — never animate text)

formula          → scale-in on first view

figure           → fade-in + slight zoom

callout          → slide-in from left

mcq              → reveal-on-click for answer

example          → step-by-step reveal (each step fades in sequentially)

comparison_table → cards stagger-in left-to-right

quran_verse      → gentle glow pulse           (respectful — never flashy)

flashcard        → 3D flip on click

table            → fade-in row by row on first scroll

activity         → slide-up from bottom

definition       → highlight flash on first view

```



## Presentation Isolation Law



```

QWEN POPULATES:    type, block_order, source_page, all content fields, html

QWEN NEVER TOUCHES: tailwind_classes, animation_trigger, theme_overrides



FRONTEND OWNS:    presentation_profile entirely

CHANGING CSS:     zero DB migrations, zero content corruption

CHANGING CONTENT: zero effect on presentation_profile



presentation_profile is STRIPPED from API responses by default.

Add ?include=presentation query param to include it (only for renderer calls).

AI crawlers never see Tailwind classes — they see clean content.

```



---



# PART 16 — QWEN PROMPT ENGINEERING LAWS



## The 15 Laws Qwen Must Follow



```

1.  Output ONLY valid JSON. No preamble, no backticks, no commentary, no trailing text.

2.  Always include ingest_metadata with confidence_score populated.

3.  Every topic must have ALL schema fields — null is allowed, missing is a hard error.

4.  schema_version must match the current version (injected into system prompt).

5.  block_order must start at 1, increment by 1, no gaps, no duplicates.

6.  Every formula must have BOTH latex AND text populated — never leave either empty.

7.  Every figure must have alt field with minimum 20 words describing the actual content.

8.  Every MCQ must have exactly 4 options (a/b/c/d) and correct_answer = one of a/b/c/d.

9.  raw_text must contain ALL text from the topic. Self-check: word count > 50 for any topic.

10. NO Arabic script anywhere. Quran verses: Urdu translation only, position-based mapping.

11. Cross-reference slugs must be prefixed "ref:" — never invent resolved URLs.

12. Do NOT paraphrase. Verbatim extraction for all text fields.

13. confidence_score below 0.80 must flag specific pages in warnings[].

14. presentation_profile.tailwind_classes must always be empty string "".

15. After completing output, run self-check against Part 16.2 quality checklist.

```



## Quality Checklist (Qwen Self-Verifies Before Outputting)



```

STRUCTURE:

☐ topic count matches actual numbered headings in chapter

☐ display_order sequential: 0 (intro), 1,2,3... (topics), 999 (exercises)

☐ block_order sequential from 1 with no gaps in each topic



FORMULAS:

☐ every formula block has non-empty latex field

☐ every formula block has non-empty text field

☐ KaTeX-compatible syntax (no \text{} wrapping entire formula)



MEDIA:

☐ every figure has alt with 20+ descriptive words

☐ every table has caption

☐ every table row has same column count as headers



ASSESSMENT:

☐ every MCQ has exactly 4 options

☐ every MCQ correct_answer is exactly "a", "b", "c", or "d"

☐ every numerical problem has final_answer populated



CONTENT:

☐ raw_text is plausible length (not suspiciously short)

☐ no Arabic glyphs in any string field

☐ no "ref:" slugs left without the "ref:" prefix on cross-references



SEO:

☐ meta_title under 60 characters

☐ meta_description under 160 characters

☐ focus_keyword appears in meta_title



INTEGRITY:

☐ schema_version present and correct

☐ confidence_score populated

☐ source_page present on every content block

☐ presentation_profile.tailwind_classes is empty string on every block

```



---



# PART 17 — THE "MISS NOTHING" EXTRACTION CHECKLIST



For every page of every chapter, Qwen checks for ALL of:



## Structure

```

☐ Chapter opening / intro paragraph

☐ All numbered section headings (H2)

☐ All sub-section headings (H3, H4)

☐ Chapter summary / revision section

☐ "Key Points" / "Points to Remember" section

☐ Glossary at chapter end

☐ Table of contents references

```



## Textbook Specials

```

☐ Student Learning Outcomes (chapter start)

☐ "Do You Know?" boxes

☐ "For Your Information!" boxes

☐ "Think About It" / "Critical Thinking" boxes

☐ "Career Link" / "Real World Connection" boxes

☐ "Biography" / "Scientists in History" boxes

☐ "Islamic Values" / "Quran Verse" boxes

☐ "Lab Safety Rules" / "Safety Warning" boxes

☐ "Quick Quiz" inline quizzes

☐ "Activity" boxes (numbered)

☐ Laboratory procedures with apparatus + steps + precautions

☐ "Did You Know?" / "Fun Fact" boxes

☐ Chapter review questions at end

```



## Math & Science

```

☐ Every formula — BOTH latex AND text versions

☐ Every worked example — full solution, every step numbered

☐ Every numerical problem

☐ Every graph — axes labels, units, trend described

☐ Every data table — every row, every cell, caption

☐ Unit conversions mentioned in text

☐ Scientific notation preserved (3.0 × 10⁸ not "3x10^8")

☐ Superscripts: m², cm³, etc. — Unicode characters

☐ Subscripts: H₂O, CO₂, etc. — Unicode characters

☐ Special chars: μ, ×, ±, °, ÷, Ω, Δ, α, β, γ — Unicode directly

```



## Media

```

☐ Every figure — alt (20+ words), caption verbatim, figure number

☐ Diagrams — all labeled parts described in alt

☐ Flow charts — structure described as process steps

☐ Maps — regions and labels described

☐ Graphs — axes, scale, data trend described

```



## Exercises (always last topic, display_order: 999)

```

☐ All MCQs — question + 4 options + correct answer + explanation

☐ All short questions + model answers

☐ All long questions + answer outlines

☐ All numerical problems + full solutions

☐ Past paper references if mentioned

☐ Review questions / chapter test

```



## For Courses

```

☐ Learning objectives per lesson

☐ Key takeaways

☐ Assessment rubrics

☐ Resource links mentioned

☐ Assignment instructions

```



## For Legal / Policy

```

☐ Every clause number and text verbatim

☐ All defined terms

☐ All dates (effective, expiry, review)

☐ All party names and roles

☐ Risk flag words: "shall", "must", "liable", "penalt*", "terminat*", "breach"

```



## For Finance

```

☐ Every financial figure row by row

☐ All ratios with values

☐ All dates

☐ Audit opinion verbatim

☐ Risk factors listed

```



---



# PART 18 — COMPETITIVE ADVANTAGE STACK



## Why This Breaks Indexing



1. **Schema depth** — competitors have meta title + description. You have 40+ SEO fields per topic, full JSON-LD entity graphs, AEO answer blocks, GEO citation anchors. No comparison.



2. **Volume at quality** — 100 books/month = 10,000+ topics/month, each with 20+ quality SEO signals, validated by Zod. Blog post factories can't compete.



3. **Formula indexing monopoly** — no one indexes math formulas with LaTeX + plain text + connected MCQs + worked examples + topic context. You own this search space.



4. **AEO saturation** — every topic has a featured-snippet-ready answer block. Google SGE pulls the most structured, sourced, confidence-scored answer. That's yours.



5. **GEO citation density** — every claim has source_page + authoritative_source + verbatim_quote. AI engines (Perplexity, ChatGPT) cite sources with clear provenance. Yours has it.



6. **Internal link graph** — cross_concept_links + slug_registry creates a dense semantic link network across 10,000+ topics. This is how Wikipedia wins. You're building that.



7. **Performance** — 4-collection split + Atlas Search + CDN assets + no layout shifts = Core Web Vitals green. Google uses this as a ranking signal.



8. **Zero 404s** — immutable IDs + slug_redirects = every URL works forever. Google penalizes sites with 404s. Yours has zero.



## Fields That Look Optional But Aren't



```

estimated_read_time_minutes    → Signals content depth to crawlers and users

bloom_level                    → Enables adaptive learning paths, filtering

difficulty_score (0.0-1.0)     → Machine-sortable — better than text labels alone

source_page on every block     → GEO citation accuracy — non-negotiable

ingest_metadata.warnings[]     → Tells you which extractions to manually verify

export_manifest                → Track what's possible even before it's built

design_meta                    → Frontend rendering hints — never leave null

past_paper_years on MCQs       → Massive SEO: "2022 Punjab board exam question"

cloze on flashcards            → Anki export compatibility — new distribution channel

answer_plain on ai_answer_hub  → AEO parsers prefer clean text over markdown

llm_summary in geo             → The exact text you want AI engines to quote

content_hash on documents      → Prevents duplicate ingestion — save Qwen API costs

failed_searches collection     → Your best signal for what to ingest next

```



---



*This is v2.0 of the constitution. Build nothing until this is understood end to end.*

*Version 2.0 | June 2026 | Muhammad Ali (Starly)*

*Next version trigger: when a new document type is added or a collection is modified.*

DOCEOF

echo "Done"

Output



## PART 15 — THEME INGESTION LAW (COLOR CONFIGURATION)

When a document passes through the ingestion pipe, a customized branding color palette dictionary can optionally be passed.
- If specific color variables are supplied: `is_hardcoded` is written as `true`, and the hex values lock into the palette keys.
- If color variables are omitted: `is_hardcoded` defaults to `false`, and the fields point to the application's fallback CSS custom properties.
- CRITICAL LAW FOR THE EXTRACTION RUNNER: The parsing agent must NEVER hardcode traditional static tailwind class targets (such as `bg-blue-600` or `text-amber-500`) directly into layout presentation profiles or component text templates. It must strictly wrap elements using abstract token identifiers: `bg-book-primary`, `text-book-secondary`, `border-book-accent`, and `bg-book-surface`.


## PART 16 — SACRED TEXT INGESTION & VERIFICATION PROTOCOL (QURANIC RULE)

Because Quranic Arabic script and structural text are highly sensitive, the AI processing pipeline is strictly forbidden from generating or typing raw Arabic script strings manually into the database content properties.

### 📋 Ingestion Mapping Rules:
- DETECTION: If the ingestion worker identifies an Arabic passage, an Ayah citation, or a direct textual reference within any standard textbook or Tarjamat-ul-Quran module, it must extract the exact metadata coordinates.
- METADATA COORDINATES: The worker must resolve the reference to its exact:
  1. Surah Number
  2. Ayah Number
  3. Precise Word Position Range (e.g., Word 3 to Word 5) if it is a specific word/phrase match.
- INLINE STRUCTURAL TAGGING: The worker will replace the Arabic text string inside the content field with an immutable structural reference token format: `[QURAN:SURAH:AYAH:START_POSITION-END_POSITION]`.
- TRANSLATION HANDLING: If the source textbook follows its own specific Urdu translation, that specific Urdu text string must be preserved exactly inside the layout node without any modification.

### 🎨 Frontend Presentation Rule:
- When the Next.js rendering engine processes an inline reference token `[QURAN:X:Y:Z]`, it will look up the verified, static, flawless Arabic text block from our external secure Quran API or dedicated database collection using the coordinate parameters.
- It will render the verified Arabic script cleanly on top as an overlay component while displaying the textbook's authorized Urdu translation text directly beneath it. This ensures absolute protection against text corruption.
