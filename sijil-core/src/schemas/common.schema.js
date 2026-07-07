import { z } from 'zod';

/** Validates canonical structural slug format rules and character limits. */
export const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format").max(80);

/**
 * Higher-order utility creating specialized regex string schemas matching targeted entity identities.
 * @param {string} prefix - The expected alphanumeric entity code prefix (e.g. 'blk', 'frm')
 */
export function idSchema(prefix) {
    return z.string().regex(new RegExp(`^${prefix}_[a-z0-9-]+$`), `ID must start with ${prefix}_ followed by lowercase letters, numbers, or hyphens`);
}

/** Validates structural design metadata, custom styling class definitions, and animation profiles. */
export const PresentationProfileSchema = z.object({
    visual_layer_type: z.string().default("standard_card"),
    theme_overrides: z.object({}).passthrough().default({}),
    animation_trigger: z.enum(["on-scroll", "on-load", "on-hover", "none"]).default("on-scroll"),
    tailwind_classes: z.string().default("")
}).default({});

/** Shared foundational object containing the schema properties required by all content blocks. */
export const BaseBlockFields = {
    _id: idSchema('blk'),
    block_order: z.number().int().positive(),
    source_page: z.number().int().positive(),
    html: z.string().min(1),
    presentation_profile: PresentationProfileSchema
};