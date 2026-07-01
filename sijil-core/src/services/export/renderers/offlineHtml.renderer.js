/**
 * Offline HTML Renderer
 * Renders a self-contained HTML file optimized for offline reading
 */

import { resolveTheme, renderKatexCdn, renderFormulaHtml, renderPageShell } from './shared/renderUtils.js';

/**
 * Renders an offline HTML page
 * @param {Object} aggregatorPayload - Payload from contentAggregator.service.js
 * @param {Object|null} designMeta - Document design metadata
 * @returns {string} Complete HTML document
 */
export async function renderOfflineHtml(aggregatorPayload, designMeta = null) {
  const theme = resolveTheme(designMeta);
  const { 
    metadata, 
    content_blocks = [], 
    formulas = [], 
    assessments = {},
    assets = [],
    key_terms = [],
    flashcards = []
  } = aggregatorPayload;
  
  const topicTitle = metadata?.title || 'Unknown Topic';
  const subject = metadata?.subject || '';
  const grade = metadata?.grade_numeric || '';
  const chapter = metadata?.chapter_id || '';
  const mcqs = assessments.mcqs || [];
  const shortQuestions = assessments.short_questions || [];
  const longQuestions = assessments.long_questions || [];
  
  // Estimate read time (rough: 200 words per minute, avg block ~50 words)
  const estimatedReadTime = Math.max(1, Math.round(content_blocks.length / 4));
  
  // Build header section
  let bodyHtml = `
    <div class="sijil-header">
      <span class="badge">Offline Study Guide</span>
      <h1 class="sijil-title">${topicTitle}</h1>
      <div class="sijil-subtitle">
        ${subject ? `<span>${subject}</span>` : ''}
        ${grade ? `<span> · Grade ${grade}</span>` : ''}
        ${chapter ? `<span> · Chapter ${chapter}</span>` : ''}
        <span> · ~${estimatedReadTime} min read</span>
      </div>
    </div>`;
  
  // Table of Contents
  const tocSections = [];
  if (content_blocks.length > 0) tocSections.push({ id: 'content', label: 'Study Notes' });
  if (key_terms.length > 0) tocSections.push({ id: 'key-terms', label: 'Key Terms' });
  if (formulas.length > 0) tocSections.push({ id: 'formulas', label: 'Formulas' });
  if (mcqs.length > 0 || shortQuestions.length > 0) tocSections.push({ id: 'practice', label: 'Practice Questions' });
  if (assets.length > 0) tocSections.push({ id: 'assets', label: 'Figures & Tables' });
  
  if (tocSections.length > 0) {
    bodyHtml += `
    <nav class="table-of-contents" style="background:${theme.surface}; padding:16px; border-radius:${theme.border_radius}; margin:20px 0;">
      <h3 style="margin:0 0 12px; font-size:1em; color:${theme.heading_color};">Table of Contents</h3>
      <ul style="list-style:none; padding:0; margin:0;">`;
    tocSections.forEach(section => {
      bodyHtml += `<li style="margin:6px 0;"><a href="#${section.id}" style="color:${theme.accent}; text-decoration:none;">→ ${section.label}</a></li>`;
    });
    bodyHtml += `
      </ul>
    </nav>`;
  }
  
  // Content Blocks section
  if (content_blocks && content_blocks.length > 0) {
    bodyHtml += `<h2 id="content" style="margin-top: 32px;">Study Notes</h2>`;
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
        
        case 'quran_reference':
          bodyHtml += `
    <div style="background:#f5f5f5; border:1px dashed #ccc; padding:16px; margin:10px 0; border-radius:${theme.border_radius}; text-align:center; color:${theme.text_muted}">
      Quran reference — view online for full text
    </div>`;
          break;
        
        default:
          if (content) {
            bodyHtml += `<p style="margin: 12px 0;">${content}</p>`;
          }
      }
    });
  }
  
  // Key Terms section
  if (key_terms && key_terms.length > 0) {
    bodyHtml += `<h2 id="key-terms" style="margin-top: 32px;">Key Terms</h2>`;
    bodyHtml += `<dl style="margin:16px 0;">`;
    key_terms.forEach(term => {
      const termText = typeof term === 'string' ? term : (term.term || '');
      const termDef = typeof term === 'object' ? (term.definition || '') : '';
      bodyHtml += `
    <dt style="font-weight:bold; color:${theme.heading_color}; margin:12px 0 4px;">${termText}</dt>
    <dd style="margin:0 0 12px 20px; color:${theme.text};">${termDef || 'No definition available.'}</dd>`;
    });
    bodyHtml += `</dl>`;
  }
  
  // Formulas section
  if (formulas && formulas.length > 0) {
    bodyHtml += `<h2 id="formulas" style="margin-top: 32px;">Formulas</h2>`;
    formulas.forEach(formula => {
      bodyHtml += renderFormulaHtml(formula, theme);
    });
  }
  
  // Practice Questions section
  if (mcqs.length > 0 || shortQuestions.length > 0) {
    bodyHtml += `<h2 id="practice" style="margin-top: 32px;">Practice Questions</h2>`;
    
    if (mcqs.length > 0) {
      bodyHtml += `<h3 style="margin:20px 0 12px; font-size:1.2em;">Multiple Choice</h3>`;
      mcqs.forEach((mcq, index) => {
        const { question = '', options = {}, correct_answer = '', explanation = '' } = mcq;
        
        let optionsHtml = '';
        const optionKeys = Object.keys(options);
        optionKeys.forEach(key => {
          const isCorrect = correct_answer === key;
          const label = key.toUpperCase();
          optionsHtml += `
        <div class="mcq-option" data-key="${key}" data-correct="${isCorrect}"
          onclick="this.parentElement.dataset.answered='true';this.classList.add(this.dataset.correct==='true'?'correct':'wrong');if(this.dataset.correct!=='true'){this.parentElement.querySelectorAll('.mcq-option')[Array.from(this.parentElement.children).findIndex(c=>c.dataset.correct==='true')].classList.add('correct');}"
          style="cursor:pointer; padding:10px 14px; margin:6px 0; background:${theme.mcq_option_bg}; border-radius:6px; border: 2px solid transparent;">
          ${label}. ${options[key]}
        </div>`;
        });
        
        bodyHtml += `
    <div class="mcq-card" style="background:${theme.surface}; border:1px solid #e0e0e0; border-radius:${theme.border_radius}; padding:20px; margin:16px 0;">
      <div style="font-weight:bold; margin-bottom:12px; color:${theme.heading_color}">Q${index + 1}. ${question}</div>
      <div class="mcq-options">${optionsHtml}</div>
      ${explanation ? `<div class="mcq-explanation" style="display:none; margin-top:12px; padding:12px; background:#e3f2fd; border-radius:6px; font-size:0.9em">${explanation}</div>` : ''}
    </div>`;
      });
    }
    
    if (shortQuestions.length > 0) {
      bodyHtml += `<h3 style="margin:20px 0 12px; font-size:1.2em;">Short Answer</h3>`;
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
  
  // Assets section
  if (assets && assets.length > 0) {
    bodyHtml += `<h2 id="assets" style="margin-top: 32px;">Figures & Tables</h2>`;
    assets.forEach(asset => {
      if (asset.asset_type === 'figure') {
        bodyHtml += `
    <figure style="margin:20px 0; text-align:center;">
      <img src="${asset.resolved_url}" alt="${asset.alt_text || ''}" style="max-width:100%; height:auto; border:1px solid #e0e0e0; border-radius:${theme.border_radius}">
      ${asset.caption ? `<figcaption style="margin-top:8px; color:${theme.text_muted}; font-size:0.9em">${asset.caption}</figcaption>` : ''}
    </figure>`;
      } else if (asset.asset_type === 'table') {
        bodyHtml += `
    <div style="margin:20px 0;">
      <div style="font-weight:bold; color:${theme.heading_color}; margin-bottom:8px;">${asset.caption || 'Table'}</div>
      <div style="overflow-x:auto;">
        <table style="border-collapse:collapse;width:100%; border: 1px solid #e0e0e0;">
          ${asset.headers ? `<thead><tr>${asset.headers.map(h => `<th style="border:1px solid #e0e0e0; padding:8px; background:${theme.surface}">${h}</th>`).join('')}</tr></thead>` : ''}
          ${asset.rows ? `<tbody>${asset.rows.map(row => `<tr>${row.map(cell => `<td style="border:1px solid #e0e0e0; padding:8px">${cell}</td>`).join('')}</tr>`).join('')}</tbody>` : ''}
        </table>
      </div>
    </div>`;
      }
    });
  }
  
  // Empty state message
  if (content_blocks.length === 0 && key_terms.length === 0 && formulas.length === 0 && mcqs.length === 0 && shortQuestions.length === 0 && assets.length === 0) {
    bodyHtml += `
    <div style="padding: 40px 20px; text-align: center; color: ${theme.text_muted}; background: ${theme.surface}; border-radius: ${theme.border_radius}; margin-top: 20px;">
      <p style="font-size: 1.1em; margin-bottom: 8px;">No content found for this topic.</p>
      <p style="font-size: 0.9em;">Study materials will appear here when the topic includes content blocks, terms, formulas, or assessments.</p>
    </div>`;
  }
  
  // Footer
  bodyHtml += `
    <div class="sijil-footer" style="margin-top:60px; padding-top:20px; border-top:1px solid #eee; color:${theme.text_muted}; font-size:0.85em; text-align:center">
      Generated by Sijil — sijil.pk · ${new Date().toLocaleDateString()}
    </div>`;
  
  const hasFormulas = formulas && formulas.length > 0;
  const extraHeadTags = hasFormulas ? renderKatexCdn() : '';
  const title = `Offline Study — ${topicTitle}`;
  
  return renderPageShell(title, bodyHtml, theme, extraHeadTags);
}
