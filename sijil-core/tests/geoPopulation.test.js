/**
 * GEO Field Population Verification Tests
 * Tests rule-based extraction without requiring database connection
 */

import { populateGeoFields } from '../src/services/ingestion/populateGeoFields.service.js';

console.log('Starting GEO Population Verification...\n');

let passedTests = 0;
const totalTests = 20;

// Mock data for testing
const mockDocumentMeta = {
  title: "PCTB Physics Grade 9",
  subject: "Physics",
  grade_level: "9",
  publisher: "Punjab Curriculum and Textbook Board",
  authors: ["Dr. Ahmed Khan"],
  edition_year: 2024,
  curriculum_standard: "PCTB",
  language: "english",
  country: "Pakistan"
};

const mockTopic = {
  title: "Introduction to Newton's Laws of Motion",
  raw_text: "Newton's laws of motion describe the relationship between a body and the forces acting upon it.",
  seo: { source_page: 45 },
  content_blocks: [
    { 
      type: "key_point", 
      content: "Every object remains at rest unless acted upon by an external force.", 
      source_page: 46,
      display_label: "First Law",
      block_order: 1 
    },
    { 
      type: "fact", 
      content: "Newton published his laws in 1687 in Principia Mathematica.", 
      source_page: 47,
      block_order: 2 
    }
  ],
  geo: {
    llm_summary: "",
    authoritative_source: "",
    citation_format: "",
    entity_name: "",
    entity_type: "",
    trustworthiness_signals: [],
    source_citations: []
  }
};

