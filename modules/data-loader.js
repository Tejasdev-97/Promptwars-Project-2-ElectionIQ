/**
 * @module data-loader
 * @description Centralized data loading utility with network-first, cache fallback strategy.
 * Respects navigator.onLine — when offline it reads from cache without attempting a network call.
 */

import { showToast } from './ui-controller.js';

/** @constant {string} Cache namespace — bump version when data schema changes */
export const CACHE_NAME = 'electioniq-data-v4';

/**
 * Fetches JSON data using a network-first strategy.
 * When the browser is offline it skips the network call entirely and reads from cache.
 *
 * @param {string} url - Relative or absolute URL of the JSON resource
 * @returns {Promise<Object|null>} Parsed JSON object, or null on total failure
 */
export const fetchJSON = async (url) => {
  if (!url || typeof url !== 'string') {
    console.error('[data-loader] Invalid URL provided:', url);
    return null;
  }

  // ── Offline path: read from cache, never hit the network ─────────────────
  if (!navigator.onLine) {
    return _readFromCache(url);
  }

  // ── Online path: network first ────────────────────────────────────────────
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);

    const data = await response.json();

    // Write to cache in the background (non-blocking)
    _writeToCache(url, data);

    return data;
  } catch (networkError) {
    console.warn(`[data-loader] Network fetch failed for ${url}:`, networkError.message);

    // Network failed but we might have a cached copy
    const cached = await _readFromCache(url);
    if (cached) {
      showToast('You are offline — showing cached data.', 'warning');
      return cached;
    }

    console.error(`[data-loader] No cache found for ${url}`);
    showToast('Could not load data. Please check your connection.', 'error');
    return null;
  }
};

/**
 * Reads a cached JSON response for a given URL.
 * @param {string} url
 * @returns {Promise<Object|null>}
 */
const _readFromCache = async (url) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) return await cached.json();
  } catch (err) {
    console.warn('[data-loader] Cache read failed:', err.message);
  }
  return null;
};

/**
 * Writes a JSON object to the cache for a given URL (fire-and-forget).
 * @param {string} url
 * @param {Object} data
 */
const _writeToCache = async (url, data) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    }));
  } catch (err) {
    console.warn('[data-loader] Cache write failed:', err.message);
  }
};
