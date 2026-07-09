#!/usr/bin/env python3
"""
SIJIL JSON Validation Script
Validates extracted chapter JSONs before pushing to GitHub.
Checks for duplicate content, junk topics, block type diversity, and schema compliance.

Usage: python validate_chapter_json.py path/to/chapter.json
"""

import json
import sys
import hashlib
import re
from collections import Counter
from typing import Dict, List, Any, Tuple

# Configuration
VALID_SECTION_NUMBER_PATTERN = r'^\d+\.\d+$'
MIN_BLOCK_TYPES_REQUIRED = 3  # At least paragraph + 2 other types if visual elements exist
PARAGRAPH_ONLY_THRESHOLD = 0.95  # If >95% blocks are paragraphs, fail
DUPLICATE_CONTENT_THRESHOLD = 0.90  # 90% similarity = duplicate


def load_json(filepath: str) -> Dict[str, Any]:
    """Load and parse JSON file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Failed to load JSON: {e}")
        sys.exit(1)


def hash_text(text: str) -> str:
    """Create SHA256 hash of text."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def extract_topic_content(topic: Dict) -> str:
    """Extract all text content from a topic's content_blocks."""
    blocks = topic.get('content_blocks', [])
    texts = []
    for block in blocks:
        if block.get('type') == 'paragraph':
            texts.append(block.get('text', ''))
        elif block.get('type') in ['heading', 'callout', 'example']:
            texts.append(block.get('text', ''))
    return ' '.join(texts)


def check_duplicate_topics(topics: List[Dict]) -> Tuple[bool, List[str]]:
    """Check for duplicate content across topics."""
    errors = []
    content_hashes = {}
    
    for i, topic in enumerate(topics):
        content = extract_topic_content(topic)
        if not content.strip():
            continue
            
        content_hash = hash_text(content)
        title = topic.get('title', f'Topic {i}')
        section_num = topic.get('section_number', 'unknown')
        
        if content_hash in content_hashes:
            prev_title, prev_section = content_hashes[content_hash]
            errors.append(
                f"❌ DUPLICATE CONTENT: Topic '{title}' (section {section_num}) has identical content to '{prev_title}' (section {prev_section})"
            )
        else:
            content_hashes[content_hash] = (title, section_num)
    
    return len(errors) == 0, errors


def check_section_numbers(topics: List[Dict]) -> Tuple[bool, List[str]]:
    """Validate section_number format for all topics."""
    errors = []
    valid_pattern = re.compile(VALID_SECTION_NUMBER_PATTERN)
    
    for i, topic in enumerate(topics):
        section_num = topic.get('section_number', '')
        title = topic.get('title', f'Topic {i}')
        topic_type = topic.get('topic_type', '')
        
        # Skip intro and exercise topics
        if topic_type in ['intro', 'exercise']:
            continue
        
        # Check if section_number matches pattern
        if not valid_pattern.match(section_num):
            errors.append(
                f"❌ INVALID SECTION NUMBER: Topic '{title}' has section_number='{section_num}' (expected format: 1.1, 1.2, etc.)"
            )
    
    return len(errors) == 0, errors


def check_block_type_diversity(topics: List[Dict]) -> Tuple[bool, List[str]]:
    """Check if chapter has diverse block types (not just paragraphs)."""
    errors = []
    
    # Count all block types across all topics
    all_block_types = Counter()
    total_blocks = 0
    
    for topic in topics:
        blocks = topic.get('content_blocks', [])
        for block in blocks:
            block_type = block.get('type', 'unknown')
            all_block_types[block_type] += 1
            total_blocks += 1
    
    if total_blocks == 0:
        errors.append("❌ NO BLOCKS: Chapter has zero content blocks")
        return False, errors
    
    # Check paragraph ratio
    paragraph_count = all_block_types.get('paragraph', 0)
    paragraph_ratio = paragraph_count / total_blocks if total_blocks > 0 else 0
    
    # Check for visual element mentions in text (indicates missing typed blocks)
    has_visual_mentions = False
    for topic in topics:
        for block in topic.get('content_blocks', []):
            text = block.get('text', '').upper()
            if 'FIGURE' in text or 'TABLE' in text or 'FORMULA' in text:
                has_visual_mentions = True
                break
    
    # Report issues
    if paragraph_ratio > PARAGRAPH_ONLY_THRESHOLD:
        errors.append(
            f"⚠️  LOW BLOCK DIVERSITY: {paragraph_ratio:.1%} of blocks are paragraphs ({paragraph_count}/{total_blocks}). "
            f"Block types found: {dict(all_block_types)}"
        )
        
        if has_visual_mentions:
            errors.append(
                "❌ CRITICAL: Text mentions FIGURE/TABLE/FORMULA but no corresponding typed blocks found. "
                "These should be type: 'figure', 'table', or 'formula' blocks, NOT paragraphs."
            )
    
    # Check minimum diversity
    unique_types = len(all_block_types)
    if unique_types < 2 and total_blocks > 10:
        errors.append(
            f"⚠️  LOW DIVERSITY: Only {unique_types} unique block type(s) found: {dict(all_block_types)}"
        )
    
    return len([e for e in errors if e.startswith('❌ CRITICAL')]) == 0, errors


