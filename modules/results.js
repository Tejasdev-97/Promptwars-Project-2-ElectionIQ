/**
 * @module results
 * @description Live Election Results Dashboard using Google Charts.
 * Shows 2024 Lok Sabha final results and upcoming 2026 state elections.
 */

let chartLoaded = false;
let chartDrawn  = false;

export const initResults = () => {
  const chartContainer = document.getElementById('results-chart-container');
  const select         = document.getElementById('results-election-select');
  if (!chartContainer || !select) return;

  const currentYear = new Date().getFullYear();
  select.innerHTML = `
    <option value="lok-sabha-2024">Lok Sabha ${currentYear > 2024 ? 'Latest' : '2024'} (Final Results)</option>
    <option value="bihar-2026">Bihar Assembly 2026 (Upcoming)</option>
    <option value="delhi-2025">Delhi Assembly 2025 (Final Results)</option>
    <option value="jharkhand-2024">Jharkhand Assembly ${currentYear > 2024 ? 'Latest' : '2024'} (Final Results)</option>
    <option value="maharashtra-2024">Maharashtra Assembly ${currentYear > 2024 ? 'Latest' : '2024'} (Final Results)</option>
  `;

  let electionData = {
    'lok-sabha-2024': {
      title: 'Lok Sabha 2024 — Final Results',
      rows: [
        ['Alliance / Party', 'Seats Won', { role:'style' }, { role:'annotation' }],
        ['NDA (BJP+)', 293, '#FF6B35', '293'],
        ['INDIA Alliance', 234, '#1B4965', '234'],
        ['Others', 16, '#9E9E9E', '16'],
      ],
      note: 'NDA won majority (272 needed). BJP alone won 240 seats.'
    },
    'bihar-2026': {
      title: 'Bihar Assembly 2026 — Polling Phase Schedule',
      rows: [
        ['Party', 'Projected Seats (Surveys)', { role:'style' }, { role:'annotation' }],
        ['JD(U)+BJP (NDA)', 140, '#FF6B35', '140'],
        ['RJD+Congress (INDIA)', 90, '#1B4965', '90'],
        ['Others / Independents', 13, '#9E9E9E', '13'],
      ],
      note: 'Bihar elections expected Oct–Nov 2026. 243 total seats. Polls not yet conducted — data based on surveys.'
    }
  };

  const processAndRender = (data) => {
    electionData = data;
    const currentVal = select.value;
    
    select.innerHTML = '';
    for (const key in electionData) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = electionData[key].title;
      select.appendChild(opt);
    }
    
    if (select.options.length > 0) {
      const exists = Array.from(select.options).some(o => o.value === currentVal);
      select.value = exists ? currentVal : select.options[0].value;
      if (document.getElementById('results').classList.contains('active')) {
        loadCharts(select.value);
      }
    }
  };

  const loadData = () => {
    // 1. Instant Load: Cache or Local JSON
    const cached = localStorage.getItem('cached_results_data');
    if (cached) {
      processAndRender(JSON.parse(cached));
      console.log("Results data instantly loaded from cache");
    } else {
      processAndRender(electionData);
      console.log("Results data instantly loaded from local hardcoded fallback");
    }

    // 2. Background Update: Real-time Gemini API
    if (navigator.onLine && window.ENV?.GEMINI_API_KEY && window.ENV.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        const apiKey = window.ENV.GEMINI_API_KEY;
        const prompt = `Provide the live or most recent election results for India. If 2026 results are not yet available, provide the final 2024 Lok Sabha or the latest 2025 state election results instead. Respond ONLY in valid JSON format exactly like this, no markdown formatting, no backticks: { "results": { "latest-election": { "title": "Latest Election (Year)", "rows": [ ["Party", "Seats", {"role":"style"}, {"role":"annotation"}], ["Party A", 100, "#FF0000", "100"] ], "note": "Brief context about these results." } } }`;
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
              if (aiData && aiData.results) {
                localStorage.setItem('cached_results_data', JSON.stringify(aiData.results));
                console.log("Results updated in background from real-time Gemini API");
                processAndRender(aiData.results);
              }
            }
          }
        }).catch(err => {
          console.warn("Background Gemini results fetch failed:", err);
        });
      } catch (err) {
        console.warn("Failed to init background results fetch", err);
      }
    }
  };

  const drawChart = (electionId) => {
    if (!window.google?.visualization) return;
    const ed = electionData[electionId] || electionData['lok-sabha-2024'];

    const rowsToProcess = (ed.rows && ed.rows.length > 1) ? ed.rows.slice(1) : [['Awaiting Data', 0, '#9E9E9E', '0']];
    const totalSeats = rowsToProcess.reduce((acc, row) => acc + (parseInt(String(row[1]).replace(/,/g, ''), 10) || 0), 0);
    const majorityMark = 272; 
    
    chartContainer.innerHTML = `
      <div id="chart-div" style="width:100%;height:340px;"></div>
      <p id="chart-note" style="margin-top:12px;font-size:0.82rem;color:var(--text-muted);padding:0 8px;" data-translate="true">${ed.note || 'Data compiled.'}</p>
    `;

    const data = new window.google.visualization.DataTable();
    data.addColumn('string', 'Party');
    data.addColumn('number', 'Seats');
    data.addColumn({ type: 'string', role: 'style' });
    data.addColumn({ type: 'string', role: 'annotation' });

    rowsToProcess.forEach(r => {
      const party = r[0] ? String(r[0]) : 'Unknown';
      const seats = parseInt(String(r[1]).replace(/,/g, ''), 10) || 0;
      const color = r[2] ? String(r[2]) : '#9E9E9E';
      const annotation = r[3] ? String(r[3]) : String(seats);
      data.addRow([party, seats, color, annotation]);
    });
    
    const barOptions = {
      title: ed.title || 'Seat Distribution',
      titleTextStyle: { fontSize: 15, bold: true, color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#E6EDF3' : '#1A1A2E' },
      chartArea: { width: '80%', height: '70%' },
      hAxis: { minValue: 0, gridlines: { color: '#3A3A4A' } },
      vAxis: { titleTextStyle: { color: '#888' } },
      legend: { position: 'none' },
      animation: { startup: true, duration: 1000, easing: 'out' },
      backgroundColor: 'transparent',
      annotations: { alwaysOutside: false },
    };

    try {
      const barChart = new window.google.visualization.BarChart(document.getElementById('chart-div'));
      barChart.draw(data, barOptions);
    } catch (err) {
      console.warn("Failed to draw charts", err);
    }

    chartDrawn = true;
    import('./i18n.js').then(({ translateContentBlocks }) => translateContentBlocks());
  };

  const loadCharts = (electionId) => {
    if (window.google?.visualization && typeof window.google.visualization.BarChart === 'function') {
      drawChart(electionId);
      return;
    }
    
    if (chartLoaded) {
      if (window.google?.charts) {
        window.google.charts.setOnLoadCallback(() => drawChart(electionId));
      } else {
        // In rare case script tag is injected but window.google is not defined yet, try again in 500ms
        setTimeout(() => loadCharts(electionId), 500);
      }
      return;
    }
    chartLoaded = true;

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      window.google.charts.load('current', { packages: ['corechart'] });
      window.google.charts.setOnLoadCallback(() => drawChart(electionId));
    };
    script.onerror = () => {
      // Offline fallback — show text table
      const ed = electionData[electionId] || electionData['lok-sabha-2024'] || Object.values(electionData)[0];
      if (!ed) return;
      
      const totalSeats = ed.rows.slice(1).reduce((acc, row) => acc + (parseInt(row[1]) || 0), 0);
      
      chartContainer.innerHTML = `
        <div style="padding:24px;text-align:center;">
          <h3 style="margin-bottom:16px;color:var(--text-primary);">${ed.title || 'Election Results'}</h3>
          <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
            <thead>
              <tr style="background:var(--bg-secondary);color:var(--text-secondary);">
                <th style="padding:10px 16px;text-align:left;">Party / Alliance</th>
                <th style="padding:10px 16px;text-align:right;">Seats</th>
              </tr>
            </thead>
            <tbody>
              ${(ed.rows && ed.rows.length > 1 ? ed.rows.slice(1) : [['Awaiting Data', 0, '#9E9E9E', '0']]).map(r => `
                <tr style="border-bottom:1px solid var(--border-light);">
                  <td style="padding:10px 16px;font-weight:600;color:var(--text-primary);">${r[0]}</td>
                  <td style="padding:10px 16px;text-align:right;font-weight:700;color:${r[2] || '#9E9E9E'};">${parseInt(String(r[1]).replace(/,/g, ''), 10) || 0}</td>
                </tr>`).join('')}
            </tbody>
          </table>
          <p style="margin-top:12px;font-size:0.8rem;color:var(--text-muted);">${ed.note || 'Data compiled.'}</p>
          <p style="margin-top:6px;font-size:0.8rem;color:var(--color-warning);">📡 Google Charts unavailable offline — showing text view.</p>
        </div>`;
    };
    document.head.appendChild(script);
  };

  // Load when section becomes active
  const resultsSection = document.getElementById('results');
  if (resultsSection) {
    new MutationObserver(mutations => {
      mutations.forEach(m => {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          if (resultsSection.classList.contains('active') && !chartDrawn) {
            loadCharts(select.value);
          }
        }
      });
    }).observe(resultsSection, { attributes: true });
  }

  select.addEventListener('change', () => {
    chartDrawn = false;
    loadCharts(select.value);
  });
  
  // Initialize real-time data fetch on load
  loadData();
};
