/**
 * @module maps
 * @description Constituency & Polling Booth Locator.
 * Uses Nominatim (OpenStreetMap) for geocoding and Gemini AI to fetch real-time constituency/MP data.
 */

export const initMaps = () => {
  const searchBtn = document.getElementById('btn-booth-search');
  const locationBtn = document.getElementById('btn-use-location');
  const input = document.getElementById('booth-pincode');
  const resultsDiv = document.getElementById('booth-results');
  const mapContainer = document.getElementById('map-container');

  if (!searchBtn || !mapContainer) return;

  let lastSearchTime = 0;

  const showMap = (lat, lng, label) => {
    const mapsKey = window.ENV?.GOOGLE_MAPS_API_KEY;
    const isGoogleKeyValid = mapsKey && !mapsKey.startsWith('YOUR_');

    if (isGoogleKeyValid) {
      mapContainer.innerHTML = `
        <iframe
          title="Polling Booth Location — ${label}"
          width="100%" height="100%"
          frameborder="0"
          style="border:0; border-radius:12px;"
          loading="lazy"
          src="https://www.google.com/maps/embed/v1/view?key=${mapsKey}&center=${lat},${lng}&zoom=15"
          allowfullscreen>
        </iframe>
        <p style="margin-top:8px; font-size:0.78rem; color:var(--text-muted); text-align:right;">
          Powered by <strong style="color:var(--brand-primary);">Google Maps</strong>
        </p>`;
    } else {
      const bbox = `${lng - 0.025},${lat - 0.015},${lng + 0.025},${lat + 0.015}`;
      mapContainer.innerHTML = `
        <iframe
          title="Polling Booth Location — ${label}"
          width="100%" height="100%"
          frameborder="0"
          style="border:0; border-radius:12px;"
          loading="lazy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}"
          allowfullscreen>
        </iframe>
        <p style="margin-top:8px; font-size:0.78rem; color:var(--text-muted); text-align:right;">
          Map: <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}"
            target="_blank" rel="noopener" style="color:var(--brand-primary);">Open full map ↗</a>
        </p>`;
    }
  };

  const renderResults = (info) => {
    resultsDiv.innerHTML = `
      <div style="background:var(--bg-card); padding:20px; border-radius:12px;
                  box-shadow:var(--shadow-md); margin-top:16px;
                  border:1px solid var(--border-light); animation: fadeIn 0.4s ease-out;">
        <h3 style="color:var(--brand-primary);margin-bottom:12px;">
          📍 ${info.constituency} — ${info.state}
        </h3>
        <table style="width:100%;border-collapse:collapse;font-size:0.92rem;">
          <tr style="border-bottom:1px solid var(--border-light);">
            <td style="padding:8px 0;color:var(--text-muted);font-weight:600;width:40%;">Sitting MP / MLA</td>
            <td style="padding:8px 0;font-weight:700;">${info.mp}</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-light);">
            <td style="padding:8px 0;color:var(--text-muted);font-weight:600;">Location Searched</td>
            <td style="padding:8px 0;font-weight:600;">${info.queryLoc}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:var(--text-muted);font-weight:600;">Nearest Polling Booth</td>
            <td style="padding:8px 0;">Check ECI Portal for exact assigned booth</td>
          </tr>
        </table>
        <p style="margin-top:12px;font-size:0.8rem;color:var(--text-muted);">
          ℹ️ Real-time data powered by AI. Always verify at 
          <a href="https://electoralsearch.eci.gov.in" target="_blank" rel="noopener"
             style="color:var(--brand-primary);">ECI Electoral Search</a>.
        </p>
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;">
          <a href="https://www.openstreetmap.org/?mlat=${info.lat}&mlon=${info.lng}#map=16/${info.lat}/${info.lng}"
             target="_blank" rel="noopener" class="btn btn-primary" style="font-size:0.85rem;padding:8px 16px;">
            🗺️ Open in Map
          </a>
          <a href="https://electoralsearch.eci.gov.in" target="_blank" rel="noopener"
             class="btn btn-secondary" style="font-size:0.85rem;padding:8px 16px;">
            🔍 Verify on ECI
          </a>
        </div>
      </div>`;
    showMap(info.lat, info.lng, info.constituency);
  };

  // Helper: Use Gemini to find MP and Constituency
  const fetchElectionDataFromAI = async (locationStr) => {
    const apiKey = window.ENV?.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('YOUR_')) return { mp: 'Unknown (Valid Gemini API Key needed)', const: 'Unknown Constituency' };

    const prompt = `For the location "${locationStr}" in India, what is the most likely Lok Sabha parliamentary constituency and who is the current MP as of ${new Date().getFullYear()}? Respond strictly in this JSON format: {"constituency": "Name", "mp": "Name (Party)"}. No markdown or extra text.`;

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      return { mp: parsed.mp || 'Unknown', const: parsed.constituency || 'Unknown' };
    } catch (e) {
      console.error('AI Data fetch failed:', e);
      return { mp: 'Check ECI Portal', const: 'Constituency Info Unavailable' };
    }
  };

  const processCoordinates = async (lat, lng, fallbackQuery = '') => {
    try {
      const mapsKey = window.ENV?.GOOGLE_MAPS_API_KEY;
      const isGoogleKeyValid = mapsKey && !mapsKey.startsWith('YOUR_');

      let state = 'India';
      let city = fallbackQuery || 'Unknown Region';

      if (isGoogleKeyValid) {
        // Reverse Geocode via Google Maps
        const geoResp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsKey}`);
        const geoData = await geoResp.json();
        if (geoData.results && geoData.results.length > 0) {
          const comps = geoData.results[0].address_components;
          const stateComp = comps.find(c => c.types.includes('administrative_area_level_1'));
          const cityComp = comps.find(c => c.types.includes('locality') || c.types.includes('administrative_area_level_2'));
          if (stateComp) state = stateComp.long_name;
          if (cityComp) city = cityComp.long_name;
        }
      } else {
        // Reverse Geocode via Nominatim (Free Fallback)
        const geoResp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
        const geoData = await geoResp.json();
        state = geoData.address?.state || state;
        city = geoData.address?.city || geoData.address?.county || city;
      }

      const fullLoc = `${city}, ${state}`;

      resultsDiv.innerHTML = `<p style="color:var(--brand-primary);padding:12px;">🤖 AI is analyzing constituency for ${fullLoc}...</p>`;

      // 2. Fetch MP/Constituency via AI
      const aiData = await fetchElectionDataFromAI(fullLoc);

      renderResults({
        state: state,
        constituency: aiData.const,
        mp: aiData.mp,
        queryLoc: fullLoc,
        lat, lng
      });
    } catch (err) {
      import('./ui-controller.js').then(({ showToast }) => showToast('Failed to load real-time location data.', 'error'));
      resultsDiv.innerHTML = '';
    }
  };

  const doSearch = async (query) => {
    if (!query.trim()) {
      import('./ui-controller.js').then(({ showToast }) => showToast('Please enter a pincode or city.', 'warning'));
      return;
    }
    const now = Date.now();
    if (now - lastSearchTime < 3000) return;
    lastSearchTime = now;

    resultsDiv.innerHTML = `<p style="color:var(--text-muted);padding:12px;">🔍 Finding coordinates for "<strong>${query}</strong>"...</p>`;
    mapContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">Loading map...</div>`;

    try {
      const mapsKey = window.ENV?.GOOGLE_MAPS_API_KEY;
      const isGoogleKeyValid = mapsKey && !mapsKey.startsWith('YOUR_');

      let lat, lng;

      if (isGoogleKeyValid) {
        // Forward Geocode via Google Maps
        const searchUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:IN&key=${mapsKey}`;
        const geoResp = await fetch(searchUrl);
        const geoData = await geoResp.json();

        if (!geoData.results || geoData.results.length === 0) {
          resultsDiv.innerHTML = `<p style="color:var(--color-error);padding:12px;">❌ Location not found via Google Maps.</p>`;
          mapContainer.innerHTML = '';
          return;
        }
        lat = parseFloat(geoData.results[0].geometry.location.lat);
        lng = parseFloat(geoData.results[0].geometry.location.lng);

      } else {
        // Forward Geocode via Nominatim
        const searchUrl = /^\d+$/.test(query)
          ? `https://nominatim.openstreetmap.org/search?format=json&country=India&postalcode=${query}`
          : `https://nominatim.openstreetmap.org/search?format=json&country=India&q=${encodeURIComponent(query)}`;

        const geoResp = await fetch(searchUrl);
        const geoData = await geoResp.json();

        if (!geoData || geoData.length === 0) {
          resultsDiv.innerHTML = `<p style="color:var(--color-error);padding:12px;">❌ Location not found. Try a different city or pincode.</p>`;
          mapContainer.innerHTML = '';
          return;
        }
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }

      await processCoordinates(lat, lng, query);

    } catch (e) {
      resultsDiv.innerHTML = `<p style="color:var(--color-error);padding:12px;">❌ Error searching location.</p>`;
    }
  };

  searchBtn.addEventListener('click', () => doSearch(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(input.value); });

  locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      import('./ui-controller.js').then(({ showToast }) => showToast('Geolocation not supported.', 'error'));
      return;
    }
    resultsDiv.innerHTML = `<p style="color:var(--text-muted);padding:12px;">📍 Acquiring GPS signal...</p>`;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        processCoordinates(lat, lng);
      },
      () => {
        import('./ui-controller.js').then(({ showToast }) => showToast('GPS access denied or failed.', 'error'));
        resultsDiv.innerHTML = '';
      },
      { timeout: 10000 }
    );
  });
};

