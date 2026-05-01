/**
 * @jest-environment jsdom
 * @file tests/accessibility.test.js
 * @description Comprehensive unit tests for the Accessibility module.
 */

import { initAccessibility } from '../modules/accessibility.js';

const buildA11yDOM = () => {
  document.body.innerHTML = `
    <button id="a11y-toggle" aria-label="Accessibility Menu">♿</button>
    <div id="a11y-panel" hidden>
      <h3>Accessibility</h3>
      <label><input type="checkbox" id="a11y-high-contrast" /> High Contrast</label>
      <label><input type="checkbox" id="a11y-large-font" /> Large Font</label>
      <label><input type="checkbox" id="a11y-dyslexia" /> Dyslexia Font</label>
      <label><input type="checkbox" id="a11y-reduce-motion" /> Reduce Motion</label>
    </div>
  `;
  // Ensure body classes are clean
  document.body.className = '';
  localStorage.clear();
};

describe('Accessibility Module — Panel Toggle', () => {
  beforeEach(buildA11yDOM);

  test('initialises without throwing', () => {
    expect(() => initAccessibility()).not.toThrow();
  });

  test('panel is hidden by default', () => {
    initAccessibility();
    expect(document.getElementById('a11y-panel').hasAttribute('hidden')).toBe(true);
  });

  test('clicking toggle opens the panel (removes hidden)', () => {
    initAccessibility();
    document.getElementById('a11y-toggle').click();
    expect(document.getElementById('a11y-panel').hasAttribute('hidden')).toBe(false);
  });

  test('clicking toggle again closes the panel (adds hidden)', () => {
    initAccessibility();
    const btn = document.getElementById('a11y-toggle');
    btn.click(); // open
    btn.click(); // close
    expect(document.getElementById('a11y-panel').hasAttribute('hidden')).toBe(true);
  });

  test('returns early without throwing when toggle button is missing', () => {
    document.getElementById('a11y-toggle').remove();
    expect(() => initAccessibility()).not.toThrow();
  });

  test('returns early without throwing when panel is missing', () => {
    document.getElementById('a11y-panel').remove();
    expect(() => initAccessibility()).not.toThrow();
  });
});

describe('Accessibility Module — Feature Toggles', () => {
  beforeEach(buildA11yDOM);

  test('checking High Contrast adds "a11y-high-contrast" class to body', () => {
    initAccessibility();
    const cb = document.getElementById('a11y-high-contrast');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    expect(document.body.classList.contains('a11y-high-contrast')).toBe(true);
  });

  test('unchecking High Contrast removes "a11y-high-contrast" class from body', () => {
    initAccessibility();
    const cb = document.getElementById('a11y-high-contrast');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    cb.checked = false;
    cb.dispatchEvent(new Event('change'));
    expect(document.body.classList.contains('a11y-high-contrast')).toBe(false);
  });

  test('checking Large Font adds "a11y-large-font" class to body', () => {
    initAccessibility();
    const cb = document.getElementById('a11y-large-font');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    expect(document.body.classList.contains('a11y-large-font')).toBe(true);
  });

  test('checking Dyslexia Font adds "a11y-dyslexia" class to body', () => {
    initAccessibility();
    const cb = document.getElementById('a11y-dyslexia');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    expect(document.body.classList.contains('a11y-dyslexia')).toBe(true);
  });

  test('checking Reduce Motion adds "a11y-reduce-motion" class to body', () => {
    initAccessibility();
    const cb = document.getElementById('a11y-reduce-motion');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    expect(document.body.classList.contains('a11y-reduce-motion')).toBe(true);
  });
});

describe('Accessibility Module — localStorage Persistence', () => {
  beforeEach(buildA11yDOM);

  test('saves preference to localStorage when toggled on', () => {
    initAccessibility();
    const cb = document.getElementById('a11y-large-font');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    expect(localStorage.getItem('electioniq-a11y-large-font')).toBe('true');
  });

  test('saves false to localStorage when toggled off', () => {
    initAccessibility();
    const cb = document.getElementById('a11y-large-font');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    cb.checked = false;
    cb.dispatchEvent(new Event('change'));
    expect(localStorage.getItem('electioniq-a11y-large-font')).toBe('false');
  });

  test('restores saved preference from localStorage on init', () => {
    localStorage.setItem('electioniq-a11y-high-contrast', 'true');
    initAccessibility();
    expect(document.getElementById('a11y-high-contrast').checked).toBe(true);
    expect(document.body.classList.contains('a11y-high-contrast')).toBe(true);
  });

  test('does not apply class when localStorage value is false', () => {
    localStorage.setItem('electioniq-a11y-high-contrast', 'false');
    initAccessibility();
    expect(document.body.classList.contains('a11y-high-contrast')).toBe(false);
  });
});