async function runTests() {
  console.log('--- BASIC POPULATION TESTS ---\n');

  // Test 1: geo.llm_summary is non-empty after populateGeoFields
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.llm_summary && result.geo.llm_summary.length > 0) {
      console.log('✓ TEST 1 PASSED: geo.llm_summary is non-empty');
      passedTests++;
    } else {
      console.log('✗ TEST 1 FAILED: geo.llm_summary is empty');
    }
  } catch (error) {
    console.log('✗ TEST 1 FAILED:', error.message);
  }

  // Test 2: geo.llm_summary contains topic title
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.llm_summary.includes("Newton's Laws")) {
      console.log('✓ TEST 2 PASSED: geo.llm_summary contains topic title');
      passedTests++;
    } else {
      console.log('✗ TEST 2 FAILED: geo.llm_summary does not contain topic title');
    }
  } catch (error) {
    console.log('✗ TEST 2 FAILED:', error.message);
  }

  // Test 3: geo.llm_summary contains publisher or source name
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.llm_summary.includes("PCTB") || result.geo.llm_summary.includes("publisher")) {
      console.log('✓ TEST 3 PASSED: geo.llm_summary contains publisher/source name');
      passedTests++;
    } else {
      console.log('✗ TEST 3 FAILED: geo.llm_summary does not contain publisher/source name');
    }
  } catch (error) {
    console.log('✗ TEST 3 FAILED:', error.message);
  }

  // Test 4: geo.authoritative_source === "PCTB Physics Grade 9 (2024)"
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.authoritative_source === "PCTB Physics Grade 9 (2024)") {
      console.log('✓ TEST 4 PASSED: geo.authoritative_source formatted correctly');
      passedTests++;
    } else {
      console.log('✗ TEST 4 FAILED: geo.authoritative_source incorrect:', result.geo.authoritative_source);
    }
  } catch (error) {
    console.log('✗ TEST 4 FAILED:', error.message);
  }

  // Test 5: geo.citation_format contains "PCTB Physics Grade 9 (2024)"
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.citation_format.includes("PCTB Physics Grade 9 (2024)")) {
      console.log('✓ TEST 5 PASSED: geo.citation_format contains document title');
      passedTests++;
    } else {
      console.log('✗ TEST 5 FAILED: geo.citation_format does not contain document title');
    }
  } catch (error) {
    console.log('✗ TEST 5 FAILED:', error.message);
  }

  // Test 6: geo.citation_format contains "Page 45"
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.citation_format.includes("Page 45")) {
      console.log('✓ TEST 6 PASSED: geo.citation_format contains page number');
      passedTests++;
    } else {
      console.log('✗ TEST 6 FAILED: geo.citation_format does not contain page number');
    }
  } catch (error) {
    console.log('✗ TEST 6 FAILED:', error.message);
  }

  // Test 7: geo.entity_name is non-empty and does NOT contain "Introduction to"
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.entity_name && 
        result.geo.entity_name.length > 0 && 
        !result.geo.entity_name.toLowerCase().includes("introduction to")) {
      console.log('✓ TEST 7 PASSED: geo.entity_name extracted correctly (no prefix)');
      passedTests++;
    } else {
      console.log('✗ TEST 7 FAILED: geo.entity_name incorrect:', result.geo.entity_name);
    }
  } catch (error) {
    console.log('✗ TEST 7 FAILED:', error.message);
  }

  // Test 8: geo.entity_type === "scientific_concept" (contains "law")
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.entity_type === "scientific_concept") {
      console.log('✓ TEST 8 PASSED: geo.entity_type classified as scientific_concept');
      passedTests++;
    } else {
      console.log('✗ TEST 8 FAILED: geo.entity_type incorrect:', result.geo.entity_type);
    }
  } catch (error) {
    console.log('✗ TEST 8 FAILED:', error.message);
  }

  // Test 9: geo.trustworthiness_signals contains "official_curriculum"
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.trustworthiness_signals.includes("official_curriculum")) {
      console.log('✓ TEST 9 PASSED: trustworthiness_signals contains official_curriculum');
      passedTests++;
    } else {
      console.log('✗ TEST 9 FAILED: trustworthiness_signals missing official_curriculum');
    }
  } catch (error) {
    console.log('✗ TEST 9 FAILED:', error.message);
  }

  // Test 10: geo.trustworthiness_signals contains "publisher_attributed"
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.trustworthiness_signals.includes("publisher_attributed")) {
      console.log('✓ TEST 10 PASSED: trustworthiness_signals contains publisher_attributed');
      passedTests++;
    } else {
      console.log('✗ TEST 10 FAILED: trustworthiness_signals missing publisher_attributed');
    }
  } catch (error) {
    console.log('✗ TEST 10 FAILED:', error.message);
  }

  // Test 11: geo.trustworthiness_signals contains "author_attributed"
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.trustworthiness_signals.includes("author_attributed")) {
      console.log('✓ TEST 11 PASSED: trustworthiness_signals contains author_attributed');
      passedTests++;
    } else {
      console.log('✗ TEST 11 FAILED: trustworthiness_signals missing author_attributed');
    }
  } catch (error) {
    console.log('✗ TEST 11 FAILED:', error.message);
  }

  // Test 12: geo.trustworthiness_signals contains "curriculum_aligned"
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.trustworthiness_signals.includes("curriculum_aligned")) {
      console.log('✓ TEST 12 PASSED: trustworthiness_signals contains curriculum_aligned');
      passedTests++;
    } else {
      console.log('✗ TEST 12 FAILED: trustworthiness_signals missing curriculum_aligned');
    }
  } catch (error) {
    console.log('✗ TEST 12 FAILED:', error.message);
  }

  // Test 13: geo.source_citations.length > 0
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.source_citations && result.geo.source_citations.length > 0) {
      console.log('✓ TEST 13 PASSED: source_citations populated');
      passedTests++;
    } else {
      console.log('✗ TEST 13 FAILED: source_citations is empty');
    }
  } catch (error) {
    console.log('✗ TEST 13 FAILED:', error.message);
  }

  // Test 14: geo.source_citations[0].verbatim_quote is non-empty
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.source_citations[0] && result.geo.source_citations[0].verbatim_quote.length > 0) {
      console.log('✓ TEST 14 PASSED: source_citations[0].verbatim_quote is non-empty');
      passedTests++;
    } else {
      console.log('✗ TEST 14 FAILED: source_citations[0].verbatim_quote is empty');
    }
  } catch (error) {
    console.log('✗ TEST 14 FAILED:', error.message);
  }

  // Test 15: geo.source_citations[0].page_number === 46
  try {
    const result = await populateGeoFields(JSON.parse(JSON.stringify(mockTopic)), mockDocumentMeta);
    if (result.geo.source_citations[0] && result.geo.source_citations[0].page_number === 46) {
      console.log('✓ TEST 15 PASSED: source_citations[0].page_number correct');
      passedTests++;
    } else {
      console.log('✗ TEST 15 FAILED: source_citations[0].page_number incorrect');
    }
  } catch (error) {
    console.log('✗ TEST 15 FAILED:', error.message);
  }

  console.log('\n--- IMMUTABILITY TEST ---\n');

  // Test 16: Call populateGeoFields again - existing values must NOT be overwritten
  try {
    const topicCopy = JSON.parse(JSON.stringify(mockTopic));
    const result1 = await populateGeoFields(topicCopy, mockDocumentMeta);
    const originalSummary = result1.geo.llm_summary;
    
    // Modify the summary slightly to test immmutability
    result1.geo.llm_summary = "This should not be overwritten";
    
    const result2 = await populateGeoFields(result1, mockDocumentMeta);
    
    if (result2.geo.llm_summary === "This should not be overwritten") {
      console.log('✓ TEST 16 PASSED: Existing non-empty values not overwritten');
      passedTests++;
    } else {
      console.log('✗ TEST 16 FAILED: Existing value was overwritten');
    }
  } catch (error) {
    console.log('✗ TEST 16 FAILED:', error.message);
  }

  console.log('\n--- ENTITY TYPE CLASSIFICATION TESTS ---\n');

  // Test 17: "Battle of Plassey" with History → historical_event
  try {
    const historyTopic = {
      ...mockTopic,
      title: "Battle of Plassey",
      geo: { ...mockTopic.geo, entity_name: "", entity_type: "" }
    };
    const historyMeta = { ...mockDocumentMeta, subject: "History" };
    const result = await populateGeoFields(historyTopic, historyMeta);
    if (result.geo.entity_type === "historical_event") {
      console.log('✓ TEST 17 PASSED: Battle of Plassey → historical_event');
      passedTests++;
    } else {
      console.log('✗ TEST 17 FAILED: Incorrect classification:', result.geo.entity_type);
    }
  } catch (error) {
    console.log('✗ TEST 17 FAILED:', error.message);
  }

  // Test 18: "Surah Al-Fatiha and Islamic Values" → religious_concept
  try {
    const religiousTopic = {
      ...mockTopic,
      title: "Surah Al-Fatiha and Islamic Values",
      geo: { ...mockTopic.geo, entity_name: "", entity_type: "" }
    };
    const result = await populateGeoFields(religiousTopic, mockDocumentMeta);
    if (result.geo.entity_type === "religious_concept") {
      console.log('✓ TEST 18 PASSED: Surah Al-Fatiha → religious_concept');
      passedTests++;
    } else {
      console.log('✗ TEST 18 FAILED: Incorrect classification:', result.geo.entity_type);
    }
  } catch (error) {
    console.log('✗ TEST 18 FAILED:', error.message);
  }

  // Test 19: "Photosynthesis in Plants" → biological_process
  try {
    const bioTopic = {
      ...mockTopic,
      title: "Photosynthesis in Plants",
      geo: { ...mockTopic.geo, entity_name: "", entity_type: "" }
    };
    const result = await populateGeoFields(bioTopic, mockDocumentMeta);
    if (result.geo.entity_type === "biological_process") {
      console.log('✓ TEST 19 PASSED: Photosynthesis → biological_process');
      passedTests++;
    } else {
      console.log('✗ TEST 19 FAILED: Incorrect classification:', result.geo.entity_type);
    }
  } catch (error) {
    console.log('✗ TEST 19 FAILED:', error.message);
  }

  // Test 20: "Random Topic XYZ" → general
  try {
    const randomTopic = {
      ...mockTopic,
      title: "Random Topic XYZ",
      geo: { ...mockTopic.geo, entity_name: "", entity_type: "" }
    };
    const result = await populateGeoFields(randomTopic, mockDocumentMeta);
    if (result.geo.entity_type === "general") {
      console.log('✓ TEST 20 PASSED: Random topic → general');
      passedTests++;
    } else {
      console.log('✗ TEST 20 FAILED: Incorrect classification:', result.geo.entity_type);
    }
  } catch (error) {
    console.log('✗ TEST 20 FAILED:', error.message);
  }

  console.log('\n=== GEO POPULATION VERIFICATION COMPLETE ===');
  console.log(`Passed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('Overall status: EXCELLENT - All core tests passed!');
  } else if (passedTests >= 15) {
    console.log('Overall status: GOOD - Most tests passed');
  } else {
    console.log('Overall status: NEEDS ATTENTION - Too many failures');
  }
}

runTests().catch(console.error);
