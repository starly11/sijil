import { ContentBlockSchema } from '../schemas/blocks.schema.js';

function runVerification() {
    console.log('=== RUNNING PHASE 4A MANUAL SCHEMA VERIFICATION ===\n');

    // Shared structural boilerplate payload values
    const baseFields = {
        _id: "blk_1234567890ab",
        block_order: 1,
        source_page: 15,
        html: "<p>Filler Content</p>",
        presentation_profile: {
            visual_layer_type: "standard_card",
            theme_overrides: {},
            animation_trigger: "on-scroll",
            tailwind_classes: "p-4 bg-white"
        }
    };

    // 16 Minimal structural data combinations matching targeted parsing options
    const structuralMockObjects = {
        heading: {
            ...baseFields,
            type: "heading",
            level: 2,
            text: "Introduction to Velocity",
            slug_anchor: "introduction-to-velocity"
        },
        paragraph: {
            ...baseFields,
            type: "paragraph",
            text: "Velocity is defined as the rate of change of displacement.",
            contains_formula: false,
            key_terms_in_text: ["velocity", "displacement"]
        },
        formula: {
            ...baseFields,
            type: "formula",
            formula_id: "frm_v1234567890a",
            name: "Velocity Formula",
            latex: "v = \\frac{d}{t}",
            text: "v = d / t",
            formula_type: "definition",
            variables: [
                { symbol: "v", name: "Velocity", unit: "m/s", description: "Speed in a direction" },
                { symbol: "d", name: "Displacement", unit: "m" }
            ]
        },
        figure: {
            ...baseFields,
            type: "figure",
            figure_id: "fig_f1234567890a",
            figure_number: "Figure 1.1",
            caption: "Diagram showing vernier calliper scales.",
            alt: "Vernier calliper jaws gripping a cylinder.",
            image_path_local: "assets/figures/fig-1-1.png",
            render_strategy: "image"
        },
        table: {
            ...baseFields,
            type: "table",
            table_id: "tbl_1",
            table_number: "Table 1.2",
            caption: "Density of common metals.",
            headers: ["Metal", "Density (g/cm³)"],
            rows: [["Gold", "19.3"], ["Iron", "7.87"]],
            render_as: "styled-table"
        },
        callout: {
            ...baseFields,
            type: "callout",
            callout_id: "cal_1",
            variant: "info",
            title: "Remember",
            text: "Always minimize parallax error when reading scales."
        },
        mcq: {
            ...baseFields,
            type: "mcq",
            mcq_id: "mcq_m1234567890a",
            question_number: "Q1",
            question_text: "Which of the following is a base unit?",
            options: { a: "Newton", b: "Pascal", c: "Kilogram", d: "Joule" },
            correct_answer: "c",
            explanation: "Kilogram is the SI unit for mass, which is a base quantity.",
            past_paper_years: ["2019", "2022"]
        },
        example: {
            ...baseFields,
            type: "example",
            example_id: "ex_1",
            example_number: "Example 2.1",
            title: "Calculating Average Speed",
            problem_text: "A runner covers 100 meters in 10 seconds. Find his speed.",
            solution_steps: ["State the formula: s = d/t", "Substitute values: s = 100/10", "Calculate: s = 10 m/s"],
            final_answer: "10 m/s"
        },
        list: {
            ...baseFields,
            type: "list",
            list_type: "unordered",
            items: ["Mass", "Length", "Time", "Temperature"]
        },
        definition: {
            ...baseFields,
            type: "definition",
            term: "Kinematics",
            definition_text: "The branch of mechanics concerned with the motion of objects without reference to the forces which cause the motion."
        },
        learning_outcomes: {
            ...baseFields,
            type: "learning_outcomes",
            outcomes: ["Define vector quantities.", "Differentiate between scalar and vector measurements."]
        },
        comparison_view: {
            ...baseFields,
            type: "comparison_view",
            caption: "Comparison of Scalars and Vectors",
            headers: ["Feature", "Scalars", "Vectors"],
            rows: [["Magnitude", "Yes", "Yes"], ["Direction", "No", "Yes"]]
        },
        quran_verse: {
            ...baseFields,
            type: "quran_verse",
            surah: 2,
            ayah: 164,
            textbook_urdu_translation: "Beshak aasmanon aur zameen ki paidaish mein nishaniyan hain.",
            word_alignments: [{ position: 1, urdu_meaning: "Beshak", grammar_note: "Harf" }]
        },
        activity: {
            ...baseFields,
            type: "activity",
            title: "Measuring Volume of a Small Solid Object",
            apparatus: ["Measuring cylinder", "Water", "Thread", "Small stone"],
            procedure_steps: ["Fill cylinder to 50ml", "Lower stone carefully", "Record new volume value"],
            expected_result: "The volume increase equals the stone's spatial volume footprint."
        },
        equation: {
            ...baseFields,
            type: "equation",
            latex: "E = mc^2",
            text: "E = mc squared"
        },
        numerical: {
            ...baseFields,
            type: "numerical",
            problem_text: "An object accelerates from rest to 20 m/s in 4 seconds. Calculate acceleration.",
            given: { vi: "0 m/s", vf: "20 m/s", t: "4 s" },
            required: "Acceleration (a)",
            solution_steps: ["Use equation: a = (vf - vi) / t", "Substitute values: a = (20 - 0) / 4"],
            final_answer: "5 m/s²"
        }
    };

    let allValidPassed = true;
    console.log('--- 1. Valid Structural Mocks Validation Evaluation ---');
    for (const [key, payload] of Object.entries(structuralMockObjects)) {
        const res = ContentBlockSchema.safeParse(payload);
        console.log(`[BLOCK TYPE: ${key.padEnd(18)}] => success: ${res.success}`);
        if (!res.success) {
            allValidPassed = false;
            console.error(JSON.stringify(res.error.format(), null, 2));
        }
    }

    console.log('\n--- 2. Targeted Edge Case Exception Boundary Testing ---');

    // Failure Block 1: Missing structural heading text parameters
    const badHeading = { ...baseFields, type: "heading", level: 1, slug_anchor: "bad-block" };
    const resBadHeading = ContentBlockSchema.safeParse(badHeading);
    console.log(`Heading Missing Text Expected Fail => success: ${resBadHeading.success} (False expected)`);

    // Failure Block 2: Enum domain range validation error criteria testing
    const badMCQ = {
        ...baseFields,
        type: "mcq",
        mcq_id: "mcq_x1234567890a",
        question_text: "Bad MCQ?",
        options: { a: "1", b: "2", c: "3", d: "4" },
        correct_answer: "e" // Out of bounds
    };
    const resBadMCQ = ContentBlockSchema.safeParse(badMCQ);
    console.log(`MCQ Out-Of-Bounds Correct Answer Enum Expected Fail => success: ${resBadMCQ.success} (False expected)`);

    // Failure Block 3: Strict Unicode Arabic script platform protection validation check
    const badQuran = {
        ...baseFields,
        type: "quran_verse",
        surah: 1,
        ayah: 1,
        textbook_urdu_translation: "Beshak  الحمد لله  Tamam tareefein Allah ke liye hain." // Contains Arabic text glyphs
    };
    const resBadQuran = ContentBlockSchema.safeParse(badQuran);
    console.log(`Quran Block Containing Arabic Script Expected Fail => success: ${resBadQuran.success} (False expected)`);
    if (!resBadQuran.success) {
        console.log(JSON.stringify(resBadQuran.error.issues, null, 2));
        const errorMsg = resBadQuran.error?.issues?.[0]?.message || 'No specific error message found';
        console.log(`  > Rejection Error Message Text: "${errorMsg}"`);
    }

    if (allValidPassed && !resBadHeading.success && !resBadMCQ.success && !resBadQuran.success) {
        console.log('\n=== PHASE 4A MANUAL VERIFICATION COMPLETE ===');
    } else {
        console.error('\n🚨 Target condition variations verification failed.');
        process.exit(1);
    }
}


runVerification();