#!/usr/bin/env node
/**
 * Validates a SIJIL chapter JSON before GitHub push or ingestion.
 * Usage: node scripts/validate-chapter-json.js path/to/chapter.json
 * Exit code 0 = passed, 1 = structural errors, 2 = invalid JSON / tier1 failure
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateQwenOutput } from '../src/services/validation/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Usage: node scripts/validate-chapter-json.js <chapter.json>');
        process.exit(2);
    }

    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
        console.error(`File not found: ${absPath}`);
        process.exit(2);
    }

    let payload;
    try {
        payload = JSON.parse(fs.readFileSync(absPath, 'utf8'));
    } catch (err) {
        console.error(`Invalid JSON: ${err.message}`);
        process.exit(2);
    }

    const result = await validateQwenOutput(payload, { lenient: true });

    console.log(`\n=== SIJIL Chapter Validation: ${path.basename(absPath)} ===\n`);

    if (result.structuralStats) {
        const s = result.structuralStats;
        console.log('Block stats:');
        console.log(`  Total blocks: ${s.totalBlocks}`);
        console.log(`  Paragraph:    ${s.paragraphBlocks}`);
        console.log(`  Typed:        ${s.typedBlocks}`);
        console.log('  By type:', JSON.stringify(s.blockTypes, null, 2));
        console.log('');
    }

    if (result.structuralWarnings?.length) {
        console.log(`WARNINGS (${result.structuralWarnings.length}):`);
        for (const w of result.structuralWarnings) {
            console.log(`  [${w.code || 'warning'}] ${w.message}`);
        }
        console.log('');
    }

    if (result.flags?.length) {
        console.log(`QUALITY FLAGS (${result.flags.length}):`);
        for (const f of result.flags.slice(0, 10)) {
            console.log(`  [${f.type}] ${f.message}`);
        }
        if (result.flags.length > 10) {
            console.log(`  ... and ${result.flags.length - 10} more`);
        }
        console.log('');
    }

    if (!result.valid) {
        console.log(`FAILED (${(result.errors || []).length} errors):`);
        for (const e of result.errors || []) {
            console.log(`  [${e.code || result.tier}] ${e.message}`);
        }
        console.log('\n❌ Chapter JSON is NOT ready for ingestion. Fix errors and re-run.\n');
        process.exit(1);
    }

    console.log('✅ Chapter JSON passed structural quality gate.\n');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(2);
});
