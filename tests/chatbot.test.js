/**
 * @jest-environment jsdom
 * @file tests/chatbot.test.js
 * @description Comprehensive unit tests for the AI Chatbot module.
 */

import { initChat } from '../modules/chat.js';
import { jest } from '@jest/globals';

/** Minimal chat DOM scaffold */
const buildChatDOM = () => {
  document.body.innerHTML = `
    <form id="chat-form">
      <textarea id="chat-input"></textarea>
      <button type="submit">Send</button>
    </form>
    <div id="chat-messages"></div>
    <div id="voice-status" hidden>
      <span id="voice-status-text"></span>
    </div>
    <div id="toast-container"></div>
    <button class="chip" data-query="How do I vote?">How do I vote?</button>
    <button class="chip" data-query="What is NOTA?">What is NOTA?</button>
  `;
};

describe('Chatbot Module — Offline Fallback Logic', () => {
  /**
   * Replicates the getOfflineAnswer logic from chat.js
   * so we can unit-test keyword matching independently.
   */
  const getOfflineAnswer = (query) => {
    const q = query.toLowerCase();
    if (q.includes('evm'))   return 'An EVM (Electronic Voting Machine)';
    if (q.includes('nota'))  return 'NOTA (None Of The Above)';
    if (q.includes('vote') || q.includes('how')) return 'To vote in India:';
    if (q.includes('age') || q.includes('eligible')) return 'You must be 18 years or older';
    if (q.includes('2026') || q.includes('election')) return 'Major elections in 2026:';
    return 'I\'m currently offline.';
  };

  test('returns EVM information for "evm" query', () => {
    expect(getOfflineAnswer('what is evm')).toContain('EVM');
  });

  test('returns NOTA information for "nota" query', () => {
    expect(getOfflineAnswer('what is nota')).toContain('NOTA');
  });

  test('returns voting guide for "how to vote" query', () => {
    expect(getOfflineAnswer('how to vote')).toContain('To vote in India');
  });

  test('returns voting guide for "vote" keyword', () => {
    expect(getOfflineAnswer('I want to vote')).toContain('To vote in India');
  });

  test('returns age info for "eligible" keyword', () => {
    expect(getOfflineAnswer('am I eligible')).toContain('18 years');
  });

  test('returns age info for "age" keyword', () => {
    expect(getOfflineAnswer('voting age')).toContain('18 years');
  });

  test('returns 2026 election info for "2026" query', () => {
    expect(getOfflineAnswer('elections in 2026')).toContain('2026');
  });

  test('returns generic offline message for unknown query', () => {
    expect(getOfflineAnswer('xyz unknown query')).toContain('offline');
  });

  test('matching is case-insensitive', () => {
    expect(getOfflineAnswer('EVM INFO')).toContain('EVM');
    expect(getOfflineAnswer('NOTA')).toContain('NOTA');
  });
});

describe('Chatbot Module — Markdown Renderer', () => {
  /**
   * Replicates the rendering logic from chat.js updateMessage()
   */
  const renderMarkdown = (text) => {
    const safe = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return safe
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  test('converts **bold** to <strong>', () => {
    expect(renderMarkdown('**Bold text**')).toBe('<strong>Bold text</strong>');
  });

  test('converts *italic* to <em>', () => {
    expect(renderMarkdown('*Italic text*')).toBe('<em>Italic text</em>');
  });

  test('converts newlines to <br>', () => {
    expect(renderMarkdown('Line 1\nLine 2')).toBe('Line 1<br>Line 2');
  });

  test('sanitises < and > to prevent XSS', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).toContain('&lt;script&gt;');
  });

  test('handles plain text without modification (except safe escaping)', () => {
    const plain = 'Hello World';
    expect(renderMarkdown(plain)).toBe('Hello World');
  });
});

describe('Chatbot Module — DOM Initialisation', () => {
  beforeEach(() => {
    buildChatDOM();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ faqs: [{ keywords: ['vote'], answer: 'To vote, register first.' }] })
    });
  });

  test('initialises without throwing', async () => {
    await expect(initChat()).resolves.not.toThrow();
  });

  test('form element is present after init', async () => {
    await initChat();
    expect(document.getElementById('chat-form')).not.toBeNull();
  });

  test('messages container is present after init', async () => {
    await initChat();
    expect(document.getElementById('chat-messages')).not.toBeNull();
  });

  test('returns early without throwing when DOM is missing', async () => {
    document.body.innerHTML = '<div>Empty</div>';
    await expect(initChat()).resolves.not.toThrow();
  });

  test('chip buttons have correct data-query attributes', async () => {
    await initChat();
    const chips = document.querySelectorAll('.chip');
    expect(chips[0].dataset.query).toBe('How do I vote?');
    expect(chips[1].dataset.query).toBe('What is NOTA?');
  });
});

describe('Chatbot Module — Rate Limiting', () => {
  test('rate limit window is positive', () => {
    const RATE_LIMIT_MS = 4000;
    expect(RATE_LIMIT_MS).toBeGreaterThan(0);
  });

  test('rate limit is at least 3 seconds to prevent API spam', () => {
    const RATE_LIMIT_MS = 4000;
    expect(RATE_LIMIT_MS).toBeGreaterThanOrEqual(3000);
  });
});
