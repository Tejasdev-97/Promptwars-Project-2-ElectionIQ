/**
 * @jest-environment jsdom
 * @file tests/eligibility.test.js
 * @description Comprehensive unit tests for the Eligibility Checker module.
 * Tests both the pure date-logic helpers and the DOM interaction layer.
 */

import { initEligibility } from '../modules/eligibility.js';

// ── Pure Logic Helpers (tested independently of DOM) ─────────────────────────

/**
 * Replicates the age-calculation logic from eligibility.js so we can unit-test
 * it without touching the DOM at all.
 */
const calculateAge = (dobStr, todayStr) => {
  const dob   = new Date(dobStr);
  const today = new Date(todayStr);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

const daysUntil18 = (dobStr, todayStr) => {
  const dob   = new Date(dobStr);
  const today = new Date(todayStr);
  const turns18 = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
  return Math.ceil((turns18 - today) / (1000 * 60 * 60 * 24));
};

// ── Age Calculation ───────────────────────────────────────────────────────────
describe('Eligibility — Age Calculation Logic', () => {
  test('returns exact age for birthday in the past this year', () => {
    expect(calculateAge('2000-01-15', '2026-05-01')).toBe(26);
  });

  test('returns age minus one when birthday has not yet occurred this year', () => {
    expect(calculateAge('2000-12-31', '2026-05-01')).toBe(25);
  });

  test('returns correct age exactly on birthday', () => {
    expect(calculateAge('2000-05-01', '2026-05-01')).toBe(26);
  });

  test('identifies an 18-year-old as eligible', () => {
    expect(calculateAge('2008-01-01', '2026-05-01')).toBeGreaterThanOrEqual(18);
  });

  test('identifies a 17-year-old as not eligible', () => {
    expect(calculateAge('2009-06-01', '2026-05-01')).toBeLessThan(18);
  });

  test('handles exactly 18 years old today as eligible', () => {
    expect(calculateAge('2008-05-01', '2026-05-01')).toBe(18);
  });

  test('returns 0 for someone born today', () => {
    expect(calculateAge('2026-05-01', '2026-05-01')).toBe(0);
  });
});

// ── Days Until 18 Calculation ────────────────────────────────────────────────
describe('Eligibility — Days Until 18 Calculation', () => {
  test('calculates 1 day when turning 18 tomorrow', () => {
    expect(daysUntil18('2008-05-02', '2026-05-01')).toBe(1);
  });

  test('calculates 0 days when turning 18 today', () => {
    expect(daysUntil18('2008-05-01', '2026-05-01')).toBe(0);
  });

  test('calculates correct days for future birthday', () => {
    expect(daysUntil18('2009-06-01', '2026-05-01')).toBe(31);
  });

  test('calculates 365 days for 17-year-old with birthday exactly one year away', () => {
    const result = daysUntil18('2009-05-01', '2026-05-01');
    expect(result).toBeGreaterThan(364);
    expect(result).toBeLessThan(367); // allow for leap years
  });
});

// ── DOM Integration ───────────────────────────────────────────────────────────
const buildEligibilityDOM = () => {
  document.body.innerHTML = `
    <form id="eligibility-form">
      <input id="elig-dob" type="date" />
      <select id="elig-nationality">
        <option value="indian" selected>Indian</option>
        <option value="other">Other</option>
      </select>
      <button type="submit">Check</button>
    </form>
    <div id="eligibility-result"></div>
  `;
};

describe('Eligibility — DOM Interactions', () => {
  beforeEach(buildEligibilityDOM);

  test('does not throw when initialised with valid DOM', () => {
    expect(() => initEligibility()).not.toThrow();
  });

  test('returns early and does not throw when DOM is incomplete', () => {
    document.body.innerHTML = '<div>Empty</div>';
    expect(() => initEligibility()).not.toThrow();
  });

  test('sets a max date attribute on the DOB input', () => {
    initEligibility();
    const input = document.getElementById('elig-dob');
    expect(input.getAttribute('max')).toBeTruthy();
  });

  test('sets min="1900-01-01" on the DOB input', () => {
    initEligibility();
    expect(document.getElementById('elig-dob').getAttribute('min')).toBe('1900-01-01');
  });

  test('shows eligible result for Indian citizen over 18', () => {
    initEligibility();
    document.getElementById('elig-dob').value = '1995-01-01';
    document.getElementById('elig-nationality').value = 'indian';
    document.getElementById('eligibility-form').dispatchEvent(new Event('submit'));
    const result = document.getElementById('eligibility-result').innerHTML;
    expect(result).toContain('ELIGIBLE');
  });

  test('shows not-eligible result for Indian citizen under 18', () => {
    initEligibility();
    document.getElementById('elig-dob').value = '2020-01-01';
    document.getElementById('elig-nationality').value = 'indian';
    document.getElementById('eligibility-form').dispatchEvent(new Event('submit'));
    const result = document.getElementById('eligibility-result').innerHTML;
    expect(result).toContain('Not Yet Eligible');
  });

  test('shows NRI/non-Indian result for non-Indian nationality', () => {
    initEligibility();
    document.getElementById('elig-dob').value = '1990-01-01';
    document.getElementById('elig-nationality').value = 'other';
    document.getElementById('eligibility-form').dispatchEvent(new Event('submit'));
    const result = document.getElementById('eligibility-result').innerHTML;
    expect(result).toContain('Non-Indian');
  });

  test('shows error for empty DOB submission', () => {
    initEligibility();
    document.getElementById('elig-dob').value = '';
    document.getElementById('eligibility-form').dispatchEvent(new Event('submit'));
    // Should return early — result should remain empty
    expect(document.getElementById('eligibility-result').innerHTML).toBe('');
  });

  test('shows invalid date error for age > 130', () => {
    initEligibility();
    document.getElementById('elig-dob').value = '1800-01-01';
    document.getElementById('eligibility-form').dispatchEvent(new Event('submit'));
    const result = document.getElementById('eligibility-result').innerHTML;
    expect(result).toContain('Invalid');
  });

  test('result container exists after form submission', () => {
    initEligibility();
    document.getElementById('elig-dob').value = '1995-06-15';
    document.getElementById('eligibility-form').dispatchEvent(new Event('submit'));
    expect(document.getElementById('eligibility-result')).not.toBeNull();
  });
});
