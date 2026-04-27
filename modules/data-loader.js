/**
 * @module data-loader
 * @description Centralized data loading utility with offline fallback.
 */

import { showToast } from './ui-controller.js';

const CACHE_NAME = 'electioniq-data-v3';

/**
 * Fetches JSON data — network first, cache fallback.
 * @param {string} url - URL of the JSON file
 * @returns {Promise<Object>} Parsed JSON data
 */
export const fetchJSON = async (url) => {
  try {
    // Always try network first (navigator.onLine can be unreliable on localhost)
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Update cache in background
    try {
      const cache = await caches.open(CACHE_NAME);
      cache.put(url, new Response(JSON.stringify(data)));
    } catch (_) { /* cache write failing is non-critical */ }

    return data;
  } catch (networkError) {
    // Fallback: try cache
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) return await cached.json();
    } catch (_) { /* ignore */ }

    console.error(`[data-loader] Failed to load ${url}:`, networkError);
    showToast(`Could not load data. Please refresh.`, 'error');
    return null;
  }
};
