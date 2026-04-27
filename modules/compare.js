/**
 * @module compare
 * @description Renders comparison between different global election systems.
 */

import { fetchJSON } from './data-loader.js';

let globalElections = [];

export const initCompare = async () => {
  const container = document.getElementById('compare-container');
  const btn = document.getElementById('compare-btn');
  const selectA = document.getElementById('compare-country-a');
  const selectB = document.getElementById('compare-country-b');

  if (!container || !btn) return;

  const data = await fetchJSON('data/elections-global.json');
  if (data && data.elections) {
    globalElections = data.elections;
  }

  // Pre-fetch India data as well for comparison
  const indiaData = await fetchJSON('data/elections-india.json');
  if (indiaData && indiaData.elections) {
    // Merge or mock a structure suitable for comparison
    const indiaStats = {
      id: 'india',
      country: 'India',
      system: 'First-past-the-post (Parliamentary)',
      voters: '969 Million',
      voting_method: 'EVM (Electronic Voting Machine)',
      term_length: '5 Years'
    };
    globalElections.push(indiaStats);
  }

  btn.addEventListener('click', () => {
    const valA = selectA.value;
    const valB = selectB.value;
    renderComparison(valA, valB);
  });
};

const renderComparison = (idA, idB) => {
  const container = document.getElementById('compare-container');
  
  const dataA = globalElections.find(e => e.id.includes(idA) || e.country.toLowerCase().includes(idA)) || getMock(idA);
  const dataB = globalElections.find(e => e.id.includes(idB) || e.country.toLowerCase().includes(idB)) || getMock(idB);

  container.innerHTML = `
    <div class="compare-card animate-card">
      <h3>${dataA.country}</h3>
      <div class="compare-row">
        <span class="compare-label">System</span>
        <span class="compare-value">${dataA.system}</span>
      </div>
      <div class="compare-row">
        <span class="compare-label">Voting Method</span>
        <span class="compare-value">${dataA.voting_method}</span>
      </div>
      <div class="compare-row">
        <span class="compare-label">Term Length</span>
        <span class="compare-value">${dataA.term_length}</span>
      </div>
      <div class="compare-row">
        <span class="compare-label">Voters</span>
        <span class="compare-value">${dataA.voters}</span>
      </div>
    </div>
    
    <div class="compare-card animate-card">
      <h3>${dataB.country}</h3>
      <div class="compare-row">
        <span class="compare-label">System</span>
        <span class="compare-value">${dataB.system}</span>
      </div>
      <div class="compare-row">
        <span class="compare-label">Voting Method</span>
        <span class="compare-value">${dataB.voting_method}</span>
      </div>
      <div class="compare-row">
        <span class="compare-label">Term Length</span>
        <span class="compare-value">${dataB.term_length}</span>
      </div>
      <div class="compare-row">
        <span class="compare-label">Voters</span>
        <span class="compare-value">${dataB.voters}</span>
      </div>
    </div>
  `;
};

// Fallback mocks if data not fully loaded
const getMock = (id) => {
  const mocks = {
    india: { country: "India", system: "Parliamentary Republic", voting_method: "EVM", term_length: "5 Years", voters: "969M" },
    usa: { country: "United States", system: "Electoral College", voting_method: "Paper/Machine", term_length: "4 Years", voters: "161M" },
    uk: { country: "United Kingdom", system: "First-past-the-post", voting_method: "Paper Ballot", term_length: "5 Years", voters: "47M" },
    eu: { country: "European Union", system: "Proportional Representation", voting_method: "Paper/Machine", term_length: "5 Years", voters: "373M" }
  };
  return mocks[id] || mocks.india;
};
