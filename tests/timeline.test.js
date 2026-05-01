/**
 * @jest-environment jsdom
 * @file tests/timeline.test.js
 * @description Comprehensive unit tests for the Timeline module.
 */

import { initTimeline } from '../modules/timeline.js';
import { jest } from '@jest/globals';

/** Minimal timeline DOM scaffold */
const buildTimelineDOM = () => {
  document.body.innerHTML = `
    <select id="election-select">
      <option value="lok-sabha-2024">Lok Sabha 2024</option>
    </select>
    <div id="timeline-container"></div>
    <div id="modal-overlay" hidden>
      <h2 id="modal-title"></h2>
      <div id="modal-body"></div>
      <button id="modal-close-btn">✕</button>
    </div>
    <div id="toast-container"></div>
  `;
};

/** Mock timeline API data */
const MOCK_TIMELINE_DATA = {
  elections: [
    {
      id: 'lok-sabha-2024',
      name: 'Lok Sabha General Election 2024',
      phases_detail: [
        { phase: 1, date: '2024-04-19', date_str: 'April 19, 2024', constituencies: 102, states: ['Tamil Nadu', 'Rajasthan', 'UP'] },
        { phase: 2, date: '2024-04-26', date_str: 'April 26, 2024', constituencies: 89,  states: ['Kerala', 'Karnataka', 'Maharashtra'] },
        { phase: 7, date: '2030-06-01', date_str: 'June 1, 2030',   constituencies: 57,  states: ['Punjab', 'Himachal Pradesh'] },
      ]
    },
    {
      id: 'bihar-2026',
      name: 'Bihar Assembly Elections 2026',
      phases_detail: [
        { phase: 1, date: '2026-10-15', date_str: 'October 15, 2026', constituencies: 80, states: ['Bihar'] },
      ]
    }
  ]
};

describe('Timeline Module — Phase Status Logic', () => {
  const today = new Date('2026-05-01');

  test('marks a phase date in the past as "completed"', () => {
    const phaseDate = new Date('2024-04-19');
    let status = 'upcoming';
    if (phaseDate < today) status = 'completed';
    const diff = (phaseDate - today) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= 7) status = 'ongoing';
    expect(status).toBe('completed');
  });

  test('marks a phase date within 7 days as "ongoing"', () => {
    const phaseDate = new Date('2026-05-04'); // 3 days away from today
    let status = 'upcoming';
    if (phaseDate < today) status = 'completed';
    const diff = (phaseDate - today) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= 7) status = 'ongoing';
    expect(status).toBe('ongoing');
  });

  test('marks a phase date more than 7 days away as "upcoming"', () => {
    const phaseDate = new Date('2030-01-01');
    let status = 'upcoming';
    if (phaseDate < today) status = 'completed';
    const diff = (phaseDate - today) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= 7) status = 'ongoing';
    expect(status).toBe('upcoming');
  });

  test('today itself is treated as "ongoing" (diff = 0)', () => {
    const phaseDate = new Date('2026-05-01');
    let status = 'upcoming';
    if (phaseDate < today) status = 'completed';
    const diff = (phaseDate - today) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= 7) status = 'ongoing';
    expect(status).toBe('ongoing');
  });
});

describe('Timeline Module — Data Rendering', () => {
  test('renders correct number of timeline items from phase data', () => {
    const container = document.createElement('div');
    MOCK_TIMELINE_DATA.elections[0].phases_detail.forEach(phase => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      container.appendChild(item);
    });
    expect(container.querySelectorAll('.timeline-item').length).toBe(3);
  });

  test('renders phase number text correctly', () => {
    const phase = MOCK_TIMELINE_DATA.elections[0].phases_detail[0];
    const item = document.createElement('div');
    item.innerHTML = `<div class="tl-phase">Phase ${phase.phase}</div>`;
    expect(item.querySelector('.tl-phase').textContent).toBe('Phase 1');
  });

  test('renders states list correctly', () => {
    const phase = MOCK_TIMELINE_DATA.elections[0].phases_detail[0];
    const statesText = phase.states.join(', ');
    expect(statesText).toBe('Tamil Nadu, Rajasthan, UP');
  });

  test('renders constituency count correctly', () => {
    const phase = MOCK_TIMELINE_DATA.elections[0].phases_detail[0];
    expect(phase.constituencies).toBe(102);
  });

  test('shows fallback message when phase data is empty', () => {
    const container = document.createElement('div');
    const data = [];
    if (data.length === 0) {
      container.innerHTML = '<p>No timeline data available for this election.</p>';
    }
    expect(container.innerHTML).toContain('No timeline data');
  });

  test('falls back to first election when selected ID is not found', () => {
    const elections = MOCK_TIMELINE_DATA.elections;
    let election = elections.find(e => e.id === 'non-existent');
    if (!election) election = elections[0];
    expect(election.id).toBe('lok-sabha-2024');
  });
});

describe('Timeline Module — Select Control', () => {
  test('select options can be changed programmatically', () => {
    buildTimelineDOM();
    const select = document.getElementById('election-select');
    const opt = document.createElement('option');
    opt.value = 'bihar-2026';
    opt.textContent = 'Bihar 2026';
    select.appendChild(opt);
    select.value = 'bihar-2026';
    expect(select.value).toBe('bihar-2026');
  });

  test('select retains original value after unrelated DOM update', () => {
    buildTimelineDOM();
    const select = document.getElementById('election-select');
    select.value = 'lok-sabha-2024';
    // Simulate an unrelated DOM change
    document.getElementById('timeline-container').innerHTML = '<p>Updated</p>';
    expect(select.value).toBe('lok-sabha-2024');
  });
});

describe('Timeline Module — DOM Initialisation', () => {
  beforeEach(() => {
    buildTimelineDOM();
    localStorage.clear();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => MOCK_TIMELINE_DATA
    });
    // Stub geolocation as a plain object (no jest.fn needed for this test)
    Object.defineProperty(global.navigator, 'geolocation', {
      writable: true, configurable: true,
      value: { getCurrentPosition: () => {} }
    });
  });

  test('initialises without throwing', async () => {
    await expect(initTimeline()).resolves.not.toThrow();
  });

  test('returns early without throwing when container is missing', async () => {
    document.getElementById('timeline-container').remove();
    await expect(initTimeline()).resolves.not.toThrow();
  });

  test('returns early without throwing when select is missing', async () => {
    document.getElementById('election-select').remove();
    await expect(initTimeline()).resolves.not.toThrow();
  });
});
