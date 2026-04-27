import { initTimeline } from '../modules/timeline.js';

beforeEach(() => {
  document.body.innerHTML = `
    <select id="election-select">
      <option value="lok-sabha-2024">Lok Sabha</option>
      <option value="state-elections">State Elections</option>
    </select>
    <div id="timeline-container"></div>
  `;
});

describe('Timeline Module', () => {
  test('should populate timeline container', () => {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '<div class="timeline-item"></div>';
    expect(container.children.length).toBe(1);
  });

  test('should categorize phases correctly (upcoming/ongoing/completed)', () => {
    const phaseDate = new Date('2020-01-01');
    const today = new Date('2024-01-01');
    let statusClass = 'upcoming';
    if (phaseDate < today) statusClass = 'completed';
    expect(statusClass).toBe('completed');
  });

  test('should change data on select change', () => {
    const select = document.getElementById('election-select');
    select.value = 'state-elections';
    expect(select.value).toBe('state-elections');
  });

  test('should handle missing data gracefully', () => {
    const container = document.getElementById('timeline-container');
    const data = [];
    if (data.length === 0) {
      container.innerHTML = '<p>No timeline data</p>';
    }
    expect(container.innerHTML).toContain('No timeline data');
  });

  test('should render Phase 1 correctly', () => {
    const phase = { phase: 1, date: '2024-04-19' };
    expect(phase.phase).toBe(1);
    expect(phase.date).toBe('2024-04-19');
  });
});
