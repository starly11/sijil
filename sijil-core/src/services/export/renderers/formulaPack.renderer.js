/**
 * Formula Pack Renderer
 * Renders a themed HTML page for formula exports
 */

import { resolveTheme, renderKatexCdn, renderFormulaHtml, renderPageShell } from './shared/renderUtils.js';

/**
 * Renders a formula pack HTML page
 * @param {Object} aggregatorPayload - Payload from contentAggregator.service.js
 * @param {Object|null} designMeta - Document design metadata
 * @returns {string} Complete HTML document
 */
export async function renderFormulaPack(aggregatorPayload, designMeta = null) {
  const theme = resolveTheme(designMeta);
  const { metadata, formulas = [], export_type, document_type } = aggregatorPayload;
  
  const topicTitle = metadata?.title || 'Unknown Topic';
  
  // Build header section
  let bodyHtml = `
    <div class="sijil-header">
      <span class="badge">Formula Pack</span>
      <h1 class="sijil-title">${topicTitle}</h1>
      <div class="sijil-subtitle">
        ${metadata?.document_id ? `Document: ${metadata.document_id}` : ''}
        ${metadata?.chapter_id ? ` · Chapter: ${metadata.chapter_id}` : ''}
        ${formulas.length > 0 ? ` · ${formulas.length} formula(s) in this pack` : ''}
      </div>
    </div>`;
  
  // Build formulas section
  if (!formulas || formulas.length === 0) {
    bodyHtml += `
    <div style="padding: 40px 20px; text-align: center; color: ${theme.text_muted}; background: ${theme.surface}; border-radius: ${theme.border_radius}; margin-top: 20px;">
      <p style="font-size: 1.1em; margin-bottom: 8px;">No formulas found for this topic.</p>
      <p style="font-size: 0.9em;">Formulas will appear here when the topic includes mathematical expressions.</p>
    </div>`;
  } else {
    bodyHtml += `<h2 style="margin-top: 32px;">Formulas</h2>`;
    formulas.forEach(formula => {
      bodyHtml += renderFormulaHtml(formula, theme);
    });
  }
  
  const extraHeadTags = renderKatexCdn();
  const title = `Formula Pack — ${topicTitle}`;
  
  return renderPageShell(title, bodyHtml, theme, extraHeadTags);
}
