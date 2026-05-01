/**
 * @jest-environment jsdom
 * @file tests/ui-controller.test.js
 * @description Comprehensive unit tests for the UI Controller module.
 */

import { showToast, showModal, setupTheme } from '../modules/ui-controller.js';

/** Builds the minimal DOM needed by UI controller */
const buildDOM = () => {
  document.body.innerHTML = `
    <div id="toast-container"></div>
    <button id="theme-toggle-btn"><span class="theme-icon">🌙</span></button>
    <div id="modal-overlay" hidden>
      <h2 id="modal-title"></h2>
      <div id="modal-body"></div>
      <button id="modal-close-btn">✕</button>
    </div>
  `;
};

describe('UI Controller — showToast()', () => {
  beforeEach(buildDOM);

  test('creates a toast element in the container', () => {
    showToast('Hello World', 'success', 100);
    const toast = document.querySelector('#toast-container .toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toBe('Hello World');
  });

  test('applies the correct type class to the toast', () => {
    showToast('Error!', 'error', 100);
    const toast = document.querySelector('#toast-container .toast');
    expect(toast.classList.contains('error')).toBe(true);
  });

  test('applies "info" class for default type', () => {
    showToast('Info message');
    const toast = document.querySelector('#toast-container .toast');
    expect(toast.classList.contains('info')).toBe(true);
  });

  test('applies warning type class correctly', () => {
    showToast('Warning!', 'warning', 100);
    const toast = document.querySelector('#toast-container .toast');
    expect(toast.classList.contains('warning')).toBe(true);
  });

  test('toast has role="alert" for accessibility', () => {
    showToast('Accessible toast', 'info', 100);
    const toast = document.querySelector('#toast-container .toast');
    expect(toast.getAttribute('role')).toBe('alert');
  });

  test('multiple toasts can coexist', () => {
    showToast('Toast 1', 'info', 100);
    showToast('Toast 2', 'success', 100);
    const toasts = document.querySelectorAll('#toast-container .toast');
    expect(toasts.length).toBe(2);
  });

  test('does nothing gracefully when container is absent', () => {
    document.getElementById('toast-container').remove();
    expect(() => showToast('No container', 'info')).not.toThrow();
  });
});

describe('UI Controller — showModal()', () => {
  beforeEach(buildDOM);

  test('removes hidden attribute from the overlay', () => {
    showModal('Test Title', '<p>Body</p>');
    expect(document.getElementById('modal-overlay').hidden).toBe(false);
  });

  test('sets the modal title correctly', () => {
    showModal('Election Results', '<p>data</p>');
    expect(document.getElementById('modal-title').textContent).toBe('Election Results');
  });

  test('sets the modal body innerHTML correctly', () => {
    showModal('Title', '<p>Test Body</p>');
    expect(document.getElementById('modal-body').innerHTML).toBe('<p>Test Body</p>');
  });

  test('prevents background scroll by setting overflow:hidden', () => {
    showModal('Title', 'Body');
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('handles empty title gracefully', () => {
    expect(() => showModal('', '<p>Body</p>')).not.toThrow();
    expect(document.getElementById('modal-title').textContent).toBe('');
  });

  test('handles empty body gracefully', () => {
    expect(() => showModal('Title', '')).not.toThrow();
  });

  test('does nothing when modal overlay element is missing', () => {
    document.getElementById('modal-overlay').remove();
    expect(() => showModal('Title', 'Body')).not.toThrow();
  });
});

describe('UI Controller — setupTheme()', () => {
  beforeEach(() => {
    buildDOM();
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  test('applies light theme by default when no preference is saved', () => {
    setupTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('restores dark theme from localStorage', () => {
    localStorage.setItem('electioniq-theme', 'dark');
    setupTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('toggles from light to dark on button click', () => {
    setupTheme();
    document.getElementById('theme-toggle-btn').click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('toggles from dark back to light on second click', () => {
    localStorage.setItem('electioniq-theme', 'dark');
    setupTheme();
    document.getElementById('theme-toggle-btn').click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('updates the theme icon on toggle', () => {
    setupTheme(); // light theme → icon should be 🌙
    const icon = document.querySelector('.theme-icon');
    expect(icon.textContent).toBe('🌙');
    document.getElementById('theme-toggle-btn').click(); // → dark
    expect(icon.textContent).toBe('☀️');
  });

  test('persists theme choice to localStorage', () => {
    setupTheme();
    document.getElementById('theme-toggle-btn').click();
    expect(localStorage.getItem('electioniq-theme')).toBe('dark');
  });

  test('does nothing gracefully when button is missing', () => {
    document.getElementById('theme-toggle-btn').remove();
    expect(() => setupTheme()).not.toThrow();
  });
});
