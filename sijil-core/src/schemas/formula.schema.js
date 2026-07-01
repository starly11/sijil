import { z } from 'zod';
import { idSchema } from './common.schema.js';

/** Validates standalone scientific formulations or internal mathematical block properties. */
export const FormulaSchema = z.object({
    formula_id: idSchema('frm').optional(),
    name: z.string().min(1),
    latex: z.string().min(1),
    text: z.string().min(1),
    formula_type: z.enum(["definition", "derivation", "law", "empirical"]),
    variables: z.array(z.object({
        symbol: z.string(),
        name: z.string(),
        unit: z.string().optional(),
        description: z.string().optional()
    })).default([]),
    source_page: z.number().int().positive().optional(),
    subject_area: z.string().optional(),
    block_order_ref: z.number().int().optional()
});