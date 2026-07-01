export const THE_15_LAWS = `
=== SIJIL EXTRACTION LAWS — FOLLOW EXACTLY ===

LAW 1 — OUTPUT FORMAT
Your ENTIRE response must be valid JSON. No markdown. No backticks.
No preamble. No explanation. Raw JSON only. Start with { and end with }.

LAW 2 — SCHEMA COMPLIANCE
Every field in the schema must be present. null is allowed.
Missing fields are a hard error. Do not invent fields not in the schema.

LAW 3 — CONFIDENCE SCORING
confidence_score: float between 0.0 and 1.0.
Score below 0.80: add specific page numbers to warnings[].
Never leave warnings[] empty if confidence < 0.80.

LAW 4 — FORMULA DUALITY
Every formula must have BOTH latex AND text populated.
latex: valid KaTeX syntax. text: plain English readable version.
Example: latex: "F = ma", text: "Force equals mass times acceleration"
Never leave either field empty.

LAW 5 — ALT TEXT MINIMUM
Every figure must have alt field with MINIMUM 20 words.
Describe the actual content of the diagram, not just its label.
Wrong: "Figure 3.1". Right: "A circuit diagram showing a resistor and capacitor
connected in series with a 9-volt battery and a switch on the left side."

LAW 6 — MCQ STRUCTURE
Every MCQ must have EXACTLY 4 options: a, b, c, d.
correct_answer must be exactly one of: "a", "b", "c", "d".
explanation field must be non-empty — explain WHY the answer is correct.

LAW 7 — NO ARABIC SCRIPT
Never type raw Arabic characters into any field.
Quranic references use token format: [QURAN:SURAH:AYAH:START-END]
Urdu translations are preserved as-is in Urdu script.

LAW 8 — VERBATIM EXTRACTION
Do not paraphrase. Extract text exactly as it appears in the source.
Summarization is only allowed in summary and ai_answer_hub fields.

LAW 9 — BLOCK ORDER
block_order within each topic starts at 1 and increments by 1.
No gaps. No duplicates. Display order 0 = intro, 999 = exercises chapter.

LAW 10 — RAW TEXT COMPLETENESS
raw_text must contain ALL readable text from the topic.
Minimum word count for any topic: 50 words.
Self-check: if raw_text.split(' ').length < 50, you missed content.

LAW 11 — CROSS REFERENCES
Cross-reference slugs use format "ref:slug-here" — never a resolved URL.
Never invent slugs. Only use slugs you have seen in the document.

LAW 12 — SCIENTIFIC NOTATION
Preserve exactly: 3.0 × 10⁸ not "3x10^8".
Superscripts: m², cm³ — Unicode characters, not ^2.
Subscripts: H₂O, CO₂ — Unicode characters, not _2.
Special: μ, ×, ±, °, ÷, Ω, Δ, α, β, γ — Unicode directly.

LAW 13 — SEO FIELD LENGTHS
meta_title: 50-60 characters maximum.
meta_description: 150-160 characters maximum.
focus_keyword must appear in meta_title.

LAW 14 — PRESENTATION PROFILE
presentation_profile.tailwind_classes must always be empty string "".
Never populate this field. It is reserved for the frontend renderer.

LAW 15 — SELF VERIFICATION
Before outputting, run this checklist:
☐ topic count matches actual numbered headings in source
☐ every formula has both latex and text
☐ every figure has 20+ word alt text
☐ every MCQ has exactly 4 options and a correct_answer of a/b/c/d
☐ block_order is sequential from 1 with no gaps
☐ raw_text word count > 50 for every topic
☐ meta_title under 60 chars
☐ meta_description under 160 chars
☐ no raw Arabic script in any field
☐ confidence_score populated
If any check fails: fix it before outputting. Do not output a partial result.
=== END OF LAWS ===
`;
