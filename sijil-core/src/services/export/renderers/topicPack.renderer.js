/**
 * Topic Pack Renderer
 * Renders a comprehensive multi-section study guide HTML
 */

import { resolveTheme, renderKatexCdn, renderFormulaHtml, renderPageShell } from './shared/renderUtils.js';

/**
 * Renders a topic pack HTML page
 * @param {Object} aggregatorPayload - Payload from contentAggregator.service.js
 * @param {Object|null} designMeta - Document design metadata
 * @returns {string} Complete HTML document
 */
export async function renderTopicPack(aggregatorPayload, designMeta = null) {
  const theme = resolveTheme(designMeta);
  const { 
    metadata, 
    content_blocks = [], 
    formulas = [], 
    assessments = {},
    key_terms = [],
    flashcards = [],
    assets = []
  } = aggregatorPayload;
  
  const topicTitle = metadata?.title || 'Unknown Topic';
  const subject = metadata?.subject || '';
  const grade = metadata?.grade_numeric || '';
  const chapter = metadata?.chapter_id || '';
  const topicNumber = metadata?.topic_number || '';
  const mcqs = assessments.mcqs || [];
  const shortQuestions = assessments.short_questions || [];
  const longQuestions = assessments.long_questions || [];
  
  // Quick stats
  const stats = {
    formulas: formulas.length,
    mcqs: mcqs.length,
    keyTerms: key_terms.length,
    flashcards: flashcards.length + (key_terms ? key_terms.length : 0)
  };
  
  // Build body HTML with sections
  let bodyHtml = '';
  
  // SECTION 1: Cover Page
  bodyHtml += `
    <div class="cover-page" style="text-align:center; padding:60px 20px; background:linear-gradient(135deg, ${theme.primary}, ${theme.accent}); color:white; border-radius:${theme.border_radius}; margin-bottom:40px;">
      <span class="badge" style="background:white; color:${theme.accent}; font-size:0.9em; padding:6px 14px; border-radius:20px; display:inline-block; margin-bottom:20px;">Comprehensive Study Guide</span>
      <h1 style="font-size:2.5em; margin:0 0 16px; color:white;">${topicTitle}</h1>
      ${subject ? `<p style="font-size:1.2em; margin:8px 0; opacity:0.9;">${subject}</p>` : ''}
      ${grade ? `<p style="font-size:1.1em; margin:8px 0; opacity:0.8;">Grade ${grade}${topicNumber ? ` · Topic ${topicNumber}` : ''}${chapter ? ` · Chapter ${chapter}` : ''}</p>` : ''}
      <p style="margin-top:24px; font-size:0.9em; opacity:0.7;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>`;
  
  // SECTION 2: Quick Stats Bar
  bodyHtml += `
    <div class="quick-stats" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:16px; margin:30px 0; padding:20px; background:${theme.surface}; border-radius:${theme.border_radius};">
      <div style="text-align:center; padding:16px;">
        <div style="font-size:2em; font-weight:bold; color:${theme.accent};">${stats.formulas}</div>
        <div style="font-size:0.85em; color:${theme.text_muted};">Formulas</div>
      </div>
      <div style="text-align:center; padding:16px;">
        <div style="font-size:2em; font-weight:bold; color:${theme.accent};">${stats.mcqs}</div>
        <div style="font-size:0.85em; color:${theme.text_muted};">MCQs</div>
      </div>
      <div style="text-align:center; padding:16px;">
        <div style="font-size:2em; font-weight:bold; color:${theme.accent};">${stats.keyTerms}</div>
        <div style="font-size:0.85em; color:${theme.text_muted};">Key Terms</div>
      </div>
      <div style="text-align:center; padding:16px;">
        <div style="font-size:2em; font-weight:bold; color:${theme.accent};">${stats.flashcards}</div>
        <div style="font-size:0.85em; color:${theme.text_muted};">Flashcards</div>
      </div>
    </div>`;
  
  // SECTION 3: Study Notes (same rendering as offlineHtml)
  if (content_blocks && content_blocks.length > 0) {
    bodyHtml += `
    <section class="study-notes" style="page-break-before:always; margin-top:40px;">
      <h2 style="color:${theme.heading_color}; border-bottom:3px solid ${theme.accent}; padding-bottom:12px; margin-bottom:24px;">Study Notes</h2>`;
    
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
    
    bodyHtml += `</section>`;
  }
  
  // SECTION 4: Formula Reference Sheet
  if (formulas && formulas.length > 0) {
    bodyHtml += `
    <section class="formula-reference" style="page-break-before:always; margin-top:40px;">
      <h2 style="color:${theme.heading_color}; border-bottom:3px solid ${theme.accent}; padding-bottom:12px; margin-bottom:24px;">Formula Reference Sheet</h2>`;
    
    formulas.forEach(formula => {
      bodyHtml += renderFormulaHtml(formula, theme);
    });
    
    bodyHtml += `</section>`;
  }
  
  // SECTION 5: Key Terms Glossary (alphabetically sorted)
  if (key_terms && key_terms.length > 0) {
    const sortedTerms = [...key_terms].sort((a, b) => {
      const termA = typeof a === 'string' ? a : (a.term || '');
      const termB = typeof b === 'string' ? b : (b.term || '');
      return termA.localeCompare(termB);
    });
    
    bodyHtml += `
    <section class="key-terms-glossary" style="page-break-before:always; margin-top:40px;">
      <h2 style="color:${theme.heading_color}; border-bottom:3px solid ${theme.accent}; padding-bottom:12px; margin-bottom:24px;">Key Terms Glossary</h2>
      <dl style="margin:16px 0;">`;
    
    sortedTerms.forEach(term => {
      const termText = typeof term === 'string' ? term : (term.term || '');
      const termDef = typeof term === 'object' ? (term.definition || '') : '';
      bodyHtml += `
        <dt style="font-weight:bold; color:${theme.heading_color}; margin:16px 0 6px; padding-top:12px; border-top:1px solid #e0e0e0;">${termText}</dt>
        <dd style="margin:0 0 12px 20px; color:${theme.text};">${termDef || 'No definition available.'}</dd>`;
    });
    
    bodyHtml += `
      </dl>
    </section>`;
  }
  
  // SECTION 6: MCQ Practice
  if (mcqs.length > 0 || shortQuestions.length > 0) {
    bodyHtml += `
    <section class="mcq-practice" style="page-break-before:always; margin-top:40px;">
      <h2 style="color:${theme.heading_color}; border-bottom:3px solid ${theme.accent}; padding-bottom:12px; margin-bottom:24px;">Practice Questions</h2>`;
    
    if (mcqs.length > 0) {
      bodyHtml += `<h3 style="margin:20px 0 12px; font-size:1.2em;">Multiple Choice Questions</h3>`;
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
      bodyHtml += `<h3 style="margin:20px 0 12px; font-size:1.2em;">Short Answer Questions</h3>`;
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
    
    bodyHtml += `</section>`;
  }
  
  // SECTION 7: Flashcard Summary (printable table version)
  const allFlashcards = [];
  if (flashcards && flashcards.length > 0) {
    flashcards.forEach((fc, index) => {
      allFlashcards.push({
        front: fc.question || fc.front || '',
        back: fc.answer || fc.model_answer || fc.back || ''
      });
    });
  }
  if (key_terms && key_terms.length > 0) {
    key_terms.forEach(term => {
      const termText = typeof term === 'string' ? term : (term.term || '');
      const termDef = typeof term === 'object' ? (term.definition || '') : '';
      if (termText) {
        allFlashcards.push({
          front: termText,
          back: termDef || 'No definition available.'
        });
      }
    });
  }
  
  if (allFlashcards.length > 0) {
    bodyHtml += `
    <section class="flashcard-summary" style="page-break-before:always; margin-top:40px;">
      <h2 style="color:${theme.heading_color}; border-bottom:3px solid ${theme.accent}; padding-bottom:12px; margin-bottom:24px;">Flashcard Summary</h2>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <thead>
          <tr style="background:${theme.surface};">
            <th style="border:1px solid #e0e0e0; padding:12px; text-align:left; color:${theme.heading_color};">Term / Question</th>
            <th style="border:1px solid #e0e0e0; padding:12px; text-align:left; color:${theme.heading_color};">Definition / Answer</th>
          </tr>
        </thead>
        <tbody>`;
    
    allFlashcards.forEach((card, index) => {
      bodyHtml += `
          <tr>
            <td style="border:1px solid #e0e0e0; padding:12px; vertical-align:top; font-weight:bold; color:${theme.heading_color};">${card.front}</td>
            <td style="border:1px solid #e0e0e0; padding:12px; vertical-align:top;">${card.back}</td>
          </tr>`;
    });
    
    bodyHtml += `
        </tbody>
      </table>
    </section>`;
  }
  
  // SECTION 8: Assets Appendix
  if (assets && assets.length > 0) {
    bodyHtml += `
    <section class="assets-appendix" style="page-break-before:always; margin-top:40px;">
      <h2 style="color:${theme.heading_color}; border-bottom:3px solid ${theme.accent}; padding-bottom:12px; margin-bottom:24px;">Figures & Tables Appendix</h2>`;
    
    assets.forEach(asset => {
      if (asset.asset_type === 'figure') {
        bodyHtml += `
      <figure style="margin:20px 0; text-align:center; page-break-inside:avoid;">
        <img src="${asset.resolved_url}" alt="${asset.alt_text || ''}" style="max-width:100%; height:auto; border:1px solid #e0e0e0; border-radius:${theme.border_radius}">
        ${asset.caption ? `<figcaption style="margin-top:8px; color:${theme.text_muted}; font-size:0.9em">${asset.caption}</figcaption>` : ''}
      </figure>`;
      } else if (asset.asset_type === 'table') {
        bodyHtml += `
      <div style="margin:20px 0; page-break-inside:avoid;">
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
    
    bodyHtml += `</section>`;
  }
  
  // Footer
  bodyHtml += `
    <div class="sijil-footer" style="margin-top:60px; padding-top:20px; border-top:1px solid #eee; color:${theme.text_muted}; font-size:0.85em; text-align:center">
      Generated by Sijil — sijil.pk · ${new Date().toLocaleDateString()}
    </div>`;
  
  const hasFormulas = formulas && formulas.length > 0;
  const extraHeadTags = hasFormulas ? renderKatexCdn() : '';
  const title = `Study Guide — ${topicTitle}`;
  
  // Add print styles to extraHeadTags
  const printStyles = `
  <style>
    @media print {
      .no-print { display: none !important; }
      section { page-break-before: always; }
      section:first-of-type { page-break-before: auto; }
      .cover-page { page-break-after: always; }
      a { text-decoration: none; color: black; }
      .mcq-option { border: 1px solid #000 !important; }
    }
  </style>`;
  
  return renderPageShell(title, bodyHtml, theme, extraHeadTags + printStyles);
}
