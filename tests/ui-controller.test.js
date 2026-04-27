/**
 * @jest-environment jsdom
 */

import { showToast, showModal, setupTheme } from '../modules/ui-controller.js';

describe('UI Controller', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toast-container"></div>
      <button id="theme-toggle-btn"><span class="theme-icon"></span></button>
      <div id="modal-overlay" hidden>
        <h2 id="modal-title"></h2>
        <div id="modal-body"></div>
        <button id="modal-close-btn"></button>
      </div>
    `;
    localStorage.clear();
  });

  test('showToast creates a toast element', () => {
    showToast('Hello World', 'success', 100);
    const container = document.getElementById('toast-container');
    const toast = container.querySelector('.toast');
    
    expect(toast).not.toBeNull();
    expect(toast.textContent).toBe('Hello World');
    expect(toast.classList.contains('success')).toBe(true);
  });

  test('showModal displays the modal with correct content', () => {
    showModal('Test Title', '<p>Test Body</p>');
    
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    expect(overlay.hidden).toBe(false);
    expect(title.textContent).toBe('Test Title');
    expect(body.innerHTML).toBe('<p>Test Body</p>');
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('setupTheme applies default light theme', () => {
    setupTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
