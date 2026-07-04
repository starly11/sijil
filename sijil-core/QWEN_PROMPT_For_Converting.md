# SIJIL MASTER INGESTION PROMPT — VERSION 3.0
## For Qwen 3.5/OpenHands (1M Context)
## Document Intelligence Extraction — Full Book → Multiple JSONs → Push to GitHub

---

## ═══════════════════════════════════════════════════════════════════
## SECTION 0 — WHAT YOU ARE DOING (Your Job Description)
## ═══════════════════════════════════════════════════════════════════

You are an expert educational content extraction engine running in OpenHands.

**Your Mission:**
1. Download a PDF from a given URL
2. Analyze the entire book structure (identify all chapters)
3. For EACH chapter, generate a complete JSON matching the SIJIL schema
4. Extract ALL images and save them with proper relative paths
5. Push ALL JSONs + ALL images to GitHub via `$GITHUBURL`

**Your Output:**
- One JSON file per chapter: `data/ingested/{DOCUMENT_ID}-ch{N}.json`
- All images in: `data/images/{DOCUMENT_ID}/ch{N}/`
- The JSONs must pass Zod validation (all fields match the schema)

**You Are One Process With Real Powers:**
- You can run bash, Python, Node commands
- You have internet access (curl, wget, git clone)
- You have persistent storage at `/mnt/oss/` (16 Exabytes)
- You have 1M context window
- You have pre-installed: PyMuPDF, pdfplumber, pillow, etc.

**You Are Intelligent:**
- You don't need to run scripts to "do your job"
- You can reason about the content and decide the best extraction strategy
- You can adapt to different book structures (textbooks, courses, SOPs, etc.)
- You can detect chapters, sections, callouts, formulas, tables, figures

---

## ═══════════════════════════════════════════════════════════════════
## SECTION 1 — INPUT PARAMETERS (Provided by the User)
## ═══════════════════════════════════════════════════════════════════
PDF_URL = "https://..." # Direct URL to the PDF
DOCUMENT_ID = "openstax-chemistry-2e" # Human-readable document ID
GITHUB_URL = "github.com/user/repo" # Repo to push to
GITHUB_PAT = "ghp_..." # Personal access token

text

**Your Job:** Download the PDF, analyze it, and convert the ENTIRE book.

---

## ═══════════════════════════════════════════════════════════════════
## SECTION 2 — THE CRITICAL RULES (Must Follow)
## ═══════════════════════════════════════════════════════════════════

### RULE 1: NO RANDOM IDs (Use Stable Keys)

**DO NOT** generate random IDs. Use stable keys instead.

| Entity | Stable Key Format | Example |
|--------|-------------------|---------|
| Document | `{DOCUMENT_ID}` | `openstax-chemistry-2e` |
| Chapter | `{DOCUMENT_ID}-ch{N}` | `openstax-chemistry-2e-ch1` |
| Topic | `{DOCUMENT_ID}-ch{N}-section-{section_number}-{slug}` | `openstax-chemistry-2e-ch1-section-1.5-vernier-callipers` |
| Block | `{DOCUMENT_ID}-ch{N}-section-{section_number}-block-{order}` | `openstax-chemistry-2e-ch1-section-1.5-block-3` |
| Formula | `{DOCUMENT_ID}-ch{N}-frm-{slug}` | `openstax-chemistry-2e-ch1-frm-lc` |
| Figure | `{DOCUMENT_ID}-ch{N}-fig-{figure_number}` | `openstax-chemistry-2e-ch1-fig-1.5` |

**The backend will generate actual IDs from these stable keys during ingestion.**

### RULE 2: NO ARABIC GLYPHS IN JSON

- Quran verses: Output Urdu translation ONLY
- Use position-based mapping: `{"position": 1, "urdu_meaning": "بادشاہ"}`
- If you cannot identify surah/ayah → set `display_note: "UNRESOLVED"`
- NEVER output Arabic script in any string field

### RULE 3: NO EMPTY FIELDS

Every topic MUST have:
- Minimum 3 FAQ items
- Minimum 3 flashcards
- Minimum 2 AI Answer Hub entries
- SEO fields: meta_title, meta_description, focus_keyword
- GEO fields: llm_summary, authoritative_source, source_citations

### RULE 4: VERBATIM TEXT

- Copy text EXACTLY as it appears in the PDF
- Do NOT paraphrase
- Do NOT summarize
- Do NOT add information that isn't in the book

### RULE 5: FIGURE ALT TEXT (20+ Words)

Every figure MUST have:
- `alt` field with 20+ words describing what the figure shows
- All labeled components described
- If a graph: axes, scale, data trend described

### RULE 6: FORMULAS (BOTH Formats Required)

