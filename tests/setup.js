/**
 * @file tests/setup.js
 * @description Global test environment setup for ElectionIQ Jest suite.
 * Uses only native JavaScript — no jest.fn() in setupFilesAfterEnv.
 * Mocks are established in individual test files using jest.fn() where jest IS available.
 */

// ── Fetch Mock (simple function-based) ────────────────────────────────────
const makeFetchMock = () => {
  let _impl = () =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ faqs: [], elections: [], phases: [], questions: [] }),
      clone: function() { return this; }
    });

  const fn = (...args) => _impl(...args);
  fn.mockResolvedValue = (val) => { _impl = () => Promise.resolve(val); };
  fn.mockRejectedValue = (err) => { _impl = () => Promise.reject(err); };
  fn.mockResolvedValueOnce = (val) => {
    const original = _impl;
    _impl = () => { _impl = original; return Promise.resolve(val); };
  };
  fn.mockRejectedValueOnce = (err) => {
    const original = _impl;
    _impl = () => { _impl = original; return Promise.reject(err); };
  };
  fn.mockImplementation = (newImpl) => { _impl = newImpl; };
  fn._reset = () => {
    _impl = () =>
      Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve({ faqs: [], elections: [], phases: [], questions: [] }),
        clone: function() { return this; }
      });
  };
  return fn;
};

global.fetch = makeFetchMock();

// ── Cache API Mock ─────────────────────────────────────────────────────────
const _cacheStore = new Map();

const makeCache = () => ({
  _store: _cacheStore,
  put:    (url, res) => { _cacheStore.set(url, res); return Promise.resolve(); },
  match:  (url) => Promise.resolve(_cacheStore.get(url) || null),
  delete: (url) => { _cacheStore.delete(url); return Promise.resolve(true); },
});

// Individual caches can be overridden in tests by re-assigning global.caches.open
global.caches = {
  _store: _cacheStore,
  open:   (_name) => Promise.resolve(makeCache()),
  match:  () => Promise.resolve(null),
  keys:   () => Promise.resolve([])
};

// ── Speech APIs ────────────────────────────────────────────────────────────
global.SpeechRecognition = function() {
  return { start() {}, stop() {}, abort() {} };
};
global.webkitSpeechRecognition = global.SpeechRecognition;
global.speechSynthesis = {
  speak() {}, cancel() {}, pause() {}, resume() {}
};
global.SpeechSynthesisUtterance = function(text) { this.text = text; };

// ── Navigator ─────────────────────────────────────────────────────────────
Object.defineProperty(global.navigator, 'onLine', {
  writable: true, configurable: true, value: true
});
Object.defineProperty(global.navigator, 'geolocation', {
  writable: true, configurable: true,
  value: { getCurrentPosition: () => {} }
});

// ── LocalStorage ──────────────────────────────────────────────────────────
let _lsStore = {};
const localStorageMock = {
  getItem:    (k) => Object.prototype.hasOwnProperty.call(_lsStore, k) ? _lsStore[k] : null,
  setItem:    (k, v) => { _lsStore[k] = String(v); },
  removeItem: (k) => { delete _lsStore[k]; },
  clear:      () => { _lsStore = {}; }
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// ── window.ENV ────────────────────────────────────────────────────────────
global.window = global.window || {};
global.window.ENV = {
  GEMINI_API_KEY:           'TEST_KEY_NOT_REAL',
  GOOGLE_TRANSLATE_API_KEY: 'TEST_KEY_NOT_REAL',
  GOOGLE_MAPS_API_KEY:      'TEST_KEY_NOT_REAL',
  APP_ENV:                  'test'
};
globalThis.window = global.window;
global.window.navigateTo = () => {};

// ── Reset state before each test ──────────────────────────────────────────
beforeEach(() => {
  _cacheStore.clear();
  _lsStore = {};
  navigator.onLine = true;
  // Only reset fetch if it's our plain mock (not a jest.fn from a test file)
  if (typeof global.fetch._reset === 'function') {
    global.fetch._reset();
  }
  // Restore caches.open to default each test (only if not overridden by jest.fn)
  if (!global.caches.open.mock) {
    global.caches.open = (_name) => Promise.resolve(makeCache());
  }
});
