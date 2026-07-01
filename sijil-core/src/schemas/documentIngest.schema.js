import { z } from 'zod';
import { idSchema, SlugSchema } from './common.schema.js';
import { TopicIngestSchema } from './topicIngest.schema.js';

export const CURRENT_SCHEMA_VERSION = "2.0.0";

/** Validates ingestion platform run parameters, metrics tracking, and diagnostic arrays. */
export const IngestMetadataSchema = z.object({
    ingest_id: idSchema('ing'),
    engine: z.string().optional(),
    model_version: z.string().optional(),
    prompt_version: z.string().optional(),
    ingest_timestamp: z.string().optional(),
    processing_time_seconds: z.number().optional(),
    source_file_name: z.string().optional(),
    source_file_sha256: z.string().min(1),
    source_file_size_bytes: z.number().optional(),
    page_count: z.number().int().optional(),
    image_count: z.number().int().optional(),
    token_count_input: z.number().int().optional(),
    token_count_output: z.number().int().optional(),
    confidence_score: z.number().min(0).max(1).optional(),
    warnings: z.array(z.string()).default([]),
    status: z.enum(["pending", "processing", "complete", "error"]).default("pending")
});

/** Validates system monetization rules and accessibility authorization matrices. */
export const AccessControlSchema = z.object({
    is_premium: z.boolean().default(false),
    preview_percentage: z.number().min(0).max(100).default(100),
    paywall_trigger_elements: z.array(z.string()).default([]),
    allowed_roles: z.array(z.string()).default(["anonymous"])
});

/** Validates key identity fields for tracking canonical documents during ingestion loops. */
export const DocumentMetaSchema = z.object({
    _id: idSchema('doc'),
    document_id: z.string().min(1),
    title: z.string().min(1),
    title_vernacular: z.string().default(""),
    subtitle: z.string().default(""),
    document_type: z.string().optional(),
    subject: z.string().optional(),
    subject_slug: SlugSchema.optional(),
    grade_level: z.string().optional(),
    grade_numeric: z.number().optional(),
    language: z.string().default("english"),
    country: z.string().optional(),
    curriculum_standard: z.string().optional(),
    authors: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    access_control: AccessControlSchema.default({})
});

/** Validates organizational book structural markers such as chapters or units. */
export const ContainerSchema = z.object({
    _id: idSchema('ch'),
    container_type: z.string().default("chapter"),
    number: z.number().int().positive(),
    display_label: z.string().optional(),
    title: z.string().min(1),
    slug: SlugSchema,
    page_range: z.object({ start: z.number().int(), end: z.number().int() }).optional(),
    total_pages: z.number().int().optional()
});

/** Validates top-level aggregated payload structures across complete chapters. */
export const DocumentIngestSchema = z.object({
    schema_version: z.literal(CURRENT_SCHEMA_VERSION),
    schema_type: z.string().min(1),
    ingest_metadata: IngestMetadataSchema,
    document_metadata: DocumentMetaSchema,
    container: ContainerSchema,
    topics: z.array(TopicIngestSchema).min(1, "topics array must not be empty"),
    type_specific_data: z.record(z.string(), z.any()).default({})
});