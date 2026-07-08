/**
 * Populates GEO fields on a topic object during ingestion.
 * Uses rule-based extraction only - no AI API calls.
 * Never throws errors - all failures logged and ignored.
 * Never overwrites existing non-empty values.
 */

/**
 * Extract primary entity name from topic title
 * Removes common prefixes like "Introduction to", "Chapter", etc.
 */
function extractEntityName(title) {
  if (!title || typeof title !== 'string') return "";
  
  let cleaned = title.trim();
  
  // Remove common prefixes
  const prefixesToRemove = [
    /^introduction to\s+/i,
    /^chapter\s+\d+:\s*/i,
    /^chapter\s+/i,
    /^part\s+\d+:\s*/i,
    /^part\s+/i,
    /^section\s+\d+:\s*/i,
    /^section\s+/i,
    /^overview of\s+/i,
    /^understanding\s+/i,
    /^basics of\s+/i,
    /^fundamentals of\s+/i
  ];
  
  for (const prefix of prefixesToRemove) {
    cleaned = cleaned.replace(prefix, "");
  }
  
  // Take first noun phrase before "and" if present
  const andIndex = cleaned.indexOf(" and ");
  if (andIndex > 0) {
    cleaned = cleaned.substring(0, andIndex).trim();
  }
  
  // Remove trailing punctuation
  cleaned = cleaned.replace(/[.,;:!?]$/, "").trim();
  
  return cleaned || title;
}

/**
 * Classify entity type based on keywords in entity name and subject
 */
function classifyEntityType(entityName, subject = "") {
  if (!entityName) return "general";
  
  const lowerName = entityName.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  
  // Scientific concepts
  const scientificKeywords = [
    "law", "theory", "force", "energy", "wave", "current", "circuit",
    "atom", "molecule", "reaction", "field", "particle", "momentum",
    "velocity", "acceleration", "gravity", "electric", "magnetic",
    "thermodynamic", "quantum", "relativity"
  ];
  
  // Historical events
  const historicalKeywords = [
    "war", "battle", "independence", "revolution", "treaty",
    "empire", "dynasty", "colonization", "movement"
  ];
  
  // Religious concepts
  const religiousKeywords = [
    "allah", "islam", "quran", "prayer", "faith", "prophet",
    "mosque", "ramadan", "zakat", "hajj", "surah", "ayah"
  ];
  
  // Mathematical concepts
  const mathKeywords = [
    "theorem", "proof", "equation", "algebra", "geometry",
    "calculus", "trigonometry", "matrix", "derivative", "integral"
  ];
  
  // Biological processes
  const bioKeywords = [
    "photosynthesis", "respiration", "digestion", "cell", "organ",
    "enzyme", "metabolism", "reproduction", "evolution", "species"
  ];
  
  // Check for person (proper name in history subject)
  const isProperName = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(entityName);
  if (isProperName && lowerSubject.includes("history")) {
    return "person";
  }
  
  // Check keyword matches
  for (const keyword of scientificKeywords) {
    if (lowerName.includes(keyword)) return "scientific_concept";
  }
  
  for (const keyword of historicalKeywords) {
    if (lowerName.includes(keyword)) return "historical_event";
  }
  
  for (const keyword of religiousKeywords) {
    if (lowerName.includes(keyword)) return "religious_concept";
  }
  
  for (const keyword of mathKeywords) {
    if (lowerName.includes(keyword)) return "mathematical_concept";
  }
  
  for (const keyword of bioKeywords) {
    if (lowerName.includes(keyword)) return "biological_process";
  }
  
  return "general";
}

/**
 * Build trustworthiness signals from document metadata
 */
function buildTrustworthinessSignals(docMeta) {
  const signals = [];
  
  if (!docMeta) return signals;
  
  if (docMeta.publisher) {
    signals.push("publisher_attributed");
    
    // Check for official curriculum
    const publisherLower = docMeta.publisher.toLowerCase();
    const country = docMeta.country?.toLowerCase() || "";
    if (country === "pakistan" || 
        publisherLower.includes("pctb") || 
        publisherLower.includes("punjab") || 
        publisherLower.includes("federal")) {
      signals.push("official_curriculum");
    }
  }
  
  if (docMeta.curriculum_standard) {
    signals.push("curriculum_aligned");
  }
  
  if (docMeta.authors && docMeta.authors.length > 0) {
    signals.push("author_attributed");
  }
  
  if (docMeta.edition_year) {
    signals.push("dated_source");
  }
  
  return signals;
}

