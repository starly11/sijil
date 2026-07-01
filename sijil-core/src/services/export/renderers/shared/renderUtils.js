/**
 * Shared utilities for export renderers
 * Handles theming, common HTML structures, and component rendering
 */

const DEFAULT_THEME = {
  primary: '#1a1a2e',
  accent: '#e94560',
  surface: '#f8f9fa',
  background: '#ffffff',
  text: '#212529',
  text_muted: '#6c757d',
  formula_bg: '#fff8e1',
  formula_color: '#e65100',
  heading_color: '#1a1a2e',
  example_bg: '#e8f5e9',
  example_border: '#4caf50',
  mcq_option_bg: '#f5f5f5',
  mcq_correct: '#4caf50',
  mcq_wrong: '#f44336',
  font_family: 'Georgia, serif',
  font_family_mono: 'Courier New, monospace',
  border_radius: '8px'
};

/**
 * Merges designMeta into defaultTheme
 * @param {Object|null} designMeta - Document design metadata
 * @returns {Object} Merged theme object
 */
export function resolveTheme(designMeta) {
  if (!designMeta || typeof designMeta !== 'object') {
    return { ...DEFAULT_THEME };
  }
  return { ...DEFAULT_THEME, ...designMeta };
}

/**
 * Returns KaTeX CDN links for LaTeX rendering
 * @returns {string} HTML string with link and script tags
 */
export function renderKatexCdn() {
  return `
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"><\/script>`;
}

/**
 * Renders a formula card HTML
 * @param {Object} formula - Formula object { latex, text, label, variables }
 * @param {Object} theme - Theme object
 * @returns {string} HTML string
 */
export function renderFormulaHtml(formula, theme) {
  const { latex = '', text = '', label = '', variables = [] } = formula;
  const escapedLatex = latex.replace(/"/g, '&quot;').replace(/\\/g, '\\\\');
  
  let varsHtml = '';
  if (variables && variables.length > 0) {
    varsHtml = '<div class="formula-vars" style="margin-top:8px;font-size:0.9em">' +
      variables.map(v => `<span style="margin-right:12px"><b>${v.symbol || ''}</b>: ${v.meaning || ''}</span>`).join('') +
      '</div>';
  }

  return `
<div class="formula-card" style="background:${theme.formula_bg}; border-left: 4px solid ${theme.formula_color}; padding: 16px; margin: 12px 0; border-radius: ${theme.border_radius}">
  <div class="formula-label" style="color:${theme.text_muted}; font-size:0.85em; margin-bottom:6px">${label || ''}</div>
  <div class="formula-latex" data-latex="${escapedLatex}">
    <script>if(window.katex){katex.render("${escapedLatex}", this.previousElementSibling, {throwOnError:false})}<\/script>
    <span class="formula-fallback" style="font-family:${theme.font_family_mono}">${text || latex}</span>
  </div>
  ${varsHtml}
</div>`;
}

/**
 * Renders an interactive MCQ card HTML
 * @param {Object} mcq - MCQ assessment object
 * @param {number} index - Question index
 * @param {Object} theme - Theme object
 * @returns {string} HTML string
 */
export function renderMcqHtml(mcq, index, theme) {
  const { question = '', options = {}, correct_answer = '', explanation = '' } = mcq;
  
  let optionsHtml = '';
  const optionKeys = ['a', 'b', 'c', 'd'];
  optionKeys.forEach(key => {
    if (options[key]) {
      const isCorrect = correct_answer === key;
      const label = key.toUpperCase();
      optionsHtml += `
    <div class="mcq-option" data-key="${key}" data-correct="${isCorrect}"
      onclick="sijilMcqSelect(this)"
      style="cursor:pointer; padding:10px 14px; margin:6px 0; background:${theme.mcq_option_bg}; border-radius:6px; border: 2px solid transparent">
      ${label}. ${options[key]}
    </div>`;
    }
  });

  const explanationHtml = explanation ? 
    `<div class="mcq-explanation" style="display:none; margin-top:12px; padding:12px; background:#e3f2fd; border-radius:6px; font-size:0.9em">${explanation}</div>` : '';

  return `
<div class="mcq-card" style="background:${theme.surface}; border:1px solid #e0e0e0; border-radius:${theme.border_radius}; padding:20px; margin:16px 0">
  <div class="mcq-question" style="font-weight:bold; margin-bottom:12px; color:${theme.heading_color}">
    Q${index + 1}. ${question}
  </div>
  <div class="mcq-options">${optionsHtml}
  </div>${explanationHtml}
</div>`;
}

/**
 * Renders a complete HTML document shell
 * @param {string} title - Page title
 * @param {string} bodyContent - HTML body content
 * @param {Object} theme - Theme object
 * @param {string} extraHeadTags - Additional head tags (e.g., KaTeX)
 * @returns {string} Complete HTML document
 */
export function renderPageShell(title, bodyContent, theme, extraHeadTags = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${extraHeadTags}
  <style>
    /* Base reset and typography using theme values */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${theme.font_family}; background: ${theme.background}; color: ${theme.text}; line-height: 1.7; padding: 0; }
    .sijil-container { max-width: 820px; margin: 0 auto; padding: 40px 24px; }
    .sijil-header { border-bottom: 3px solid ${theme.accent}; padding-bottom: 20px; margin-bottom: 32px; }
    .sijil-title { font-size: 2em; color: ${theme.heading_color}; margin-bottom: 8px; }
    .sijil-subtitle { color: ${theme.text_muted}; font-size: 0.95em; }
    h2, h3 { color: ${theme.heading_color}; margin: 28px 0 12px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.8em; background: ${theme.accent}; color: white; margin-bottom: 16px; }
    @media print { .no-print { display: none; } body { padding: 0; } }
    /* MCQ interaction styles */
    .mcq-option:hover { background: #e3f2fd !important; }
    .mcq-option.selected-correct { background: ${theme.mcq_correct} !important; color: white; border-color: ${theme.mcq_correct} !important; }
    .mcq-option.selected-wrong { background: ${theme.mcq_wrong} !important; color: white; border-color: ${theme.mcq_wrong} !important; }
    .mcq-option.reveal-correct { background: ${theme.mcq_correct} !important; color: white; }
  </style>
  <script>
  function sijilMcqSelect(el) {
    const card = el.closest('.mcq-card');
    if (card.dataset.answered) return;
    card.dataset.answered = 'true';
    const isCorrect = el.dataset.correct === 'true';
    el.classList.add(isCorrect ? 'selected-correct' : 'selected-wrong');
    if (!isCorrect) {
      card.querySelectorAll('.mcq-option').forEach(opt => {
        if (opt.dataset.correct === 'true') opt.classList.add('reveal-correct');
      });
    }
    const exp = card.querySelector('.mcq-explanation');
    if (exp) exp.style.display = 'block';
  }
  <\/script>
</head>
<body>
  <div class="sijil-container">
    ${bodyContent}
    <div class="sijil-footer no-print" style="margin-top:60px; padding-top:20px; border-top:1px solid #eee; color:${theme.text_muted}; font-size:0.85em; text-align:center">
      Generated by Sijil · ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>`;
}
