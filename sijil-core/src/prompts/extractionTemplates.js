import { THE_15_LAWS } from './laws.js';

/**
 * Returns type-specific extraction rules based on document type.
 * @param {string} documentType - The type of document being processed.
 * @returns {string} Type-specific rules string.
 */
function getDocumentTypeRules(documentType) {
  const rules = {
    textbook: `- Extract Student Learning Outcomes from chapter opening
- Capture all "Do You Know?", "Fun Fact", "Biography" special boxes
- Exercises chapter is always display_order: 999
- Preserve past_paper_years on MCQs if mentioned
- Islamic Values / Quran boxes: use [QURAN:S:A:W] token format`,

    sop: `- Each procedural step is a separate content block
- Preserve all warning, caution, and note callouts
- Responsible party for each step must be captured
- Numbered steps must maintain exact numbering`,

    legal: `- Every clause number and text verbatim — no paraphrasing
- Flag risk words: shall, must, liable, penalt*, terminat*, breach
- All defined terms go in key_terms[]
- Effective dates, expiry dates, review dates must be captured`,

    course: `- Learning objectives per lesson in learning_objectives[]
- Key takeaways in key_terms[]
- Assessment rubrics in assessments[]
- Resource links in cross_concept_links[]`,

    research_paper: `- Abstract → ai_answer_hub.answer_plain
- Every citation → geo.citations[]
- Methodology section → dedicated topic
- Results and Discussion → separate topics`
  };

  return rules[documentType] || `- Extract all headings as topics
- Capture all tables with full data
- Preserve all numbered lists
- Key definitions in key_terms[]`;
}

/**
 * Builds a system prompt for document-level extraction.
 * @param {{ documentType: string }} params - Document type parameter.
 * @returns {string} System prompt string.
 */
export function buildDocumentSystemPrompt({ documentType }) {
  const docType = documentType || 'textbook';
  
  return `You are Sijil's document intelligence engine.
Your task is to extract structured content from a ${docType} document.
You have access to the complete document text.

${THE_15_LAWS}

OUTPUT SCHEMA:
You must output a single JSON object matching the Sijil Document Ingest Schema exactly.
The schema includes: document_metadata, chapters[], seo_master, geo, design_meta, publishing.

DOCUMENT TYPE SPECIFIC RULES for ${docType}:
${getDocumentTypeRules(docType)}

Begin extraction now. Output raw JSON only.`;
}

/**
 * Builds a user prompt for topic-level extraction within a chapter.
 * @param {{ chapterTitle: string, chapterNumber: number|string, documentType: string, subject: string, gradeLevel: string, totalPages: number|null }} params - Extraction parameters.
 * @returns {string} User prompt string.
 */
export function buildTopicExtractionPrompt({ 
  chapterTitle, 
  chapterNumber, 
  documentType, 
  subject, 
  gradeLevel, 
  totalPages 
}) {
  return `Extract ALL topics from Chapter ${chapterNumber}: "${chapterTitle}"

Document context:
- Type: ${documentType || 'textbook'}
- Subject: ${subject || 'Not specified'}
- Grade/Level: ${gradeLevel || 'Not specified'}
- Approximate pages: ${totalPages || 'Unknown'}

EXTRACTION REQUIREMENTS:
1. Extract every topic, subtopic, and section as a separate topic object.
2. The last topic (display_order: 999) must capture ALL exercises, MCQs, and problems.
3. For every formula found: populate both latex and text fields.
4. For every figure referenced: populate alt with 20+ descriptive words.
5. For every MCQ: 4 options (a/b/c/d), correct_answer, non-empty explanation.

MISS NOTHING CHECKLIST — verify before outputting:
☐ All numbered section headings extracted as topics
☐ All "Do You Know?" / "For Your Information" / "Think About It" boxes captured
☐ All worked examples included with full step-by-step solutions
☐ All numerical problems included with final_answer populated
☐ All chapter-end exercises captured in display_order: 999 topic
☐ All formulas have both latex and text
☐ All figures have 20+ word alt text

Output a JSON array of topic objects matching the TopicIngestSchema.
Raw JSON only. No markdown. No explanation.`;
}

/**
 * Builds a prompt for re-ingestion where content has changed.
 * @param {{ previousVersionSummary: string, changesDetected: string }} params - Re-ingestion parameters.
 * @returns {string} Re-ingestion prompt string.
 */
export function buildReingestionPrompt({ previousVersionSummary, changesDetected }) {
  return `You are re-extracting content from an updated document.

Previous version summary: ${previousVersionSummary}
Detected changes: ${changesDetected}

Extract the complete updated content following all 15 Laws.
Pay special attention to sections that likely changed.
Output complete JSON — not a diff, not partial content. Full extraction.
Raw JSON only.`;
}
