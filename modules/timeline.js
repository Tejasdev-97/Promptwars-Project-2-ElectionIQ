/**
 * @module timeline
 * @description Loads and renders the interactive election timeline.
 */

import { fetchJSON } from './data-loader.js';
import { showModal } from './ui-controller.js';

let timelineData = null;

export const initTimeline = async () => {
  const container = document.getElementById('timeline-container');
  const select = document.getElementById('election-select');
  
  if (!container || !select) return;

  const processAndRender = (data) => {
    if (data && data.elections) {
      timelineData = data.elections;
      const currentVal = select.value;
      
      select.innerHTML = '';
      timelineData.forEach(elec => {
        const opt = document.createElement('option');
        opt.value = elec.id;
        opt.textContent = elec.name || elec.title || elec.id;
        select.appendChild(opt);
      });
      
      if (select.options.length > 0) {
        // Try to keep previously selected value if it still exists
        const exists = Array.from(select.options).some(o => o.value === currentVal);
        select.value = exists ? currentVal : select.options[0].value;
        renderTimeline(select.value);
      }
    } else if (!timelineData) {
      container.innerHTML = '<p>Failed to load timeline data.</p>';
    }
  };

  const loadData = async () => {
    // 1. Instant Load: Cache or Local JSON
    const cached = localStorage.getItem('cached_timeline_data');
    if (cached) {
      processAndRender(JSON.parse(cached));
      console.log("Timeline data instantly loaded from cache");
    } else {
      const localData = await fetchJSON('data/elections-india.json');
      processAndRender(localData);
      console.log("Timeline data instantly loaded from local JSON");
    }

    // Auto-detect location once
    if (navigator.geolocation && timelineData) {
      navigator.geolocation.getCurrentPosition(async pos => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10`);
          const geo = await res.json();
          const state = geo.address?.state;
          if (state) {
            const stateIdMatch = timelineData.find(e => e.id.includes(state.toLowerCase().split(' ')[0]));
            if (stateIdMatch && select.value !== stateIdMatch.id) {
              const opt = document.createElement('option');
              opt.value = stateIdMatch.id;
              opt.textContent = `${state} Elections (Auto-detected)`;
              select.appendChild(opt);
              select.value = stateIdMatch.id;
              renderTimeline(stateIdMatch.id);
              import('./ui-controller.js').then(({ showToast }) => showToast(`Auto-selected timeline for your state: ${state}`, 'info'));
            }
          }
        } catch (e) {}
      }, () => {}, { timeout: 5000 });
    }

    // 2. Background Update: Real-time Gemini API
    if (navigator.onLine && window.ENV?.GEMINI_API_KEY && window.ENV.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        const apiKey = window.ENV.GEMINI_API_KEY;
        const prompt = `Provide the upcoming or current state election timeline for India in 2026. Respond ONLY in valid JSON format exactly like this, no markdown formatting, no backticks: { "elections": [ { "id": "bihar-2026", "name": "Bihar Elections 2026", "phases_detail": [ { "phase": 1, "date": "2026-10-15", "constituencies": 50, "states": ["Bihar"] } ] } ] }`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 }
          })
        }).then(resp => {
          if (resp.ok) return resp.json();
          throw new Error('Network response was not ok');
        }).then(result => {
          let jsonStr = result?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonStr) {
            const startIdx = jsonStr.indexOf('{');
            const endIdx = jsonStr.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
              jsonStr = jsonStr.substring(startIdx, endIdx + 1);
              const aiData = JSON.parse(jsonStr);
              if (aiData && aiData.elections) {
                localStorage.setItem('cached_timeline_data', JSON.stringify(aiData));
                console.log("Timeline updated in background from real-time Gemini API");
                processAndRender(aiData);
              }
            }
          }
        }).catch(err => {
          console.warn("Background Gemini timeline fetch failed:", err);
        });
      } catch (err) {
        console.warn("Failed to init background timeline fetch", err);
      }
    }
  };

  select.addEventListener('change', (e) => {
    renderTimeline(e.target.value);
  });

  loadData();
};

const renderTimeline = (electionId) => {
  const container = document.getElementById('timeline-container');
  if (!timelineData) return;

  // For demo, if ID is state-elections, we just show a placeholder or mock
  let election = timelineData.find(e => e.id === electionId);
  
  // Fallback to first if not found
  if (!election) election = timelineData[0];

  if (!election.phases_detail || election.phases_detail.length === 0) {
    container.innerHTML = '<p>No timeline data available for this election.</p>';
    return;
  }

  container.innerHTML = ''; // Clear loading

  const today = new Date();

  election.phases_detail.forEach((phase, index) => {
    const phaseDate = new Date(phase.date);
    let statusClass = 'upcoming';
    
    if (phaseDate < today) statusClass = 'completed';
    // Logic for ongoing could be within a week
    const diffDays = (phaseDate - today) / (1000 * 60 * 60 * 24);
    if (diffDays >= 0 && diffDays <= 7) statusClass = 'ongoing';

    const item = document.createElement('div');
    item.className = `timeline-item ${statusClass}`;
    item.tabIndex = 0;
    
    item.innerHTML = `
      <div class="tl-phase" data-translate="true">Phase ${phase.phase || index + 1}</div>
      <h3 class="tl-title">${phase.date_str || phase.date}</h3>
      <div class="tl-date" data-translate="true">${phase.states ? phase.states.join(', ') : 'N/A'}</div>
      <div class="tl-details" data-translate="true">${phase.constituencies || 0} Constituencies</div>
    `;

    // Click for details
    item.addEventListener('click', () => {
      const content = `
        <p><strong>Date:</strong> ${phase.date_str}</p>
        <p><strong>States involved:</strong> ${phase.states ? phase.states.join(', ') : 'N/A'}</p>
        <p><strong>Total Constituencies:</strong> ${phase.constituencies}</p>
        <p><em>Make sure you have your Voter ID and check your polling booth location in advance.</em></p>
      `;
      showModal(`Phase ${phase.phase} Details`, content);
    });

    // Keyboard support
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });

    container.appendChild(item);
  });

  // Re-translate if language is not English
  import('./i18n.js').then(({ translateContentBlocks }) => translateContentBlocks());
};
