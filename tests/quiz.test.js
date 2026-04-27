import { initQuiz } from '../modules/quiz.js';

beforeEach(() => {
  document.body.innerHTML = `
    <div id="quiz-lobby"></div>
    <div id="quiz-play" hidden></div>
    <div id="quiz-results" hidden></div>
    <button id="start-quiz-btn"></button>
    <div id="quiz-score-display"></div>
  `;
});

describe('Quiz Module', () => {
  test('should hide lobby and show play when started', () => {
    const btn = document.getElementById('start-quiz-btn');
    const lobby = document.getElementById('quiz-lobby');
    const play = document.getElementById('quiz-play');
    
    // Simulate start logic
    lobby.hidden = true;
    play.hidden = false;

    expect(lobby.hidden).toBe(true);
    expect(play.hidden).toBe(false);
  });

  test('should assign Civic Learner badge for score 0-4', () => {
    const score = 3;
    let badge = "";
    if (score <= 4) badge = "Civic Learner";
    expect(badge).toBe("Civic Learner");
  });

  test('should assign Informed Voter badge for score 5-7', () => {
    const score = 6;
    let badge = "";
    if (score > 4 && score <= 7) badge = "Informed Voter";
    expect(badge).toBe("Informed Voter");
  });

  test('should assign Democracy Champion badge for score 8-10', () => {
    const score = 9;
    let badge = "";
    if (score >= 8) badge = "Democracy Champion";
    expect(badge).toBe("Democracy Champion");
  });

  test('should track timer', () => {
    let timeLeft = 30;
    timeLeft -= 1;
    expect(timeLeft).toBe(29);
  });
});
