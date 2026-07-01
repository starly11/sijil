/**
 * MCQ Pack Renderer
 * Renders a themed HTML page for MCQ practice exports with interactive elements
 */

import { resolveTheme, renderKatexCdn, renderMcqHtml, renderPageShell } from './shared/renderUtils.js';

/**
 * Renders an MCQ pack HTML page
 * @param {Object} aggregatorPayload - Payload from contentAggregator.service.js
 * @param {Object|null} designMeta - Document design metadata
 * @returns {string} Complete HTML document
 */
export async function renderMcqPack(aggregatorPayload, designMeta = null) {
  const theme = resolveTheme(designMeta);
  const { metadata, assessments = {} } = aggregatorPayload;
  
  const topicTitle = metadata?.title || 'Unknown Topic';
  const mcqs = assessments.mcqs || [];
  const shortQuestions = assessments.short_questions || [];
  
  // Build header section
  let bodyHtml = `
    <div class="sijil-header">
      <span class="badge">MCQ Practice Pack</span>
      <h1 class="sijil-title">${topicTitle}</h1>
      <div class="sijil-subtitle">
        ${metadata?.document_id ? `Document: ${metadata.document_id}` : ''}
        ${mcqs.length > 0 || shortQuestions.length > 0 
          ? ` · ${mcqs.length + shortQuestions.length} question(s) in this pack` 
          : ''}
      </div>
    </div>`;
  
  // Check if there's any content
  if (mcqs.length === 0 && shortQuestions.length === 0) {
    bodyHtml += `
    <div style="padding: 40px 20px; text-align: center; color: ${theme.text_muted}; background: ${theme.surface}; border-radius: ${theme.border_radius}; margin-top: 20px;">
      <p style="font-size: 1.1em; margin-bottom: 8px;">No assessment items found for this topic.</p>
      <p style="font-size: 0.9em;">Practice questions will appear here when the topic includes assessments.</p>
    </div>`;
  } else {
    // Render MCQs section
    if (mcqs.length > 0) {
      bodyHtml += `<h2 style="margin-top: 32px;">Multiple Choice Questions (${mcqs.length})</h2>`;
      mcqs.forEach((mcq, index) => {
        bodyHtml += renderMcqHtml(mcq, index, theme);
      });
    }
    
    // Render Short Questions section
    if (shortQuestions.length > 0) {
      bodyHtml += `<h2 style="margin-top: 40px;">Short Questions (${shortQuestions.length})</h2>`;
      shortQuestions.forEach((sq, index) => {
        const { question = '', model_answer = '', marks } = sq;
        bodyHtml += `
    <div style="border-left:3px solid ${theme.accent}; padding:12px 16px; margin:12px 0; background:${theme.surface}; border-radius: ${theme.border_radius}">
      <b>Q${index + 1}${marks ? ` (${marks} marks)` : ''}: ${question}</b>
      <details style="margin-top:8px">
        <summary style="cursor:pointer; color:${theme.accent}; font-weight: normal;">Show Answer</summary>
        <p style="margin-top:8px; padding: 8px; background: #e8f5e9; border-radius: 4px;">${model_answer || 'No answer provided.'}</p>
      </details>
    </div>`;
      });
    }
  }
  
  const extraHeadTags = renderKatexCdn();
  const title = `MCQ Practice — ${topicTitle}`;
  
  return renderPageShell(title, bodyHtml, theme, extraHeadTags);
}
