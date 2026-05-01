/**
 * @jest-environment jsdom
 * @file tests/data-loader.test.js
 * @description Comprehensive unit tests for the data-loader module.
 */

import { fetchJSON, CACHE_NAME } from '../modules/data-loader.js';
import { jest } from '@jest/globals';

// Replace the plain-function fetch mock from setup.js with a real jest.fn() for this suite
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true, status: 200,
      json: async () => ({ faqs: [], elections: [] }),
      clone: function() { return this; }
    })
  );
  global.caches = {
    _store: new Map(),
    open: jest.fn(() => {
      const store = new Map();
      return Promise.resolve({
        put:   jest.fn((url, res) => { store.set(url, res); return Promise.resolve(); }),
        match: jest.fn((url) => Promise.resolve(store.get(url) || null))
      });
    }),
    match: jest.fn(() => Promise.resolve(null)),
    keys:  jest.fn(() => Promise.resolve([]))
  };
});

afterEach(() => {
  jest.clearAllMocks();
  global.fetch.mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({ faqs: [], elections: [] }),
    clone: function() { return this; }
  });
  // Reset caches.open mock
  global.caches.open.mockImplementation(() => {
    const store = new Map();
    return Promise.resolve({
      put:   jest.fn((url, res) => { store.set(url, res); return Promise.resolve(); }),
      match: jest.fn((url) => Promise.resolve(store.get(url) || null))
    });
  });
  navigator.onLine = true;
});

describe('Data Loader — fetchJSON()', () => {
  // ── Input validation ──────────────────────────────────────────────────────
  describe('Input validation', () => {
    test('returns null and logs error for null URL', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await fetchJSON(null);
      expect(result).toBeNull();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('returns null for empty string URL', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await fetchJSON('');
      expect(result).toBeNull();
      spy.mockRestore();
    });

    test('returns null for non-string URL', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await fetchJSON(42);
      expect(result).toBeNull();
      spy.mockRestore();
    });
  });

  // ── Online (network-first) path ───────────────────────────────────────────
  describe('Online — network-first strategy', () => {
    beforeEach(() => {
      navigator.onLine = true;
    });

    test('fetches data from network when online', async () => {
      const mockData = { elections: [{ id: 'lok-sabha-2024' }] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData
      });

      const data = await fetchJSON('data/elections.json');
      expect(global.fetch).toHaveBeenCalledWith('data/elections.json', { cache: 'no-cache' });
      expect(data).toEqual(mockData);
    });

    test('writes successfully fetched data to cache', async () => {
      const mockData = { test: true };
      global.fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockData });

      await fetchJSON('data/test.json');

      const cache = await caches.open(CACHE_NAME);
      expect(cache.put).toHaveBeenCalled();
    });

    test('falls back to cache when network request fails (HTTP 404)', async () => {
      const cachedData = { fromCache: true };
      global.fetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });

      // Pre-populate cache mock
      const cache = await caches.open(CACHE_NAME);
      cache.match.mockResolvedValueOnce({ json: async () => cachedData });

      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const data = await fetchJSON('data/test.json');
      expect(data).toEqual(cachedData);
      spy.mockRestore();
    });

    test('falls back to cache when fetch throws (network error)', async () => {
      const cachedData = { fromCache: true };
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const cache = await caches.open(CACHE_NAME);
      cache.match.mockResolvedValueOnce({ json: async () => cachedData });

      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const data = await fetchJSON('data/test.json');
      expect(data).toEqual(cachedData);
      spy.mockRestore();
    });

    test('returns null when both network and cache fail', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      const cache = await caches.open(CACHE_NAME);
      cache.match.mockResolvedValueOnce(null);

      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const data = await fetchJSON('data/missing.json');
      expect(data).toBeNull();
      spy.mockRestore();
    });
  });

  // ── Offline (cache-first) path ────────────────────────────────────────────
  describe('Offline — cache-only strategy', () => {
    beforeEach(() => {
      navigator.onLine = false;
    });

    test('does NOT call fetch when offline', async () => {
      const cachedData = { fromCache: true };
      const cache = await caches.open(CACHE_NAME);
      cache.match.mockResolvedValueOnce({ json: async () => cachedData });

      await fetchJSON('data/test.json');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('returns cached data when offline', async () => {
      const cachedData = { faqs: [{ id: 1 }] };
      const cache = await caches.open(CACHE_NAME);
      cache.match.mockResolvedValueOnce({ json: async () => cachedData });

      const data = await fetchJSON('data/faq.json');
      expect(data).toEqual(cachedData);
    });

    test('returns null when offline and no cache exists', async () => {
      const cache = await caches.open(CACHE_NAME);
      cache.match.mockResolvedValueOnce(null);

      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const data = await fetchJSON('data/missing.json');
      expect(data).toBeNull();
      spy.mockRestore();
    });
  });
});
