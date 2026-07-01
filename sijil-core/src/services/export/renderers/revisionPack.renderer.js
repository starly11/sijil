/**
 * Revision Pack Renderer
 * Renders a comprehensive themed HTML page for revision exports
 */

import { resolveTheme, renderKatexCdn, renderFormulaHtml, renderMcqHtml, renderPageShell } from './shared/renderUtils.js';

/**
 * Renders a revision pack HTML page
 * @param {Object} aggregatorPayload - Payload from contentAggregator.service.js
 * @param {Object|null} designMeta - Document design metadata
 * @returns {string} Complete HTML document
 */
export async function renderRevisionPack(aggregatorPayload, designMeta = null) {
  const theme = resolveTheme(designMeta);
  const { 
    metadata, 
    content_blocks = [], 
    key_terms = [], 
    formulas = [], 
    assessments = {} 
  } = aggregatorPayload;
  
  const topicTitle = metadata?.title || 'Unknown Topic';
  const mcqs = assessments.mcqs || [];
  const shortQuestions = assessments.short_questions || [];
  
  // Build header section
  let bodyHtml = `
    <div class="sijil-header">
      <span class="badge">Revision Pack</span>
      <h1 class="sijil-title">${topicTitle}</h1>
      <div class="sijil-subtitle">
        ${metadata?.url_path ? `<a href="${metadata.url_path}" style="color: ${theme.accent}; text-decoration: none;">${metadata.url_path}</a>` : ''}
        ${metadata?.document_id ? ` · Document: ${metadata.document_id}` : ''}
      </div>
    </div>`;
  
  // 1. Key Terms section
  if (key_terms && key_terms.length > 0) {
    bodyHtml += `<h2 style="margin-top: 32px;">Key Terms</h2>`;
    key_terms.forEach(term => {
      const termText = typeof term === 'string' ? term : (term.term || '');
      const termDef = typeof term === 'object' ? (term.definition || '') : '';
      bodyHtml += `
    <div style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
      <b style="color: ${theme.heading_color};">${termText}</b>${termDef ? `: <span style="color: ${theme.text};">${termDef}</span>` : ''}
    </div>`;
    });
  }
  
  // 2. Content Blocks section
  if (content_blocks && content_blocks.length > 0) {
    bodyHtml += `<h2 style="margin-top: 32px;">Topic Content</h2>`;
    content_blocks.forEach(block => {
      const { block_type = '', content = '', source_page } = block;
      
      switch (block_type) {
        case 'heading':
          bodyHtml += `<h3 style="margin: 24px 0 12px;">${content}</h3>`;
          break;
        
        case 'paragraph':
          bodyHtml += `<p style="margin: 12px 0; line-height: 1.8;">${content}</p>`;
          break;
        
        case 'key_point':
        case 'fact':
        case 'highlight':
          bodyHtml += `
    <div style="background:${theme.example_bg}; border-left:4px solid ${theme.example_border}; padding:12px 16px; margin:10px 0; border-radius:${theme.border_radius}">
      <span style="font-weight: bold; color: ${theme.example_border}; display: block; margin-bottom: 4px; font-size: 0.85em;">Key Point</span>
      ${content}
    </div>`;
          break;
        
        case 'example':
          bodyHtml += `
    <div style="background:${theme.example_bg}; border-left:4px solid ${theme.example_border}; padding:12px 16px; margin:10px 0; border-radius:${theme.border_radius}">
      <span style="font-weight: bold; color: ${theme.example_border}; display: block; margin-bottom: 4px; font-size: 0.85em;">Example</span>
      ${content}
    </div>`;
          break;
        
        case 'table':
          bodyHtml += `
    <div style="overflow-x:auto; margin: 12px 0;">
      <table style="border-collapse:collapse;width:100%; border: 1px solid #e0e0e0;">${content}</table>
    </div>`;
          break;
        
        default:
          bodyHtml += `<p style="margin: 12px 0;">${content}</p>`;
      }
    });
  }
  
  // 3. Formulas section
  if (formulas && formulas.length > 0) {
    bodyHtml += `<h2 style="margin-top: 32px;">Formulas</h2>`;
    formulas.forEach(formula => {
      bodyHtml += renderFormulaHtml(formula, theme);
    });
  }
  
  // 4. Practice Questions section
  if (mcqs.length > 0 || shortQuestions.length > 0) {
    bodyHtml += `<h2 style="margin-top: 32px;">Practice Questions</h2>`;
    
    if (mcqs.length > 0) {
      mcqs.forEach((mcq, index) => {
        bodyHtml += renderMcqHtml(mcq, index, theme);
      });
    }
    
    if (shortQuestions.length > 0) {
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
  
  // Empty state message
  if (content_blocks.length === 0 && key_terms.length === 0 && formulas.length === 0 && mcqs.length === 0 && shortQuestions.length === 0) {
    bodyHtml += `
    <div style="padding: 40px 20px; text-align: center; color: ${theme.text_muted}; background: ${theme.surface}; border-radius: ${theme.border_radius}; margin-top: 20px;">
      <p style="font-size: 1.1em; margin-bottom: 8px;">No content found for this topic.</p>
      <p style="font-size: 0.9em;">Revision materials will appear here when the topic includes content blocks, terms, formulas, or assessments.</p>
    </div>`;
  }
  
  const hasFormulas = formulas && formulas.length > 0;
  const extraHeadTags = hasFormulas ? renderKatexCdn() : '';
  const title = `Revision — ${topicTitle}`;
  
  return renderPageShell(title, bodyHtml, theme, extraHeadTags);
}
