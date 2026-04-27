/**
 * @module quiz
 * @description Handles the interactive quiz logic.
 */

import { fetchJSON } from './data-loader.js';
import { showToast } from './ui-controller.js';

let allQuestions = [];
let currentQuizQuestions = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
const TIME_PER_QUESTION = 30; // seconds

export const initQuiz = async () => {
  const data = await fetchJSON('data/quiz-questions.json');
  if (data && data.questions) {
    allQuestions = data.questions;
  }

  // Setup Difficulty Selection
  const diffBtns = document.querySelectorAll('.diff-btn');
  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Setup Start
  const startBtn = document.getElementById('start-quiz-btn');
  if (startBtn) {
    startBtn.addEventListener('click', startQuiz);
  }

  // Setup Retry
  const retryBtn = document.getElementById('retry-quiz-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      document.getElementById('quiz-results').hidden = true;
      document.getElementById('quiz-lobby').hidden = false;
    });
  }
};

const startQuiz = () => {
  if (allQuestions.length === 0) {
    showToast('Quiz questions not loaded yet.', 'error');
    return;
  }

  const activeDiffBtn = document.querySelector('.diff-btn.active');
  const difficulty = activeDiffBtn ? activeDiffBtn.dataset.difficulty : 'beginner';

  // Filter and shuffle
  let pool = allQuestions.filter(q => q.difficulty === difficulty);
  if (pool.length === 0) pool = allQuestions; // fallback
  
  currentQuizQuestions = shuffleArray(pool).slice(0, 5); // 5 questions per quiz
  currentIndex = 0;
  score = 0;

  document.getElementById('quiz-lobby').hidden = true;
  document.getElementById('quiz-play').hidden = false;
  document.getElementById('quiz-results').hidden = true;
  
  updateScoreDisplay();
  loadQuestion();
};

const loadQuestion = () => {
  const q = currentQuizQuestions[currentIndex];
  
  const qEl = document.getElementById('quiz-question-text');
  qEl.textContent = q.question;
  qEl.dataset.translate = "true";
  qEl.dataset.originalText = q.question;
  
  const optionsContainer = document.getElementById('quiz-options');
  optionsContainer.innerHTML = '';

  // Shuffle options
  const options = shuffleArray([...q.options]);

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    
    const correctText = q.options[q.correct];
    btn.addEventListener('click', () => handleAnswer(btn, opt, correctText));
    btn.dataset.translate = "true";
    btn.dataset.originalText = opt;
    optionsContainer.appendChild(btn);
  });

  updateProgressBar();
  startTimer();
  
  // Re-translate for current language
  import('./i18n.js').then(({ translateContentBlocks }) => translateContentBlocks());
};

const handleAnswer = (selectedBtn, selectedText, correctText) => {
  clearInterval(timerInterval);
  
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(opt => opt.classList.add('disabled'));

  if (selectedText === correctText) {
    selectedBtn.classList.add('correct');
    score += 10;
    updateScoreDisplay();
  } else {
    selectedBtn.classList.add('wrong');
    // Highlight correct
    options.forEach(opt => {
      if (opt.dataset.originalText === correctText) opt.classList.add('correct');
    });
  }

  setTimeout(() => {
    currentIndex++;
    if (currentIndex < currentQuizQuestions.length) {
      loadQuestion();
    } else {
      endQuiz();
    }
  }, 1500);
};

const startTimer = () => {
  clearInterval(timerInterval);
  let time = TIME_PER_QUESTION;
  const timerDisplay = document.getElementById('quiz-timer');
  
  timerDisplay.textContent = `${time}s`;
  timerDisplay.style.color = 'inherit';

  timerInterval = setInterval(() => {
    time--;
    timerDisplay.textContent = `${time}s`;
    
    if (time <= 5) timerDisplay.style.color = 'var(--color-error)';
    
    if (time <= 0) {
      clearInterval(timerInterval);
      // Auto wrong answer
      const options = document.querySelectorAll('.quiz-option');
      options.forEach(opt => opt.classList.add('disabled'));
      
      const q = currentQuizQuestions[currentIndex];
      const correctText = q.options[q.correct];
      options.forEach(opt => {
        if (opt.dataset.originalText === correctText) opt.classList.add('correct');
      });
      
      setTimeout(() => {
        currentIndex++;
        if (currentIndex < currentQuizQuestions.length) loadQuestion();
        else endQuiz();
      }, 1500);
    }
  }, 1000);
};

const updateProgressBar = () => {
  const percent = (currentIndex / currentQuizQuestions.length) * 100;
  const bar = document.getElementById('quiz-progress-bar');
  bar.style.width = `${percent}%`;
  bar.setAttribute('aria-valuenow', percent);
};

const updateScoreDisplay = () => {
  document.getElementById('quiz-score-display').textContent = `Score: ${score}`;
};

const endQuiz = () => {
  document.getElementById('quiz-play').hidden = true;
  document.getElementById('quiz-results').hidden = false;
  
  const maxScore = currentQuizQuestions.length * 10;
  const scoreEl = document.getElementById('result-score');
  const scoreText = `You scored ${score} / ${maxScore}`;
  scoreEl.textContent = scoreText;
  scoreEl.dataset.translate = "true";
  scoreEl.dataset.originalText = scoreText;
  
  const title = document.getElementById('result-title');
  let resultMsg = "";
  if (score === maxScore) resultMsg = "Perfect Score! 🌟";
  else if (score >= maxScore * 0.6) resultMsg = "Great Job! 👍";
  else resultMsg = "Good Try! Keep Learning 📚";
  
  title.textContent = resultMsg;
  title.dataset.translate = "true";
  title.dataset.originalText = resultMsg;
  
  updateAchievements(score === maxScore);
  
  // Re-translate results
  import('./i18n.js').then(({ translateContentBlocks }) => translateContentBlocks());
};

const updateAchievements = (isPerfect) => {
  // Update Streak
  let streak = parseInt(localStorage.getItem('quizStreak') || '0');
  if (isPerfect) streak++;
  else streak = 0;
  localStorage.setItem('quizStreak', streak);
  
  const streakEl = document.getElementById('quiz-streak');
  if (streakEl) streakEl.textContent = streak;
  
  // Update Rank (Level up every perfect game for demo)
  const ranks = ['Beginner Voter', 'Active Citizen', 'Democracy Expert', 'Constitution Master', 'Democracy Legend 🏆'];
  let rankIdx = Math.min(streak, ranks.length - 1);
  const rankEl = document.getElementById('quiz-rank');
  if (rankEl) {
    const rankText = ranks[rankIdx];
    rankEl.textContent = rankText;
    rankEl.dataset.translate = "true";
    rankEl.dataset.originalText = rankText;
  }
  
  // Update Last Played
  const now = new Date().toLocaleDateString();
  localStorage.setItem('quizLastPlayed', now);
  const lastPlayedEl = document.getElementById('quiz-last-played');
  if (lastPlayedEl) {
    lastPlayedEl.textContent = now;
    lastPlayedEl.dataset.originalText = now;
  }
};

// Utility
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
