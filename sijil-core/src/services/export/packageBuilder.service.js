import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const archiver = require('archiver')

import { PassThrough } from 'stream'
import fs from 'fs/promises'
import os from 'os'

import { renderFormulaPack } from './renderers/formulaPack.renderer.js'
import { renderMcqPack } from './renderers/mcqPack.renderer.js'
import { renderRevisionPack } from './renderers/revisionPack.renderer.js'
import { renderOfflineHtml } from './renderers/offlineHtml.renderer.js'
import { renderFlashcardPack } from './renderers/flashcardPack.renderer.js'
import { renderTopicPack } from './renderers/topicPack.renderer.js'
import { aggregateForExport } from './contentAggregator.service.js'
import * as logger from '../../utils/logger.js'

const TEMP_DIR = process.env.EXPORT_TEMP_DIR || os.tmpdir()
const BASE_URL = process.env.BASE_URL || 'https://sijil.app'

/**
 * Main function: Builds a ZIP buffer in memory and returns it.
 */
export async function buildOfflinePackage({ topicId, exportType, documentType, designMeta = null }) {
  const startTime = Date.now()

  // 1. Aggregate content (enforces policy)
  const payload = await aggregateForExport({ topicId, exportType, documentType })

  // 2. Select renderer based on exportType
  let htmlContent
  switch (exportType) {
    case 'formula_pack':
      htmlContent = await renderFormulaPack(payload, designMeta)
      break
    case 'mcq_pack':
      htmlContent = await renderMcqPack(payload, designMeta)
      break
    case 'revision_pack':
      htmlContent = await renderRevisionPack(payload, designMeta)
      break
    case 'offline_html':
      htmlContent = await renderOfflineHtml(payload, designMeta)
      break
    case 'flashcard_pack':
      htmlContent = await renderFlashcardPack(payload, designMeta)
      break
    case 'topic_pack':
      htmlContent = await renderTopicPack(payload, designMeta)
      break
    default:
      throw new Error(`No renderer for export type: ${exportType}`)
  }

  // 3. Build README.txt
  const topicUrlPath = payload.metadata?.url_path || ''
  const readmeContent = `Sijil Offline Package
=====================
Topic: ${payload.metadata?.title || 'Unknown'}
Export Type: ${exportType}
Generated: ${new Date().toISOString()}
Source: ${BASE_URL}${topicUrlPath ? topicUrlPath : ''}

This package contains:
- index.html   : Interactive content (MCQs work offline, formulas rendered via KaTeX CDN)
- content.json : Raw structured content data
- README.txt   : This file

Note: Formula rendering requires an internet connection (KaTeX CDN).
MCQ interaction works fully offline.
Visit Sijil for the full interactive experience: ${BASE_URL}
`

  // 4. Build ZIP in memory using archiver
  const archive = archiver('zip', { zlib: { level: 6 } })
  const passthrough = new PassThrough()
  const chunks = []

  const bufferPromise = new Promise((resolve, reject) => {
    passthrough.on('data', chunk => chunks.push(chunk))
    passthrough.on('end', () => resolve(Buffer.concat(chunks)))
    passthrough.on('error', reject)
    archive.on('error', reject)
  })

  archive.pipe(passthrough)
  archive.append(htmlContent, { name: 'index.html' })
  archive.append(JSON.stringify(payload, null, 2), { name: 'content.json' })
  archive.append(readmeContent, { name: 'README.txt' })

  await archive.finalize()
  const buffer = await bufferPromise

  const duration = Date.now() - startTime
  logger.info({
    export_type: exportType,
    topic_id: topicId,
    sizeKb: (buffer.length / 1024).toFixed(2),
    durationMs: duration
  }, 'Offline package built successfully')

  return buffer
}

/**
 * Same as buildOfflinePackage but saves to disk.
 */
export async function buildAndSavePackage({ topicId, exportType, documentType, designMeta = null, outputPath }) {
  const buffer = await buildOfflinePackage({ topicId, exportType, documentType, designMeta })
  await fs.writeFile(outputPath, buffer)
  return {
    buffer,
    outputPath,
    sizeBytes: buffer.length,
    sizeKb: (buffer.length / 1024).toFixed(2)
  }
}

/**
 * Generates a clean filename for the ZIP.
 */
export function generateExportFilename({ topicId, exportType, metadata }) {
  const slug = metadata?.slug || topicId
  const sanitizedSlug = slug
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const exportName = exportType.replace(/_/g, '-')
  return `sijil-${exportName}-${sanitizedSlug}-${topicId}.zip`
}