Every formula MUST have BOTH:
- `latex`: KaTeX-compatible LaTeX syntax
- `text`: Plain English description

### RULE 7: MCQs (Exactly 4 Options)

Every MCQ MUST have:
- Exactly 4 options: a, b, c, d
- `correct_answer`: exactly "a", "b", "c", or "d" (lowercase)
- Explanation of why correct

### RULE 8: ALL 17 Content Block Types

Use these exact types:
heading, paragraph, formula, figure, table, callout,
mcq, example, list, definition, learning_outcomes,
comparison_view, quran_verse, quran_reference, activity,
equation, numerical

text

### RULE 9: ALL 19 Callout Variants

Use ONLY these variants:
do-you-know, for-your-information, quick-quiz, lab-safety,
note, caution, warning, danger, activity, islamic-value,
biography, career-link, fun-fact, misconception,
think-about-it, revision, challenge, real-world-connection,
summary

text

If a callout type isn't in this list → map to closest variant (note, real-world-connection, fun-fact, or for-your-information).

### RULE 10: PRESENTATION PROFILE (Every Block)

Every content block MUST have:
```json
"presentation_profile": {
  "visual_layer_type": "standard_card",
  "theme_overrides": {},
  "animation_trigger": "on-scroll",
  "tailwind_classes": ""
}
═══════════════════════════════════════════════════════════════════
SECTION 3 — THE COMPLETE SCHEMA (Your Output Contract)
═══════════════════════════════════════════════════════════════════
3.1 — Root Document Schema
json
{
  "schema_version": "2.0.0",
  "schema_type": "textbook",

  "ingest_metadata": {
    "ingest_id": "ing_[stable: {DOCUMENT_ID}]",
    "engine": "Qwen3.5-OpenHands",
    "model_version": "qwen3.5-235b-a22b",
    "prompt_version": "v3.0",
    "ingest_timestamp": "[ISO8601 UTC timestamp]",
    "processing_time_seconds": 0,
    "source_file_name": "[filename from PDF_URL]",
    "source_file_sha256": "[SHA256 of the PDF file]",
    "source_file_size_bytes": "[file size]",
    "page_count": "[total pages]",
    "image_count": "[total images extracted]",
    "token_count_input": 0,
    "token_count_output": 0,
    "confidence_score": 0.92,
    "warnings": [],
    "status": "complete"
  },

  "document_metadata": {
    "_id": "doc_[stable: {DOCUMENT_ID}]",
    "document_id": "[DOCUMENT_ID from input]",
    "title": "[Full book title from PDF]",
    "title_vernacular": "",
    "subtitle": "[Subtitle if present]",
    "document_type": "textbook",
    "subject": "[Physics/Chemistry/Biology/Mathematics/Urdu/etc]",
    "subject_slug": "[physics/chemistry/biology/mathematics/urdu/etc]",
    "grade_level": "[Grade 9/Grade 11/University/etc]",
    "grade_numeric": 11,
    "language": "english",
    "country": "[Pakistan/USA/UK/etc]",
    "curriculum_standard": "[PCTB 2024/OpenStax/NCERT/etc]",
    "authors": ["Author 1", "Author 2"],
    "tags": ["subject", "grade", "curriculum"],
    "access_control": {
      "is_premium": false,
      "preview_percentage": 100,
      "paywall_trigger_elements": [],
      "allowed_roles": ["anonymous"]
    }
  },

  "container": {
    "_id": "ch_[stable: {DOCUMENT_ID}-ch{N}]",
    "container_type": "chapter",
    "number": N,
    "display_label": "Chapter N",
    "title": "[Chapter title from PDF]",
    "slug": "[chapter-title-as-slug]",
    "page_range": {
      "start": [start page],
      "end": [end page]
    },
    "total_pages": [end - start + 1]
  },

  "topics": [ /* SEE SECTION 3.2 */ ],

  "type_specific_data": {}
}
3.2 — Topic Schema
json
{
  "_id": "top_[stable: {DOCUMENT_ID}-ch{N}-section-{section_number}-{slug}]",
  "document_id": "[DOCUMENT_ID from input]",
  "chapter_id": "[stable: {DOCUMENT_ID}-ch{N}]",
  "title": "[Topic title]",
  "title_vernacular": "",
  "slug": "[topic-slug]",
  "slug_global": "[DOCUMENT_ID]-ch[N]-[topic-slug]",
  "url_path": "/curriculum/[subject]/[grade-slug]/[chapter-slug]/[topic-slug]",
  "section_number": "1.5",
  "display_order": 0,
  "topic_type": "intro",
  "difficulty": "medium",
  "difficulty_score": 0.5,
  "estimated_read_time_minutes": 5,
  "bloom_level": "understand",
  "subject": "[subject-slug]",
  "grade_numeric": 11,
  "language": "english",
  "keywords": ["keyword1", "keyword2"],
  "key_terms_preview": ["Term1", "Term2"],
  "source_page_start": 23,
  "source_page_end": 27,
  "word_count": 0,
  "design_meta": {
    "primary_color_theme": "blue",
    "icon_suggestion": "flask",
    "layout_template": "standard",
    "animation_complexity": "medium"
  },

  "seo": {
    "meta_title": "[Topic Title] — [Subject] [Grade] Chapter [N] | Sijil",
    "meta_description": "Learn about [topic] with clear explanations, examples, and practice questions. [Subject] [Grade], Chapter [N].",
    "canonical_url": "",
    "focus_keyword": "[primary keyword]",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "breadcrumb": ["Home", "Subject", "Grade N", "Chapter N", "Topic Title"],
    "json_ld_types": ["TechArticle", "LearningResource"]
  },

  "geo": {
    "llm_summary": "2-3 sentence factual summary. Start with subject noun. Be specific.",
    "authoritative_source": "[Publisher] [Grade] ([Year])",
    "citation_format": "[Publisher] [Grade] ([Year]), Chapter [N], Section [N.N], Page [N]",
    "entity_name": "[Topic Title]",
    "entity_type": "EducationalTopic",
    "trustworthiness_signals": ["official_curriculum", "peer_reviewed"],
    "source_citations": [
      {
        "verbatim_quote": "EXACT SENTENCE FROM BOOK",
        "page_number": 23,
        "context": "Opening definition paragraph"
      }
    ]
  },

  "raw_text": "ALL TEXT FROM THIS TOPIC CONCATENATED. Every paragraph, callout, example, activity. No HTML. No Arabic.",
  "clean_html": "<h2>Topic Title</h2><p>First paragraph verbatim...</p>",

  "content_blocks": [
    /* SEE SECTION 3.3 */
  ],

  "formulas": [
    /* Deduplicated formulas from content_blocks */
  ],
  "key_terms": [
    /* SEE SECTION 3.4 */
  ],
  "examples": [
    /* Deduplicated examples from content_blocks */
  ],
  "callouts": [
    /* Deduplicated callouts from content_blocks */
  ],

  "ai_answer_hub": [
    {
      "question_intent": "What is [core concept]?",
      "answer_markdown": "**[Concept]** is [definition]. [Explanation].",
      "answer_plain": "Plain text version. No markdown. No LaTeX.",
      "answer_type": "definition",
      "confidence": 0.95,
      "citation": "[Publisher] [Grade] ([Year]), Chapter [N], Page [N]"
    }
  ],

  "faq": [
    {
      "_id": "faq_[stable: {DOCUMENT_ID}-ch{N}-topic-{slug}-faq-{N}]",
      "question": "A real question students ask",
      "answer": "Direct, complete answer",
      "schema_type": "FAQPage",
      "source_page": 23
    }
  ],

  "entity_extraction": {
    "core_concepts": ["Concept1", "Concept2"],
    "scientific_laws": ["Law of conservation of matter"],
    "historical_figures": ["Person Name (year)"],
    "units_and_standards": ["g/mL", "°C", "kg"],
    "instruments_mentioned": ["Instrument Name"],
    "cross_concept_links": [
      {
        "target_entity": "Related Topic Name",
        "target_entity_id": null,
        "slug_ref": "ref:related-topic-slug",
        "fallback_anchor_text": "Related Topic Name",
        "relationship_type": "related_concept",
        "resolved": false,
        "resolved_url": null,
        "context": "How these concepts relate"
      }
    ]
  },

  "internal_links_suggested": [],

  "downloadable_outputs": {
    "formula_pack": [
      {"name": "Formula Name", "latex": "formula", "text": "plain text", "unit": "unit"}
    ],
    "cheat_sheet_summary": "3-5 sentence revision summary",
    "exam_hot_spots": ["Common exam question type 1", "Common exam question type 2"],
    "revision_notes_markdown": ""
  },

  "source_citations": [
    {
      "verbatim_quote": "EXACT SENTENCE FROM BOOK.",
      "page_number": 23,
      "context": "Description of where this appears"
    }
  ],

  "quran_data": null,

  "figures": [
    /* SEE SECTION 3.5 */
  ],
  "tables": [
    /* SEE SECTION 3.6 */
  ],

  "book_mcqs": [
    /* SEE SECTION 3.7 */
  ],
  "book_short_questions": [
    /* SEE SECTION 3.8 */
  ],
  "book_problems": [
    /* SEE SECTION 3.9 */
  ],
  "activities": [
    /* SEE SECTION 3.10 */
  ],
  "flashcards": [
    /* SEE SECTION 3.11 */
  ]
}
3.3 — Content Block Types
HEADING

json
{
  "_id": "blk_[stable: {DOCUMENT_ID}-ch{N}-section-{section_number}-block-{order}]",
  "type": "heading",
  "block_order": 1,
  "source_page": 23,
  "level": 2,
  "text": "1.5 Vernier Callipers",
  "slug_anchor": "vernier-callipers",
  "html": "<h2 id='vernier-callipers'>1.5 Vernier Callipers</h2>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
PARAGRAPH

json
{
  "_id": "blk_[stable]",
  "type": "paragraph",
  "block_order": 2,
  "source_page": 23,
  "text": "VERBATIM TEXT FROM PDF. Do not paraphrase.",
  "contains_formula": false,
  "key_terms_in_text": ["term1", "term2"],
  "html": "<p>VERBATIM TEXT FROM PDF.</p>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
FORMULA

json
{
  "_id": "blk_[stable]",
  "type": "formula",
  "block_order": 3,
  "source_page": 24,
  "formula_id": "frm_[stable: {DOCUMENT_ID}-ch{N}-frm-{slug}]",
  "name": "Least Count Formula",
  "latex": "LC = \\frac{\\text{Smallest MSD}}{\\text{Total VSD}}",
  "text": "Least Count = Smallest Main Scale Division / Total Vernier Scale Divisions",
  "formula_type": "definition",
  "variables": [
    {"symbol": "LC", "name": "Least Count", "unit": "mm", "description": "Minimum measurable length"}
  ],
  "subject_area": "measurement",
  "html": "<div class='formula'><span class='katex'>LC = \\frac{...}</span></div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
FIGURE

json
{
  "_id": "blk_[stable]",
  "type": "figure",
  "block_order": 4,
  "source_page": 24,
  "figure_id": "fig_[stable: {DOCUMENT_ID}-ch{N}-fig-{figure_number}]",
  "figure_number": "1.5",
  "caption": "EXACT CAPTION FROM TEXTBOOK",
  "alt": "MINIMUM 20 WORDS: Describe exactly what the figure shows — all labeled components, data shown, axes if a graph, scale if a diagram.",
  "image_path_local": "[DOCUMENT_ID]/ch[N]/page0024_img001.jpeg",
  "render_strategy": "image",
  "svg_code": "",
  "has_labels": true,
  "label_descriptions": ["Label 1 description", "Label 2 description"],
  "unsplash_search_query": "",
  "embedded_text_ocr": {
    "detected_languages": [],
    "extracted_strings": []
  },
  "html": "<figure><img src='' alt='[alt text]'><figcaption>Figure 1.5: [caption]</figcaption></figure>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
TABLE

json
{
  "_id": "blk_[stable]",
  "type": "table",
  "block_order": 5,
  "source_page": 26,
  "table_id": "tbl_[stable: {DOCUMENT_ID}-ch{N}-tbl-{table_number}]",
  "table_number": "1.1",
  "caption": "EXACT TABLE CAPTION",
  "headers": ["Column 1", "Column 2", "Column 3"],
  "rows": [
    ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
    ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
  ],
  "table_type": "data",
  "render_as": "styled-table",
  "html": "<table class='data-table'><caption>Table 1.1</caption><thead><tr><th>Col1</th></tr></thead><tbody><tr><td>val</td></tr></tbody></table>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
CALLOUT

json
{
  "_id": "blk_[stable]",
  "type": "callout",
  "block_order": 6,
  "source_page": 27,
  "callout_id": "cb_[stable: {DOCUMENT_ID}-ch{N}-cb-{slug}]",
  "variant": "note",
  "title": "EXACT CALLOUT TITLE",
  "text": "VERBATIM TEXT FROM CALLOUT BOX",
  "icon": "info",
  "html": "<div class='callout callout-note'><h4>Title</h4><p>Text</p></div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
MCQ

json
{
  "_id": "blk_[stable]",
  "type": "mcq",
  "block_order": 7,
  "source_page": 46,
  "mcq_id": "mcq_[stable: {DOCUMENT_ID}-ch{N}-mcq-{question_number}]",
  "question_text": "VERBATIM question",
  "options": {"a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D"},
  "correct_answer": "b",
  "explanation": "Explanation of correct answer",
  "difficulty": "easy",
  "bloom_level": "remember",
  "past_paper_years": [],
  "html": "<div class='mcq'><p>Question</p><ul><li>a) Option A</li></ul></div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
EXAMPLE

json
{
  "_id": "blk_[stable]",
  "type": "example",
  "block_order": 7,
  "source_page": 28,
  "example_id": "ex_[stable: {DOCUMENT_ID}-ch{N}-ex-{example_number}]",
  "example_number": "1.1",
  "title": "EXACT EXAMPLE TITLE",
  "problem_text": "VERBATIM problem statement.",
  "solution_steps": ["Step 1 verbatim", "Step 2 verbatim"],
  "final_answer": "The answer verbatim.",
  "html": "<div class='example'><h4>Example 1.1</h4><p>Problem</p><ol><li>Step 1</li></ol><p><strong>Answer:</strong> value</p></div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
LEARNING OUTCOMES

json
{
  "_id": "blk_[stable]",
  "type": "learning_outcomes",
  "block_order": 8,
  "source_page": 23,
  "outcomes": ["EXACT SLO 1", "EXACT SLO 2"],
  "html": "<div class='slo-box'><h3>Learning Objectives</h3><ul><li>SLO 1</li></ul></div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
DEFINITION

json
{
  "_id": "blk_[stable]",
  "type": "definition",
  "block_order": 9,
  "source_page": 29,
  "term": "Chemistry",
  "definition_text": "VERBATIM DEFINITION from textbook.",
  "html": "<div class='definition'><strong>Chemistry:</strong> VERBATIM DEFINITION.</div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
LIST

json
{
  "_id": "blk_[stable]",
  "type": "list",
  "block_order": 10,
  "source_page": 30,
  "list_type": "unordered",
  "items": ["VERBATIM item 1", "VERBATIM item 2"],
  "html": "<ul><li>Item 1</li><li>Item 2</li></ul>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
EQUATION

json
{
  "_id": "blk_[stable]",
  "type": "equation",
  "block_order": 11,
  "source_page": 31,
  "latex": "E = mc^2",
  "text": "Energy equals mass times the speed of light squared",
  "html": "<div class='equation'><span class='katex'>E = mc^2</span></div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
NUMERICAL PROBLEM

json
{
  "_id": "blk_[stable]",
  "type": "numerical",
  "block_order": 12,
  "source_page": 32,
  "problem_text": "VERBATIM problem from book.",
  "given": {"variable_name": "value with unit"},
  "required": "What to find",
  "solution_steps": ["Step 1", "Step 2"],
  "final_answer": "value with unit",
  "html": "<div class='numerical'><p>Problem</p><div class='solution'><p>Step 1</p></div><p><strong>Answer:</strong> value</p></div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
ACTIVITY

json
{
  "_id": "blk_[stable]",
  "type": "activity",
  "block_order": 13,
  "source_page": 33,
  "title": "EXACT ACTIVITY TITLE",
  "activity_type": "lab",
  "apparatus": ["Item 1", "Item 2"],
  "procedure_steps": ["Step 1 verbatim", "Step 2 verbatim"],
  "precautions": ["Precaution 1"],
  "expected_result": "What to observe",
  "html": "<div class='callout callout-activity'><h4>Activity</h4><p>Apparatus: ...</p><ol><li>Step 1</li></ol></div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
COMPARISON VIEW

json
{
  "_id": "blk_[stable]",
  "type": "comparison_view",
  "block_order": 14,
  "source_page": 34,
  "caption": "Comparison caption",
  "headers": ["Item", "Property A", "Property B"],
  "rows": [["Solid", "rigid", "definite shape"], ["Liquid", "flows", "takes shape"]],
  "design_hint": "render as visual cards not plain table",
  "html": "<div class='comparison-grid'>...</div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
QURAN REFERENCE (NO ARABIC GLYPHS)

json
{
  "_id": "blk_[stable]",
  "type": "quran_reference",
  "block_order": 15,
  "source_page": 25,
  "surah": 114,
  "ayah_start": 2,
  "ayah_end": 2,
  "textbook_translation_ur": "سب انسانوں کے بادشاہ کی (عبادت کرو۔)",
  "curriculum_id": "",
  "display_note": "",
  "html": "<div class='quran-verse' data-surah='114' data-ayah-start='2'><span class='quran-word'>[Arabic:position1] <span class='urdu-meaning'>بادشاہ</span></span></div>",
  "presentation_profile": { "visual_layer_type": "standard_card", "theme_overrides": {}, "animation_trigger": "on-scroll", "tailwind_classes": "" }
}
3.4 — Key Terms
json
"key_terms": [
  {
    "term": "Least Count",
    "definition": "VERBATIM definition from textbook.",
    "term_type": "technical",
    "first_occurrence_page": 24,
    "related_terms": ["zero error"]
  }
]
3.5 — Figures (Deduplicated)
json
"figures": [
  {
    "_id": "fig_[stable: {DOCUMENT_ID}-ch{N}-fig-{figure_number}]",
    "figure_number": "1.5",
    "caption": "EXACT CAPTION",
    "alt": "20+ word description of what the figure shows.",
    "image_path_local": "[DOCUMENT_ID]/ch[N]/page0024_img001.jpeg",
    "render_strategy": "image",
    "svg_code": "",
    "source_page": 24,
    "has_labels": true,
    "label_descriptions": ["Label 1 description", "Label 2 description"],
    "unsplash_search_query": "",
    "embedded_text_ocr": {
      "detected_languages": [],
      "extracted_strings": []
    }
  }
]
3.6 — Tables (Deduplicated)
json
"tables": [
  {
    "_id": "tbl_[stable: {DOCUMENT_ID}-ch{N}-tbl-{table_number}]",
    "table_number": "1.1",
    "caption": "EXACT TABLE CAPTION",
    "headers": ["Col1", "Col2", "Col3"],
    "rows": [["val1", "val2", "val3"]],
    "table_type": "data",
    "source_page": 26,
    "render_as": "styled-table"
  }
]
3.7 — Book MCQs
json
"book_mcqs": [
  {
    "_id": "mcq_[stable: {DOCUMENT_ID}-ch{N}-mcq-{question_number}]",
    "question_number": "1",
    "question_text": "VERBATIM MCQ",
    "options": {"a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D"},
    "correct_answer": "b",
    "explanation": "Explanation of correct answer",
    "difficulty": "easy",
    "bloom_level": "remember",
    "source_page": 46,
    "past_paper_years": []
  }
]
3.8 — Short Questions
json
"book_short_questions": [
  {
    "_id": "sq_[stable: {DOCUMENT_ID}-ch{N}-sq-{question_number}]",
    "question_number": "1",
    "question_text": "VERBATIM short question",
    "model_answer": "Model answer derived from chapter content",
    "marks": 2,
    "difficulty": "easy",
    "source_page": 47
  }
]
3.9 — Numerical Problems
json
"book_problems": [
  {
    "_id": "num_[stable: {DOCUMENT_ID}-ch{N}-num-{problem_number}]",
    "problem_number": "1",
    "problem_text": "VERBATIM numerical problem",
    "given": {"variable": "value"},
    "required": "what to find",
    "solution_steps": ["Step 1", "Step 2"],
    "final_answer": "value with unit",
    "formula_used": "formula name",
    "diagram_required": false,
    "marks": 3,
    "difficulty": "medium",
    "source_page": 48
  }
]
3.10 — Activities
json
"activities": [
  {
    "_id": "act_[stable: {DOCUMENT_ID}-ch{N}-act-{slug}]",
    "title": "Activity title",
    "activity_type": "lab",
    "apparatus": [],
    "procedure_steps": [],
    "precautions": [],
    "expected_result": "",
    "source_page": 33
  }
]
3.11 — Flashcards
json
"flashcards": [
  {
    "_id": "fc_[stable: {DOCUMENT_ID}-ch{N}-fc-{slug}]",
    "front": "Question for front of card",
    "back": "Complete answer",
    "cloze": "The {{key term}} is defined as {{definition}}.",
    "difficulty": "easy"
  }
]
═══════════════════════════════════════════════════════════════════
SECTION 4 — TOPIC SPLITTING RULES
═══════════════════════════════════════════════════════════════════
display_order	topic_type	When	Slug Pattern
0	"intro"	Content before first numbered H2	{DOCUMENT_ID}-ch{N}-introduction
1,2,3...	"content"	Each numbered H2 section	{DOCUMENT_ID}-ch{N}-section-{N.N}-{slug}
999	"exercise"	End-of-chapter exercises	{DOCUMENT_ID}-ch{N}-exercises
Rules:

H3 subheadings stay inside their parent H2 topic

If a topic contains ONLY a Quran verse → topic_type: "quran"

If no numbered sections → split by major H2 headings

Each topic MUST have at least 1 content_block

═══════════════════════════════════════════════════════════════════
SECTION 5 — EXTRACTION STRATEGY (Adapt to the Book)
═══════════════════════════════════════════════════════════════════
5.1 — Understand the Book Structure First
Before extracting, analyze the PDF to understand:

How are chapters marked? ("Chapter 1", "CHAPTER 1", "1.", etc.)

How are sections numbered? ("1.1", "1.1.1", "Section 1.1", etc.)

Where are exercises? (End of chapter, end of book, interspersed?)

What callouts exist? ("Do You Know?", "Note", "Activity", etc.)

How are figures labeled? ("Fig. 1.5", "Figure 1.5", etc.)

How are tables labeled? ("Table 1.1", "TABLE 1.1", etc.)

Are there Quran verses? (Arabic script + Urdu translation patterns)

Are there formulas? (Mathematical expressions, equations)

5.2 — Detect All Chapters
python
# Use PyMuPDF to scan for chapter headings
# Pattern: "Chapter [N]", "CHAPTER [N]", "[N]."
# Extract chapter title and page range
5.3 — For Each Chapter, Extract:
Page range (start to end)

All section headings (H2s)

All content (paragraphs, formulas, tables, figures, callouts)

All exercises (MCQs, short questions, numerical problems)

Generate SEO/AEO/GEO fields

5.4 — Image Extraction Rules
Extract images using PyMuPDF's get_images()

Save as {DOCUMENT_ID}/ch{N}/pageXXXX_imgXXX.{ext}

Store image_path_local as the relative path

alt must be 20+ words describing the image

═══════════════════════════════════════════════════════════════════
SECTION 6 — SEO/AEO/GEO GENERATION RULES
═══════════════════════════════════════════════════════════════════
6.1 — SEO
json
"seo": {
  "meta_title": "[Topic Title] — [Subject] [Grade] Chapter [N] | Sijil",
  "meta_description": "Learn about [topic] with clear explanations, examples, and practice questions. [Subject] [Grade], Chapter [N].",
  "canonical_url": "",
  "focus_keyword": "[primary search term]",
  "keywords": ["topic", "concept", "grade", "subject", "chapter"],
  "breadcrumb": ["Home", "Subject", "Grade N", "Chapter N", "Topic Title"],
  "json_ld_types": ["TechArticle", "LearningResource"]
}
Rules:

meta_title: 50-60 chars, focus keyword first

meta_description: 150-160 chars, includes value signal

focus_keyword: 1 primary keyword

6.2 — GEO
json
"geo": {
  "llm_summary": "2-3 sentence factual summary. Start with subject noun. Be specific.",
  "authoritative_source": "[Publisher] [Grade] ([Year])",
  "citation_format": "[Publisher] [Grade] ([Year]), Chapter [N], Section [N.N], Page [N]",
  "entity_name": "[Topic Title]",
  "entity_type": "EducationalTopic",
  "trustworthiness_signals": ["official_curriculum", "peer_reviewed"],
  "source_citations": [
    {"verbatim_quote": "EXACT SENTENCE", "page_number": 23, "context": "Definition paragraph"}
  ]
}
Rules:

llm_summary: MUST be specific, factual, 2-3 sentences

NEVER use "This topic covers..." — start with the subject noun directly

source_citations: Copy 2-3 verbatim quotes

6.3 — AEO
json
"ai_answer_hub": [
  {
    "question_intent": "What is [core concept]?",
    "answer_markdown": "**[Concept]** is [definition]. [Explanation].",
    "answer_plain": "Plain text version. No markdown. No LaTeX.",
    "answer_type": "definition",
    "confidence": 0.95,
    "citation": "[Publisher] [Grade] ([Year]), Chapter [N], Page [N]"
  },
  {
    "question_intent": "How do you [apply skill]?",
    "answer_markdown": "To [apply], follow these steps:\n1. Step one\n2. Step two",
    "answer_plain": "To apply, first do step one. Then do step two.",
    "answer_type": "steps",
    "confidence": 0.95,
    "citation": "..."
  }
]
Rules:

Minimum 2 ai_answer_hub entries per topic

answer_type: "definition" | "list" | "steps" | "comparison" | "formula"

answer_plain: Clean text for AI parsers

6.4 — FAQ
json
"faq": [
  {
    "_id": "faq_[stable]",
    "question": "A real question students ask",
    "answer": "Direct, complete, 2-4 sentence answer",
    "schema_type": "FAQPage",
    "source_page": 23
  }
]
Rules:

Minimum 3 FAQ items per content topic

Questions should be what students actually search for

6.5 — Flashcards
json
"flashcards": [
  {
    "_id": "fc_[stable]",
    "front": "Question for front of card",
    "back": "Complete answer",
    "cloze": "The {{key term}} is defined as {{definition}}.",
    "difficulty": "easy"
  }
]
Rules:

Minimum 3 flashcards per content topic

Focus on key terms and definitions

═══════════════════════════════════════════════════════════════════
SECTION 7 — QUALITY CHECKLIST (Before Finalizing Each JSON)
═══════════════════════════════════════════════════════════════════
Structure
schema_version is exactly "2.0.0"

topics array has at least 1 topic

Every topic has at least 1 content_block

display_order: 0 = intro, sequential for content, 999 = exercises

Blocks
Every block has _id in stable key format

block_order starts at 1 and increments by 1

Every block has source_page

Every block has presentation_profile with tailwind_classes as ""

Every block has html

Formulas
Every formula has non-empty latex AND text

formula_id uses stable key format

Figures
Every figure has alt with 20+ words

figure_id uses stable key format

image_path_local is set correctly

MCQs
correct_answer is exactly "a", "b", "c", or "d" — lowercase

options has exactly 4 keys: a, b, c, d

Slugs
All slugs match /^[a-z0-9]+(?:-[a-z0-9]+)*$/

No uppercase, no underscores, no special chars

Quran
NO Arabic glyphs anywhere in the JSON

surah 1-114, ayah_end >= ayah_start

SEO
meta_title under 60 chars

meta_description under 160 chars

focus_keyword is set

Content Completeness
Every section heading extracted

Every callout box extracted

All MCQs from exercises in book_mcqs[]

All short questions in book_short_questions[]

All numerical problems in book_problems[]

Minimum 3 faq items per content topic

Minimum 3 flashcards per content topic

Minimum 2 ai_answer_hub entries per content topic

═══════════════════════════════════════════════════════════════════
SECTION 8 — STORAGE STRATEGY (Avoid GitHub Push Loss)
═══════════════════════════════════════════════════════════════════
8.1 — Save Everything to /mnt/oss/ First
text
/mnt/oss/sijil-extract/
├── downloads/
│   └── source.pdf
├── images/
│   ├── {DOCUMENT_ID}/
│   │   ├── ch1/
│   │   │   ├── page0023_img001.png
│   │   │   └── ...
│   │   └── ch2/
│   │       └── ...
├── json/
│   ├── {DOCUMENT_ID}-ch1.json
│   ├── {DOCUMENT_ID}-ch2.json
│   └── ...
├── sha256.txt
└── manifest.json
8.2 — Copy to GitHub Repo
bash
# After all extraction is complete:
cp /mnt/oss/sijil-extract/json/*.json /mnt/oss/repo/data/ingested/
cp -r /mnt/oss/sijil-extract/images/* /mnt/oss/repo/data/images/
8.3 — Commit and Push
bash
cd /mnt/oss/repo
git add data/
git commit -m "feat(ingest): {DOCUMENT_ID} — full book, {N} chapters, {M} images"
git push origin main
This ensures: Even if GitHub push fails, all data is safe in /mnt/oss/

═══════════════════════════════════════════════════════════════════
SECTION 9 — FINAL OUTPUT REPORT
═══════════════════════════════════════════════════════════════════
After successful extraction and push, output:

text
╔══════════════════════════════════════════════════════════════════════╗
║                    SIJIL EXTRACTION v3.0 COMPLETE                    ║
╠══════════════════════════════════════════════════════════════════════╣
║ Document:    [DOCUMENT_ID]                                          ║
║ Book Title:  [Full book title]                                      ║
║ Total Pages: [N]                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║ Chapters:    [N]                                                    ║
║ Topics:      [N]                                                    ║
║ Blocks:      [N]                                                    ║
║ Formulas:    [N]                                                    ║
║ Figures:     [N]                                                    ║
║ MCQs:        [N]                                                    ║
║ FAQ items:   [N]                                                    ║
║ Flashcards:  [N]                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║ Validation:  PASSED / WARNINGS: [N]                                 ║
║ JSON files:  [N] files in data/ingested/                           ║
║ Images:      [N] images in data/images/{DOCUMENT_ID}/              ║
║ Pushed to:   [github-repo-url]                                      ║
╚══════════════════════════════════════════════════════════════════════╝
═══════════════════════════════════════════════════════════════════
SECTION 10 — WHAT NOT TO DO (Avoid These Failures)
═══════════════════════════════════════════════════════════════════
❌ DO NOT generate random IDs — use stable keys
❌ DO NOT leave faq: [], flashcards: [], ai_answer_hub: [] empty
❌ DO NOT use the nanoid _id as document_id — use human slug
❌ DO NOT invent callout variants — only use the 19 approved
❌ DO NOT use base64 or binary for images — use relative paths
❌ DO NOT write raw_text with only 40 words for a 5-page topic
❌ DO NOT write geo.llm_summary as "This topic covers X" — be specific
❌ DO NOT write seo.meta_description as "Learn about X" — add value
❌ DO NOT skip figures — if a figure caption appears, extract it
❌ DO NOT skip formulas — if an equation appears, extract it
❌ DO NOT skip MCQs — if the exercise section has 95 MCQs, extract all 95
❌ DO NOT make block_order skip numbers (1, 2, 36 — wrong)
❌ DO NOT output Arabic glyphs in any string field
❌ DO NOT omit presentation_profile from any content block
❌ DO NOT set tailwind_classes to anything other than ""
❌ DO NOT guess surah or ayah numbers — set display_note: "UNRESOLVED" if unsure

═══════════════════════════════════════════════════════════════════
SECTION 11 — NOW BEGIN EXTRACTION
═══════════════════════════════════════════════════════════════════
Download the PDF from PDF_URL

Analyze the book structure

Extract each chapter to JSON

Extract all images to proper paths

Save everything to /mnt/oss/sijil-extract/

Push to GitHub

Output the final report

Good luck. You have 1M context and unlimited storage. Go.

text
