import dotenv from 'dotenv';
import { z } from 'zod';

// 1. Load dotenv at the very top
dotenv.config();

// 2. Define the Zod schema for environment variables
const envSchema = z.object({
    // --- Database ---
    MONGODB_URI: z.string().url({ message: "Must be a valid MongoDB connection string URI" }),

    // --- Queue / Cache ---
    REDIS_URL: z.string().regex(/^rediss?:\/\//, {
        message: "Must be a valid Redis TCP connection string starting with redis:// or rediss://"
    }).default("redis://localhost:6379"),
    UPSTASH_REDIS_REST_URL: z.string().url({ message: "Must be a valid HTTP REST URL" }).optional().default("http://localhost:6379"),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1, { message: "REST token is required" }).optional().default("default"),

    // --- Asset storage ---
    ASSET_BASE_URL: z.string().url({ message: "Must be a valid asset base URL" }).default("https://raw.githubusercontent.com/sijil-onyx/sijil-assets/main"),
    ASSET_REPO_OWNER: z.string().min(1, { message: "Asset repository owner is required" }).default("sijil-onyx"),
    ASSET_REPO_NAME: z.string().min(1, { message: "Asset repository name is required" }).default("sijil-assets"),
    ASSET_REPO_BRANCH: z.string().default("main"),

    // --- App ---
    PORT: z.coerce.number().int().positive().default(4000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    
    // --- GitHub & Admin ---
    GITHUB_PAT: z.string().optional(),
    ADMIN_SECRET: z.string().optional(),
});

// 3. Parse process.env against the schema
const result = envSchema.safeParse(process.env);

// 4. If validation fails, log issues clearly and fail fast
if (!result.success) {
    console.error('❌ Invalid environment configuration:');

    result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        console.error(`  - [${path}]: ${issue.message}`);
    });

    process.exit(1);
}

// 5. Export a single frozen config object
export const config = Object.freeze(result.data);