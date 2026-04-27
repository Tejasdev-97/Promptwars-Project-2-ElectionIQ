/**
 * @jest-environment jsdom
 */

import { fetchJSON } from '../modules/data-loader.js';
import { jest } from '@jest/globals';

describe('Data Loader', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    global.caches = {
      open: jest.fn().mockResolvedValue({
        put: jest.fn(),
        match: jest.fn()
      })
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should fetch data from network when online', async () => {
    const mockData = { test: 'data' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    // Mock navigator.onLine
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    const data = await fetchJSON('test.json');
    expect(global.fetch).toHaveBeenCalledWith('test.json', { cache: 'no-cache' });
    expect(data).toEqual(mockData);
  });

  test('should fallback to cache when offline', async () => {
    const cachedData = { fromCache: true };
    
    global.caches.open = jest.fn().mockResolvedValue({
      match: jest.fn().mockResolvedValue({
        json: async () => cachedData
      })
    });

    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    const data = await fetchJSON('test.json');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(data).toEqual(cachedData);
  });
});
