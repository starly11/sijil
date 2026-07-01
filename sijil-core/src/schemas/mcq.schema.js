import { z } from 'zod';
import { idSchema } from './common.schema.js';

/** Validates diagnostic evaluation configurations, options structural constraints, and marking keys. */
export const MCQSchema = z.object({
    mcq_id: idSchema('mcq').optional(),
    question_number: z.string().optional(),
    question_text: z.string().min(1),
    options: z.object({
        a: z.string(),
        b: z.string(),
        c: z.string(),
        d: z.string()
    }),
    correct_answer: z.enum(["a", "b", "c", "d"]),
    explanation: z.string().default(""),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    bloom_level: z.string().optional(),
    source_page: z.number().int().positive().optional(),
    past_paper_years: z.array(z.string()).default([])
});