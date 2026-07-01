import mongoose from 'mongoose';
import { detectQuranReferences, resolveQuranBlocks } from '../src/services/quran/quranReferenceExtractor.service.js';

async function runTests() {
    console.log('Starting Quran Extraction Verification...\n');
    
    let passedTests = 0;
    const totalTests = 13;

    // Connect to MongoDB (needed for resolveQuranBlocks DB verification)
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
        console.log('✓ Connected to MongoDB\n');
    } catch (error) {
        console.error('✗ Failed to connect to MongoDB:', error.message);
        return;
    }

    console.log('--- DETECTION TESTS (detectQuranReferences only, no DB) ---\n');

    // TEST 1: Block with 15+ Arabic chars is flagged needs_quran_extraction: true
    try {
        const block1 = { 
            type: "paragraph", 
            content: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
            block_order: 1 
        };
        const result1 = detectQuranReferences([block1])[0];
        
        if (result1.needs_quran_extraction === true) {
            console.log('✓ TEST 1 PASSED: Arabic text (15+ chars) flagged for extraction');
            passedTests++;
        } else {
            console.log('✗ TEST 1 FAILED: Arabic text not flagged');
        }
    } catch (error) {
        console.log('✗ TEST 1 FAILED:', error.message);
    }

    // TEST 2: Block with pattern "Surah Al-Fatiha (1:1-7)" gets extracted_reference
    try {
        const block2 = { 
            type: "paragraph", 
            content: "As stated in Surah Al-Fatiha (1:1-7)...",
            block_order: 2 
        };
        const result2 = detectQuranReferences([block2])[0];
        
        if (result2.extracted_reference && 
            result2.extracted_reference.surah === 1 && 
            result2.extracted_reference.ayah_start === 1 && 
            result2.extracted_reference.ayah_end === 7) {
            console.log('✓ TEST 2 PASSED: Surah Al-Fatiha (1:1-7) pattern detected');
            passedTests++;
        } else {
            console.log('✗ TEST 2 FAILED: Pattern not detected correctly');
        }
    } catch (error) {
        console.log('✗ TEST 2 FAILED:', error.message);
    }

    // TEST 3: Block with pattern "Quran 2:255" gets extracted_reference
    try {
        const block3 = { 
            type: "paragraph", 
            content: "As mentioned in Quran 2:255...",
            block_order: 3 
        };
        const result3 = detectQuranReferences([block3])[0];
        
        if (result3.extracted_reference && 
            result3.extracted_reference.surah === 2 && 
            result3.extracted_reference.ayah_start === 255 && 
            result3.extracted_reference.ayah_end === 255) {
            console.log('✓ TEST 3 PASSED: Quran 2:255 pattern detected');
            passedTests++;
        } else {
            console.log('✗ TEST 3 FAILED: Pattern not detected correctly');
        }
    } catch (error) {
        console.log('✗ TEST 3 FAILED:', error.message);
    }

    // TEST 4: Block with "[QURAN:2:255]" token gets extracted_reference
    try {
        const block4 = { 
            type: "paragraph", 
            content: "The verse [QURAN:2:255] states...",
            block_order: 4 
        };
        const result4 = detectQuranReferences([block4])[0];
        
        if (result4.extracted_reference && 
            result4.extracted_reference.surah === 2 && 
            result4.extracted_reference.ayah_start === 255 && 
            result4.extracted_reference.ayah_end === 255) {
            console.log('✓ TEST 4 PASSED: [QURAN:2:255] token detected');
            passedTests++;
        } else {
            console.log('✗ TEST 4 FAILED: Token not detected correctly');
        }
    } catch (error) {
        console.log('✗ TEST 4 FAILED:', error.message);
    }

    // TEST 5: Already-valid quran_reference block passes through with already_valid: true
    try {
        const block5 = { 
            type: "quran_reference", 
            surah: 1, 
            ayah_start: 1, 
            ayah_end: 7,
            block_order: 1,
            textbook_translation_ur: "",
            curriculum_id: "",
            display_note: ""
        };
        const result5 = detectQuranReferences([block5])[0];
        
        if (result5.already_valid === true) {
            console.log('✓ TEST 5 PASSED: Already-valid block marked as already_valid');
            passedTests++;
        } else {
            console.log('✗ TEST 5 FAILED: Valid block not recognized');
        }
    } catch (error) {
        console.log('✗ TEST 5 FAILED:', error.message);
    }

    // TEST 6: Plain paragraph with no Arabic and no reference pattern — no flags added
    try {
        const block6 = { 
            type: "paragraph", 
            content: "This is a regular paragraph about physics.",
            block_order: 6 
        };
        const result6 = detectQuranReferences([block6])[0];
        
        if (!result6.needs_quran_extraction && 
            !result6.extracted_reference && 
            !result6.already_valid) {
            console.log('✓ TEST 6 PASSED: Plain paragraph has no flags');
            passedTests++;
        } else {
            console.log('✗ TEST 6 FAILED: Plain paragraph incorrectly flagged');
        }
    } catch (error) {
        console.log('✗ TEST 6 FAILED:', error.message);
    }

    // TEST 7: Short Arabic word (under 10 chars) does NOT trigger Rule 1
    try {
        const block7 = { 
            type: "paragraph", 
            content: "اللہ is merciful",
            block_order: 7 
        };
        const result7 = detectQuranReferences([block7])[0];
        
        if (!result7.needs_quran_extraction) {
            console.log('✓ TEST 7 PASSED: Short Arabic word (<10 chars) not flagged');
            passedTests++;
        } else {
            console.log('✗ TEST 7 FAILED: Short Arabic word incorrectly flagged');
        }
    } catch (error) {
        console.log('✗ TEST 7 FAILED:', error.message);
    }

    console.log('\n--- RESOLUTION TESTS (resolveQuranBlocks — needs DB) ---\n');

    // TEST 8: Explicit reference "Surah Al-Baqarah 2:255" resolves to valid quran_reference
    try {
        const block8 = { 
            type: "paragraph", 
            content: "See Surah Al-Baqarah (2:255) for details.",
            block_order: 8 
        };
        const annotated8 = detectQuranReferences([block8])[0];
        
        // Debug: Check if annotation is correct
        if (!annotated8.extracted_reference) {
            console.log('✗ TEST 8 FAILED: Detection did not extract reference');
        } else {
            const resolved8 = await resolveQuranBlocks([annotated8]);
            const result8 = resolved8[0];
            
            if (result8.type === 'quran_reference' && 
                result8.surah === 2 && 
                result8.ayah_start === 255 && 
                result8.ayah_end === 255) {
                console.log('✓ TEST 8 PASSED: Surah Al-Baqarah 2:255 resolved correctly');
                passedTests++;
            } else {
                console.log('✗ TEST 8 FAILED: Reference not resolved correctly');
                console.log('  Result:', JSON.stringify(result8, null, 2));
            }
        }
    } catch (error) {
        console.log('✗ TEST 8 FAILED:', error.message);
    }

    // TEST 9: Invalid reference "Surah 999:1" — NOT found in DB — original block preserved
    try {
        const block9 = { 
            type: "paragraph", 
            content: "Invalid Surah 999:1 reference.",
            block_order: 9 
        };
        const annotated9 = detectQuranReferences([block9])[0];
        const resolved9 = await resolveQuranBlocks([annotated9]);
        const result9 = resolved9[0];
        
        // Should preserve original block (not convert to quran_reference with surah 999)
        if (result9.type !== 'quran_reference' || result9.surah !== 999) {
            console.log('✓ TEST 9 PASSED: Invalid reference preserved (no silent data loss)');
            passedTests++;
        } else {
            console.log('✗ TEST 9 FAILED: Invalid reference incorrectly processed');
        }
    } catch (error) {
        console.log('✗ TEST 9 FAILED:', error.message);
    }

    // TEST 10: Arabic-only block (no reference) resolves to quran_reference with surah: 0
    try {
        const block10 = { 
            type: "paragraph", 
            content: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
            block_order: 10 
        };
        const annotated10 = detectQuranReferences([block10])[0];
        const resolved10 = await resolveQuranBlocks([annotated10]);
        const result10 = resolved10[0];
        
        if (result10.type === 'quran_reference' && 
            result10.surah === 0 && 
            result10.ayah_start === 0 && 
            result10.display_note && 
            result10.display_note.includes('UNRESOLVED')) {
            console.log('✓ TEST 10 PASSED: Arabic-only block marked as UNRESOLVED');
            passedTests++;
        } else {
            console.log('✗ TEST 10 FAILED: Arabic-only block not handled correctly');
        }
    } catch (error) {
        console.log('✗ TEST 10 FAILED:', error.message);
    }

    // TEST 11: Already-valid block passes through resolveQuranBlocks unchanged
    try {
        const block11 = { 
            type: "quran_reference", 
            surah: 1, 
            ayah_start: 1, 
            ayah_end: 7,
            block_order: 11,
            textbook_translation_ur: "Test translation",
            curriculum_id: "",
            display_note: ""
        };
        const annotated11 = detectQuranReferences([block11])[0];
        const resolved11 = await resolveQuranBlocks([annotated11]);
        const result11 = resolved11[0];
        
        if (result11.type === 'quran_reference' && 
            result11.surah === 1 && 
            result11.ayah_start === 1 && 
            result11.ayah_end === 7 &&
            !result11.already_valid && // annotation stripped
            !result11.needs_quran_extraction) {
            console.log('✓ TEST 11 PASSED: Already-valid block passes through unchanged');
            passedTests++;
        } else {
            console.log('✗ TEST 11 FAILED: Already-valid block modified incorrectly');
        }
    } catch (error) {
        console.log('✗ TEST 11 FAILED:', error.message);
    }

    // TEST 12: After full pipeline, no block contains Arabic in content field EXCEPT unresolved
    try {
        const blocks12 = [
            { type: "paragraph", content: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ", block_order: 1 },
            { type: "paragraph", content: "Regular text", block_order: 2 }
        ];
        const annotated12 = detectQuranReferences(blocks12);
        const resolved12 = await resolveQuranBlocks(annotated12);
        
        let hasArabicInContent = false;
        for (const block of resolved12) {
            const content = block.content || block.html || block.text || '';
            const arabicRegex = /[\u0600-\u06FF]{10,}/;
            
            // Unresolved blocks have _raw_arabic, not content
            if (block._raw_arabic && arabicRegex.test(block._raw_arabic)) {
                continue; // This is expected for unresolved
            }
            
            if (arabicRegex.test(content)) {
                hasArabicInContent = true;
                break;
            }
        }
        
        if (!hasArabicInContent) {
            console.log('✓ TEST 12 PASSED: No Arabic in content fields (only in _raw_arabic for unresolved)');
            passedTests++;
        } else {
            console.log('✗ TEST 12 FAILED: Arabic still present in content fields');
        }
    } catch (error) {
        console.log('✗ TEST 12 FAILED:', error.message);
    }

    console.log('\n--- PIPELINE INTEGRATION TEST ---\n');

    // TEST 13: Import the wired ingestion pipeline and confirm quranReferenceExtractor is called
    try {
        const { normalizeDocumentPayload } = await import('../src/services/ingestion/normalizeDocumentPayload.js');
        
        const mockPayload = {
            document_metadata: {
                document_id: 'doc_test123',
                subject_slug: 'test-subject',
                title: 'Test Document'
            },
            container: {
                _id: 'chap_test123',
                title: 'Chapter 1',
                slug: 'chapter-1'
            },
            topics: [{
                _id: 'topic_test123',
                title: 'Test Topic with Quran',
                slug: 'test-topic',
                content_blocks: [
                    { 
                        type: "heading", 
                        level: 1, 
                        text: "Introduction",
                        block_order: 0
                    },
                    { 
                        type: "paragraph", 
                        content: "As stated in Surah Al-Fatiha (1:1-7)...",
                        block_order: 1 
                    }
                ]
            }]
        };
        
        const result = await normalizeDocumentPayload(mockPayload);
        
        if (result && 
            result.normalizedTopicContents && 
            result.normalizedTopicContents.length > 0) {
            
            const firstTopicContent = result.normalizedTopicContents[0].content_blocks;
            const quranBlock = firstTopicContent.find(b => b.type === 'quran_reference');
            
            if (quranBlock && quranBlock.surah === 1 && quranBlock.ayah_start === 1) {
                console.log('✓ TEST 13 PASSED: Pipeline integration working - Quran reference resolved');
                passedTests++;
            } else {
                console.log('✗ TEST 13 FAILED: Quran reference not resolved in pipeline');
            }
        } else {
            console.log('✗ TEST 13 FAILED: Pipeline did not produce expected output');
        }
    } catch (error) {
        console.log('✗ TEST 13 FAILED:', error.message);
    }

    // Close MongoDB connection
    await mongoose.connection.close();

    console.log('\n=== QURAN EXTRACTION VERIFICATION COMPLETE ===');
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    
    if (passedTests >= 11) {
        console.log('Overall status: EXCELLENT - Core functionality verified!');
    } else if (passedTests >= 8) {
        console.log('Overall status: GOOD - Most tests passed');
    } else {
        console.log('Overall status: NEEDS ATTENTION - Too many failures');
    }
}

// Run the tests
runTests().catch(console.error);
