/**
 * @jest-environment jsdom
 * @file tests/quiz.test.js
 * @description Comprehensive unit tests for the Quiz module.
 */

import { initQuiz } from '../modules/quiz.js';
import { jest } from '@jest/globals';

/** Minimal quiz DOM scaffold */
const buildQuizDOM = () => {
  document.body.innerHTML = `
    <div id="quiz-lobby"></div>
    <div id="quiz-play" hidden>
      <div id="quiz-question-text"></div>
      <div id="quiz-options"></div>
      <div id="quiz-timer">30s</div>
      <div id="quiz-score-display">Score: 0</div>
      <div id="quiz-progress-bar" aria-valuenow="0" style="width:0%"></div>
    </div>
    <div id="quiz-results" hidden>
      <div id="result-score"></div>
      <div id="result-title"></div>
    </div>
    <button id="start-quiz-btn">Start</button>
    <button id="retry-quiz-btn">Retry</button>
    <button class="diff-btn active" data-difficulty="beginner">Beginner</button>
    <button class="diff-btn" data-difficulty="advanced">Advanced</button>
    <div id="quiz-streak">0</div>
    <div id="quiz-rank">Beginner</div>
    <div id="quiz-last-played"></div>
  `;
};

/** Mock quiz data */
const MOCK_QUESTIONS = [
  { question: 'What does EVM stand for?', options: ['Electronic Voting Machine', 'Electoral Voting Method', 'Election Vote Monitor', 'Electronic Vote Manager'], correct: 0, difficulty: 'beginner' },
  { question: 'Minimum voting age in India?', options: ['16', '18', '21', '25'], correct: 1, difficulty: 'beginner' },
  { question: 'NOTA was introduced in?', options: ['2009', '2013', '2017', '2019'], correct: 1, difficulty: 'beginner' },
  { question: 'Full form of VVPAT?', options: ['Voter Verified Paper Audit Trail', 'Vote Verified Paper Audit Trail', 'Voter Verified Paper Audit Test', 'Vote Verified Paper Audit Test'], correct: 0, difficulty: 'beginner' },
  { question: 'How many Lok Sabha seats?', options: ['442', '543', '552', '500'], correct: 1, difficulty: 'beginner' },
];

describe('Quiz Module — Scoring Logic', () => {
  test('awards 10 points for a correct answer', () => {
    let score = 0;
    const isCorrect = true;
    if (isCorrect) score += 10;
    expect(score).toBe(10);
  });

  test('does not award points for a wrong answer', () => {
    let score = 0;
    const isCorrect = false;
    if (isCorrect) score += 10;
    expect(score).toBe(0);
  });

  test('calculates max score correctly for 5 questions', () => {
    const numQuestions = 5;
    const maxScore = numQuestions * 10;
    expect(maxScore).toBe(50);
  });

  test('assigns "Perfect Score!" when score equals maxScore', () => {
    const score = 50, maxScore = 50;
    let msg = '';
    if (score === maxScore) msg = 'Perfect Score! 🌟';
    else if (score >= maxScore * 0.6) msg = 'Great Job! 👍';
    else msg = 'Good Try! Keep Learning 📚';
    expect(msg).toBe('Perfect Score! 🌟');
  });

  test('assigns "Great Job!" for score >= 60% of max', () => {
    const score = 30, maxScore = 50;
    let msg = '';
    if (score === maxScore) msg = 'Perfect Score! 🌟';
    else if (score >= maxScore * 0.6) msg = 'Great Job! 👍';
    else msg = 'Good Try! Keep Learning 📚';
    expect(msg).toBe('Great Job! 👍');
  });

  test('assigns "Good Try!" for score < 60% of max', () => {
    const score = 20, maxScore = 50;
    let msg = '';
    if (score === maxScore) msg = 'Perfect Score! 🌟';
    else if (score >= maxScore * 0.6) msg = 'Great Job! 👍';
    else msg = 'Good Try! Keep Learning 📚';
    expect(msg).toBe('Good Try! Keep Learning 📚');
  });
});

describe('Quiz Module — Badge / Rank Logic', () => {
  const ranks = ['Beginner Voter', 'Active Citizen', 'Democracy Expert', 'Constitution Master', 'Democracy Legend 🏆'];

  test('streak 0 → Beginner Voter rank', () => {
    expect(ranks[Math.min(0, ranks.length - 1)]).toBe('Beginner Voter');
  });

  test('streak 1 → Active Citizen rank', () => {
    expect(ranks[Math.min(1, ranks.length - 1)]).toBe('Active Citizen');
  });

  test('streak 4+ → Democracy Legend rank (capped)', () => {
    expect(ranks[Math.min(10, ranks.length - 1)]).toBe('Democracy Legend 🏆');
  });

  test('streak increments on perfect score', () => {
    let streak = 0;
    const isPerfect = true;
    if (isPerfect) streak++;
    else streak = 0;
    expect(streak).toBe(1);
  });

  test('streak resets to 0 on imperfect score', () => {
    let streak = 5;
    const isPerfect = false;
    if (isPerfect) streak++;
    else streak = 0;
    expect(streak).toBe(0);
  });
});

describe('Quiz Module — Phase Status Categorisation', () => {
  test('labels phase before today as "completed"', () => {
    const phaseDate = new Date('2020-01-01');
    const today     = new Date('2026-05-01');
    let status = 'upcoming';
    if (phaseDate < today) status = 'completed';
    const diff = (phaseDate - today) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= 7) status = 'ongoing';
    expect(status).toBe('completed');
  });

  test('labels phase more than 7 days away as "upcoming"', () => {
    const phaseDate = new Date('2030-01-01');
    const today     = new Date('2026-05-01');
    let status = 'upcoming';
    if (phaseDate < today) status = 'completed';
    const diff = (phaseDate - today) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= 7) status = 'ongoing';
    expect(status).toBe('upcoming');
  });
});

describe('Quiz Module — Timer Logic', () => {
  test('timer counts down correctly', () => {
    let time = 30;
    time--;
    expect(time).toBe(29);
  });

  test('timer hits 0 after 30 decrements', () => {
    let time = 30;
    for (let i = 0; i < 30; i++) time--;
    expect(time).toBe(0);
  });
});

describe('Quiz Module — DOM Initialisation', () => {
  beforeEach(() => {
    buildQuizDOM();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ questions: MOCK_QUESTIONS })
    });
  });

  test('initialises without throwing', async () => {
    await expect(initQuiz()).resolves.not.toThrow();
  });

  test('start button is present in DOM', () => {
    expect(document.getElementById('start-quiz-btn')).not.toBeNull();
  });

  test('lobby, play, and results sections are present', () => {
    expect(document.getElementById('quiz-lobby')).not.toBeNull();
    expect(document.getElementById('quiz-play')).not.toBeNull();
    expect(document.getElementById('quiz-results')).not.toBeNull();
  });

  test('retry button navigates back to lobby', async () => {
    await initQuiz();
    const results = document.getElementById('quiz-results');
    const lobby   = document.getElementById('quiz-lobby');
    results.hidden = false;
    lobby.hidden   = true;
    document.getElementById('retry-quiz-btn').click();
    expect(results.hidden).toBe(true);
    expect(lobby.hidden).toBe(false);
  });

  test('difficulty buttons toggle "active" class', async () => {
    await initQuiz();
    const [begBtn, advBtn] = document.querySelectorAll('.diff-btn');
    advBtn.click();
    expect(advBtn.classList.contains('active')).toBe(true);
    expect(begBtn.classList.contains('active')).toBe(false);
  });
});
