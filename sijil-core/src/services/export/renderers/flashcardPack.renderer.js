/**
 * Flashcard Pack Renderer
 * Renders an interactive HTML flashcard deck with flip animations
 */

import { resolveTheme, renderPageShell } from './shared/renderUtils.js';

/**
 * Renders a flashcard pack HTML page
 * @param {Object} aggregatorPayload - Payload from contentAggregator.service.js
 * @param {Object|null} designMeta - Document design metadata
 * @returns {string} Complete HTML document
 */
export async function renderFlashcardPack(aggregatorPayload, designMeta = null) {
  const theme = resolveTheme(designMeta);
  const { 
    metadata, 
    flashcards = [],
    key_terms = []
  } = aggregatorPayload;
  
  const topicTitle = metadata?.title || 'Unknown Topic';
  
  // Merge flashcards from assessments and key_terms into one deck
  const cardDeck = [];
  
  // Add assessment flashcards (front = question, back = answer)
  if (flashcards && flashcards.length > 0) {
    flashcards.forEach((fc, index) => {
      cardDeck.push({
        id: `assess-${index}`,
        front: fc.question || fc.front || '',
        back: fc.answer || fc.model_answer || fc.back || ''
      });
    });
  }
  
  // Add key terms as flashcards (front = term, back = definition)
  if (key_terms && key_terms.length > 0) {
    key_terms.forEach((term, index) => {
      const termText = typeof term === 'string' ? term : (term.term || '');
      const termDef = typeof term === 'object' ? (term.definition || '') : '';
      if (termText) {
        cardDeck.push({
          id: `term-${index}`,
          front: termText,
          back: termDef || 'No definition available.'
        });
      }
    });
  }
  
  // Empty state
  if (cardDeck.length === 0) {
    const bodyHtml = `
    <div class="sijil-header">
      <span class="badge">Flashcard Deck</span>
      <h1 class="sijil-title">${topicTitle}</h1>
    </div>
    <div style="padding: 60px 20px; text-align: center; color: ${theme.text_muted}; background: ${theme.surface}; border-radius: ${theme.border_radius}; margin-top: 40px;">
      <p style="font-size: 1.3em; margin-bottom: 12px;">No flashcards available for this topic</p>
      <p style="font-size: 0.95em;">Flashcards will appear here when the topic includes assessment questions or key terms with definitions.</p>
    </div>`;
    
    return renderPageShell(`Flashcards — ${topicTitle}`, bodyHtml, theme, '');
  }
  
  // Build card HTML
  let cardsHtml = '';
  cardDeck.forEach((card, index) => {
    cardsHtml += `
    <div class="flashcard" data-index="${index}" onclick="flipCard(this)">
      <div class="flashcard-inner">
        <div class="flashcard-front">
          <div class="card-label">Card ${index + 1} of ${cardDeck.length}</div>
          <div class="card-content">${card.front}</div>
          <div class="card-hint">Click or tap to flip</div>
        </div>
        <div class="flashcard-back">
          <div class="card-label">Answer</div>
          <div class="card-content">${card.back}</div>
        </div>
      </div>
    </div>`;
  });
  
  const bodyHtml = `
    <div class="sijil-header">
      <span class="badge">Flashcard Deck</span>
      <h1 class="sijil-title">${topicTitle}</h1>
      <div class="sijil-subtitle">
        ${cardDeck.length} cards · Use ← → arrows or buttons to navigate, Space to flip
      </div>
    </div>
    
    <div class="flashcard-container">
      ${cardsHtml}
    </div>
    
    <div class="navigation-controls" style="display:flex; justify-content:center; gap:16px; margin-top:24px;">
      <button onclick="previousCard()" style="padding:12px 24px; background:${theme.surface}; border:2px solid ${theme.accent}; color:${theme.accent}; border-radius:${theme.border_radius}; cursor:pointer; font-size:1em;">← Previous</button>
      <button onclick="nextCard()" style="padding:12px 24px; background:${theme.accent}; border:2px solid ${theme.accent}; color:white; border-radius:${theme.border_radius}; cursor:pointer; font-size:1em;">Next →</button>
    </div>
    
    <style>
      .flashcard-container {
        perspective: 1000px;
        max-width: 600px;
        margin: 40px auto;
      }
      
      .flashcard {
        display: none;
        width: 100%;
        height: 350px;
        cursor: pointer;
      }
      
      .flashcard.active {
        display: block;
      }
      
      .flashcard-inner {
        position: relative;
        width: 100%;
        height: 100%;
        transition: transform 0.6s;
        transform-style: preserve-3d;
      }
      
      .flashcard.flipped .flashcard-inner {
        transform: rotateY(180deg);
      }
      
      .flashcard-front,
      .flashcard-back {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: ${theme.border_radius};
        padding: 32px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      
      .flashcard-front {
        background: ${theme.background};
        border: 2px solid ${theme.accent};
      }
      
      .flashcard-back {
        background: ${theme.accent};
        color: white;
        transform: rotateY(180deg);
      }
      
      .card-label {
        position: absolute;
        top: 16px;
        right: 16px;
        font-size: 0.85em;
        opacity: 0.7;
      }
      
      .card-content {
        font-size: 1.3em;
        line-height: 1.6;
        max-height: 70%;
        overflow-y: auto;
      }
      
      .card-hint {
        position: absolute;
        bottom: 16px;
        font-size: 0.85em;
        opacity: 0.6;
      }
      
      .flashcard-back .card-content {
        color: white;
      }
      
      @media (max-width: 640px) {
        .flashcard {
          height: 280px;
        }
        .card-content {
          font-size: 1.1em;
        }
      }
    </style>
    
    <script>
      let currentCardIndex = 0;
      const totalCards = ${cardDeck.length};
      
      function showCard(index) {
        document.querySelectorAll('.flashcard').forEach((card, i) => {
          card.classList.toggle('active', i === index);
          if (i !== index) card.classList.remove('flipped');
        });
      }
      
      function flipCard(cardEl) {
        cardEl.classList.toggle('flipped');
      }
      
      function nextCard() {
        if (currentCardIndex < totalCards - 1) {
          currentCardIndex++;
          showCard(currentCardIndex);
        } else {
          currentCardIndex = 0;
          showCard(currentCardIndex);
        }
      }
      
      function previousCard() {
        if (currentCardIndex > 0) {
          currentCardIndex--;
          showCard(currentCardIndex);
        } else {
          currentCardIndex = totalCards - 1;
          showCard(currentCardIndex);
        }
      }
      
      // Keyboard navigation
      document.addEventListener('keydown', function(e) {
        if (e.code === 'Space') {
          e.preventDefault();
          const activeCard = document.querySelector('.flashcard.active');
          if (activeCard) flipCard(activeCard);
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          nextCard();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          previousCard();
        }
      });
      
      // Initialize first card
      showCard(0);
    </script>`;
  
  return renderPageShell(`Flashcards — ${topicTitle}`, bodyHtml, theme, '');
}
