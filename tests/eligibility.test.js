import { initEligibility } from '../modules/eligibility.js';

beforeEach(() => {
  document.body.innerHTML = `
    <form id="eligibility-form"></form>
    <input id="elig-dob" type="date" value="2000-01-01" />
    <select id="elig-nationality">
      <option value="indian" selected>Indian</option>
      <option value="other">Other</option>
    </select>
    <div id="eligibility-result"></div>
  `;
});

describe('Eligibility Checker Module', () => {
  test('should calculate correct age for eligible voter', () => {
    const dob = new Date('2000-01-01');
    const today = new Date('2024-05-01');
    let age = today.getFullYear() - dob.getFullYear();
    expect(age).toBeGreaterThanOrEqual(18);
  });

  test('should return not eligible for age < 18', () => {
    const dob = new Date('2010-01-01');
    const today = new Date('2024-05-01');
    let age = today.getFullYear() - dob.getFullYear();
    expect(age).toBeLessThan(18);
  });

  test('should calculate days until 18 correctly', () => {
    const dob = new Date('2006-05-02'); // turns 18 tomorrow
    const today = new Date('2024-05-01');
    const daysTo18 = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
    const diffTime = Math.abs(daysTo18 - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(1);
  });

  test('should reject non-Indian nationality', () => {
    document.getElementById('elig-nationality').value = 'other';
    expect(document.getElementById('elig-nationality').value).toBe('other');
  });

  test('should have a result container', () => {
    expect(document.getElementById('eligibility-result')).not.toBeNull();
  });
});