def check_junk_topics(topics: List[Dict]) -> Tuple[bool, List[str]]:
    """Detect junk topics created from table cells, units, or fragments."""
    errors = []
    junk_patterns = [
        r'^TABLE\s*\d',  # "TABLE 1.1"
        r'^\d+\.\d{3,}$',  # "8.844"
        r'^[A-Z]$',  # Single letter like "L"
        r'^\d+\.?\d*\s*(°|F|C|K|mL|L|g|kg)$',  # "354.07", "177.66 °F"
        r'^[a-z]{1,2}$',  # Very short single words
    ]
    
    for i, topic in enumerate(topics):
        title = topic.get('title', '').strip()
        section_num = topic.get('section_number', '')
        topic_type = topic.get('topic_type', '')
        
        # Skip valid topic types
        if topic_type in ['intro', 'exercise']:
            continue
        
        # Check title for junk patterns
        for pattern in junk_patterns:
            if re.search(pattern, title, re.IGNORECASE):
                errors.append(
                    f"❌ JUNK TOPIC DETECTED: Topic title '{title}' (section {section_num}) appears to be a fragment, table cell, or unit value."
                )
                break
    
    return len(errors) == 0, errors


def check_schema_version(data: Dict) -> bool:
    """Verify schema version is 2.0.0."""
    version = data.get('schema_version', '')
    if version != '2.0.0':
        print(f"❌ SCHEMA VERSION: Expected '2.0.0', got '{version}'")
        return False
    return True


def check_topics_exist(data: Dict) -> bool:
    """Verify topics array exists and has content."""
    topics = data.get('topics', [])
    if not topics:
        print("❌ TOPICS: No topics found in chapter")
        return False
    if len(topics) < 1:
        print("❌ TOPICS: At least 1 topic required")
        return False
    return True


def check_topic_completeness(topics: List[Dict]) -> Tuple[bool, List[str]]:
    """Check each topic has required fields."""
    errors = []
    
    required_fields = ['title', 'slug', 'section_number', 'content_blocks']
    min_faq = 3
    min_flashcards = 3
    min_ai_answers = 2
    
    for i, topic in enumerate(topics):
        topic_id = topic.get('title', f'Topic {i}')
        
        # Check required fields
        for field in required_fields:
            if field not in topic or not topic[field]:
                errors.append(f"❌ MISSING FIELD: Topic '{topic_id}' missing required field '{field}'")
        
        # Check content_blocks
        blocks = topic.get('content_blocks', [])
        if not blocks:
            errors.append(f"❌ NO CONTENT: Topic '{topic_id}' has zero content_blocks")
        
        # Check FAQ minimum
        faq = topic.get('faq', [])
        if len(faq) < min_faq and topic.get('topic_type') == 'content':
            errors.append(
                f"⚠️  INSUFFICIENT FAQ: Topic '{topic_id}' has {len(faq)} FAQ items (minimum {min_faq})"
            )
        
        # Check flashcards minimum
        flashcards = topic.get('flashcards', [])
        if len(flashcards) < min_flashcards and topic.get('topic_type') == 'content':
            errors.append(
                f"⚠️  INSUFFICIENT FLASHCARDS: Topic '{topic_id}' has {len(flashcards)} flashcards (minimum {min_flashcards})"
            )
        
        # Check AI answer hub minimum
        ai_answers = topic.get('ai_answer_hub', [])
        if len(ai_answers) < min_ai_answers and topic.get('topic_type') == 'content':
            errors.append(
                f"⚠️  INSUFFICIENT AI ANSWERS: Topic '{topic_id}' has {len(ai_answers)} entries (minimum {min_ai_answers})"
            )
    
    return len(errors) == 0, errors


def validate_json(filepath: str) -> bool:
    """Run all validations on a chapter JSON file."""
    print(f"\n{'='*70}")
    print(f"SIJIL JSON VALIDATION: {filepath}")
    print(f"{'='*70}\n")
    
    # Load JSON
    data = load_json(filepath)
    
    all_passed = True
    all_errors = []
    
    # Schema checks
    print("📋 Schema Validation...")
    if not check_schema_version(data):
        all_passed = False
    if not check_topics_exist(data):
        all_passed = False
    
    topics = data.get('topics', [])
    
    # Topic-level checks
    print("🔍 Topic Structure Checks...")
    passed, errors = check_topic_completeness(topics)
    all_errors.extend(errors)
    if not passed:
        all_passed = False
    
    # Duplicate content check
    print("🔄 Duplicate Content Check...")
    passed, errors = check_duplicate_topics(topics)
    all_errors.extend(errors)
    if not passed:
        all_passed = False
    
    # Section number validation
    print("🔢 Section Number Validation...")
    passed, errors = check_section_numbers(topics)
    all_errors.extend(errors)
    if not passed:
        all_passed = False
    
    # Block type diversity
    print("🎨 Block Type Diversity Check...")
    passed, errors = check_block_type_diversity(topics)
    all_errors.extend(errors)
    if not passed:
        all_passed = False
    
    # Junk topic detection
    print("🗑️  Junk Topic Detection...")
    passed, errors = check_junk_topics(topics)
    all_errors.extend(errors)
    if not passed:
        all_passed = False
    
    # Summary
    print(f"\n{'='*70}")
    if all_errors:
        print("VALIDATION FAILED ❌\n")
        for error in all_errors:
            print(f"  {error}")
        print(f"\nTotal issues: {len(all_errors)}")
        print(f"{'='*70}\n")
        return False
    else:
        print("VALIDATION PASSED ✅")
        print(f"  - Schema version: {data.get('schema_version')}")
        print(f"  - Topics: {len(topics)}")
        print(f"  - No duplicate content detected")
        print(f"  - All section numbers valid")
        print(f"  - Block type diversity acceptable")
        print(f"  - No junk topics detected")
        print(f"{'='*70}\n")
        return True


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python validate_chapter_json.py <path_to_json>")
        print("Example: python validate_chapter_json.py data/ingested/openstax-chemistry-2e-ch1.json")
        sys.exit(1)
    
    filepath = sys.argv[1]
    success = validate_json(filepath)
    sys.exit(0 if success else 1)
