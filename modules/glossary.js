/**
 * @module glossary
 * @description Loads glossary terms and provides search functionality.
 */

import { fetchJSON } from './data-loader.js';

let glossaryData = [];

export const initGlossary = async () => {
  const container = document.getElementById('glossary-container');
  const searchInput = document.getElementById('glossary-search');
  
  if (!container || !searchInput) return;

  const data = await fetchJSON('data/glossary.json');
  if (data && data.terms) {
    glossaryData = data.terms;
    renderGlossary(glossaryData);
  } else {
    container.innerHTML = '<p>Failed to load glossary.</p>';
  }

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = glossaryData.filter(term => 
      term.term.toLowerCase().includes(query) || 
      (term.full_form && term.full_form.toLowerCase().includes(query)) ||
      term.definition.toLowerCase().includes(query)
    );
    renderGlossary(filtered);
  });
};

const renderGlossary = (terms) => {
  const container = document.getElementById('glossary-container');
  container.innerHTML = '';

  if (terms.length === 0) {
    container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No terms found.</p>';
    return;
  }

  terms.forEach(item => {
    const card = document.createElement('article');
    card.className = 'glossary-card animate-card';
    card.tabIndex = 0;
    
    let html = `<h3 class="gl-term" data-translate="true">${item.term}</h3>`;
    if (item.full_form) html += `<div class="gl-full-form" data-translate="true">${item.full_form}</div>`;
    html += `<p class="gl-definition" data-translate="true">${item.definition}</p>`;
    
    card.innerHTML = html;
    container.appendChild(card);
  });

  // Re-translate if language is not English
  import('./i18n.js').then(({ translateContentBlocks }) => translateContentBlocks());
};