/**
 * Extract source citations from content blocks
 */
function extractSourceCitations(contentBlocks, existingCitations = []) {
  const citations = [...existingCitations];

  if (!Array.isArray(contentBlocks)) return citations;

  const getBlockText = (block) => {
    if (!block) return '';
    return block.text || block.content || block.definition_text || '';
  };

  const candidateBlocks = contentBlocks.filter(block => {
    const text = getBlockText(block);
    if (!text || text.length < 20 || text.length > 300) return false;
    return ['callout', 'definition', 'paragraph', 'example'].includes(block.type);
  });

  for (let i = 0; i < Math.min(candidateBlocks.length, 3); i++) {
    const block = candidateBlocks[i];
    const text = getBlockText(block);
    const citation = {
      verbatim_quote: text.substring(0, 200),
      page_number: block.source_page || null,
      context: block.title || block.variant || block.type || ''
    };

    const isDuplicate = citations.some(c =>
      c.verbatim_quote === citation.verbatim_quote &&
      c.page_number === citation.page_number
    );

    if (!isDuplicate) {
      citations.push(citation);
    }
  }

  return citations;
}

/**
 * Main function: populate GEO fields on a topic
 * @param {Object} topic - Validated topic object (post-Zod, pre-persist)
 * @param {Object} documentMeta - Document-level metadata
 * @returns {Object} Topic with GEO fields populated (never throws)
 */
export async function populateGeoFields(topic, documentMeta) {
  try {
    if (!topic || !topic.geo) {
      return topic;
    }
    
    const geo = topic.geo;
    
    // FIELD 1: geo.llm_summary
    if (!geo.llm_summary || geo.llm_summary.trim() === "") {
      const title = topic.title || "This topic";
      const subject = documentMeta?.subject || "the curriculum";
      const grade = documentMeta?.grade_level || "the specified grade";
      const rawText = topic.raw_text || "";
      const snippet = rawText.substring(0, 100);
      const publisher = documentMeta?.publisher || "the publisher";
      const year = documentMeta?.edition_year || "recent edition";
      
      geo.llm_summary = `${title} is a topic in ${subject} for Grade ${grade}. ${snippet} Source: ${documentMeta?.title || "Curriculum Material"} published by ${publisher} (${year}).`;
    }
    
    // FIELD 2: geo.authoritative_source
    if (!geo.authoritative_source || geo.authoritative_source.trim() === "") {
      const docTitle = documentMeta?.title || "Curriculum Document";
      const year = documentMeta?.edition_year || "n.d.";
      geo.authoritative_source = `${docTitle} (${year})`;
    }
    
    // FIELD 3: geo.citation_format
    if (!geo.citation_format || geo.citation_format.trim() === "") {
      const docTitle = documentMeta?.title || "Curriculum Document";
      const year = documentMeta?.edition_year || "n.d.";
      const chapter = documentMeta?.chapter_title || "";
      const page = topic.seo?.source_page || topic.source_page_start || "";
      
      let citation = `${docTitle} (${year})`;
      if (chapter) citation += `, ${chapter}`;
      if (page) citation += `, Page ${page}`;
      
      geo.citation_format = citation;
    }
    
    // FIELD 4: geo.entity_name
    if (!geo.entity_name || geo.entity_name.trim() === "") {
      geo.entity_name = extractEntityName(topic.title);
    }
    
    // FIELD 5: geo.entity_type
    if (!geo.entity_type || geo.entity_type.trim() === "") {
      geo.entity_type = classifyEntityType(geo.entity_name, documentMeta?.subject);
    }
    
    // FIELD 6: geo.trustworthiness_signals
    if (!geo.trustworthiness_signals || geo.trustworthiness_signals.length === 0) {
      geo.trustworthiness_signals = buildTrustworthinessSignals(documentMeta);
    } else {
      // Merge with existing (avoid duplicates)
      const newSignals = buildTrustworthinessSignals(documentMeta);
      for (const signal of newSignals) {
        if (!geo.trustworthiness_signals.includes(signal)) {
          geo.trustworthiness_signals.push(signal);
        }
      }
    }
    
    // FIELD 7: geo.source_citations
    geo.source_citations = extractSourceCitations(
      topic.content_blocks, 
      geo.source_citations || []
    );
    
    return topic;
  } catch (error) {
    console.error('[ERROR] Failed to populate GEO fields:', error.message);
    // Return topic unchanged - never crash ingestion
    return topic;
  }
}

export default { populateGeoFields };
