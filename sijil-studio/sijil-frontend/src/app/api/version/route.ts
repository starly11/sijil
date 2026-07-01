import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    version: process.env.npm_package_version || '0.1.0',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    buildTime: new Date().toISOString(),
  });
}
