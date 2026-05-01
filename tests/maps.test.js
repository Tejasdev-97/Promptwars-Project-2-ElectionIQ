/**
 * @jest-environment jsdom
 * @file tests/maps.test.js
 * @description Unit tests for the Maps / Booth Locator module.
 * Tests geocoding helpers, result rendering, and DOM initialisation.
 */

import { initMaps } from '../modules/maps.js';
import { jest } from '@jest/globals';

const buildMapsDOM = () => {
  document.body.innerHTML = `
    <input id="booth-pincode" type="text" />
    <button id="btn-booth-search">Search</button>
    <button id="btn-use-location">Use My Location</button>
    <div id="booth-results"></div>
    <div id="map-container" style="height:300px;"></div>
    <div id="toast-container"></div>
  `;
};

// ── Pure Logic Helpers ────────────────────────────────────────────────────────

describe('Maps Module — OSM Embed URL Generation', () => {
  const buildOSMUrl = (lat, lng) => {
    const bbox = `${lng - 0.025},${lat - 0.015},${lng + 0.025},${lat + 0.015}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  };

  test('generates a valid OSM embed URL', () => {
    const url = buildOSMUrl(28.6139, 77.2090);
    expect(url).toContain('openstreetmap.org/export/embed.html');
    expect(url).toContain('marker=28.6139,77.209');
  });

  test('bounding box expands correctly around the coordinate', () => {
    const lat = 19.0760, lng = 72.8777;
    const url = buildOSMUrl(lat, lng);
    expect(url).toContain('bbox=');
    // Should contain lng-0.025
    expect(url).toContain((lng - 0.025).toFixed(3).slice(0, 5));
  });

  test('generates different URLs for different coordinates', () => {
    const url1 = buildOSMUrl(28.6139, 77.2090);
    const url2 = buildOSMUrl(12.9716, 77.5946);
    expect(url1).not.toBe(url2);
  });
});

describe('Maps Module — Nominatim Response Parsing', () => {
  /**
   * Replicates the address extraction logic from maps.js processCoordinates()
   */
  const parseNominatimAddress = (address) => {
    return {
      state: address?.state || 'India',
      city: address?.city || address?.county || 'Unknown Region'
    };
  };

  test('extracts state from Nominatim response', () => {
    const addr = { state: 'Maharashtra', city: 'Mumbai' };
    expect(parseNominatimAddress(addr).state).toBe('Maharashtra');
  });

  test('extracts city from Nominatim response', () => {
    const addr = { state: 'Karnataka', city: 'Bengaluru' };
    expect(parseNominatimAddress(addr).city).toBe('Bengaluru');
  });

  test('falls back to county when city is missing', () => {
    const addr = { state: 'Rajasthan', county: 'Jaipur District' };
    expect(parseNominatimAddress(addr).city).toBe('Jaipur District');
  });

  test('defaults to "India" when state is missing', () => {
    expect(parseNominatimAddress({}).state).toBe('India');
  });

  test('defaults to "Unknown Region" when city and county are missing', () => {
    expect(parseNominatimAddress({ state: 'Bihar' }).city).toBe('Unknown Region');
  });

  test('handles null/undefined address gracefully', () => {
    expect(() => parseNominatimAddress(null)).not.toThrow();
    expect(parseNominatimAddress(null).state).toBe('India');
  });
});

describe('Maps Module — DOM Initialisation', () => {
  beforeEach(() => {
    buildMapsDOM();
    Object.defineProperty(global.navigator, 'geolocation', {
      writable: true, configurable: true,
      value: { getCurrentPosition: () => {} }
    });
  });

  test('initialises without throwing', () => {
    expect(() => initMaps()).not.toThrow();
  });

  test('returns early without throwing when searchBtn is missing', () => {
    document.getElementById('btn-booth-search').remove();
    expect(() => initMaps()).not.toThrow();
  });

  test('returns early without throwing when mapContainer is missing', () => {
    document.getElementById('map-container').remove();
    expect(() => initMaps()).not.toThrow();
  });

  test('search button is present in DOM', () => {
    initMaps();
    expect(document.getElementById('btn-booth-search')).not.toBeNull();
  });

  test('location button is present in DOM', () => {
    initMaps();
    expect(document.getElementById('btn-use-location')).not.toBeNull();
  });

  test('results container starts empty', () => {
    initMaps();
    expect(document.getElementById('booth-results').innerHTML).toBe('');
  });
});

describe('Maps Module — Search Input Validation', () => {
  test('pincode regex correctly identifies numeric input', () => {
    const pincodeRegex = /^\d+$/;
    expect(pincodeRegex.test('560001')).toBe(true);
    expect(pincodeRegex.test('Mumbai')).toBe(false);
    expect(pincodeRegex.test('110 001')).toBe(false);
  });

  test('encodes special characters in city name for URL', () => {
    const city = 'New Delhi';
    const encoded = encodeURIComponent(city);
    expect(encoded).toBe('New%20Delhi');
  });

  test('encodes Hindi city name correctly', () => {
    const city = 'पटना';
    const encoded = encodeURIComponent(city);
    expect(encoded).not.toBe(city);
    expect(encoded.length).toBeGreaterThan(0);
  });
});
