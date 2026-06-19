// ================================================================
// challenge.js — Daily Nutrition Challenge System
// NutriPlan-Lite
// ================================================================

window.Challenge = (() => {
  // Predefined array of challenges with varying difficulties
  const CHALLENGES = [
    { id: 'c1', type: 'water', target: 3000, title: 'Drink 3L of water today', diff: 'Easy', color: '🟢', icon: '💧', unit: 'ml' },
    { id: 'c2', type: 'protein', target: 100, title: 'Hit 100g of protein', diff: 'Medium', color: '🟡', icon: '🍗', unit: 'g' },
    { id: 'c3', type: 'calories_min', target: 1500, title: 'Log at least 1500 kcal', diff: 'Easy', color: '🟢', icon: '🔥', unit: 'kcal' },
    { id: 'c4', type: 'fiber', target: 25, title: 'Hit 25g fiber (Est. via carbs)', diff: 'Hard', color: '🔴', icon: '🥦', unit: 'g' },
    { id: 'c5', type: 'meals_count', target: 4, title: 'Log 4 separate items/meals', diff: 'Medium', color: '🟡', icon: '🍽️', unit: 'items' },
    { id: 'c6', type: 'water', target: 2500, title: 'Drink 2.5L of water today', diff: 'Easy', color: '🟢', icon: '💧', unit: 'ml' },
    { id: 'c7', type: 'protein', target: 120, title: 'Hit 120g of protein', diff: 'Hard', color: '🔴', icon: '💪', unit: 'g' }
  ];

  // Fixed sequence ensuring no consecutive repeats (minimum 3-day gap for same types)
  const SEQUENCE = [0, 3, 6, 1, 4, 2, 5];

  function getDailyChallenge(dateString) {
    // Deterministic selection based on date string (YYYY-MM-DD)
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = (hash << 5) - hash + dateString.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % SEQUENCE.length;
    const challengeIdx = SEQUENCE[index];
    return CHALLENGES[challengeIdx];
  }

  function calculateProgress(dateKey, challenge) {
    const foods = window.Storage.getFoods(dateKey) || [];
    const water = window.Storage.getWater(dateKey) || 0;

    let current = 0;
    if (challenge.type === 'water') {
      current = water;
    } else if (challenge.type === 'protein') {
      current = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
    } else if (challenge.type === 'calories_min') {
      current = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
    } else if (challenge.type === 'fiber') {
      // Approximate fiber as 10% of total carbs since we only track core macros
      current = foods.reduce((sum, f) => sum + ((f.carbs || 0) * 0.1), 0);
    } else if (challenge.type === 'meals_count') {
      current = foods.length;
    }

    return Math.floor(current);
  }

  function render() {
    const container = document.getElementById('daily-challenge-container');
    if (!container) return; // Panel not loaded in DOM

    const dateKey = (window.Tracker && window.Tracker.currentDate) ? window.Tracker.currentDate : window.Storage.todayKey();
    const challenge = getDailyChallenge(dateKey);
    const currentProgress = calculateProgress(dateKey, challenge);
    const percent = Math.min(100, Math.round((currentProgress / challenge.target) * 100));
    
    // Check completion state and history
    const historyKey = 'np_challenge_history';
    let history = {};
    try {
      history = JSON.parse(localStorage.getItem(historyKey)) || {};
    } catch(e) {}

    const isCompletedNow = currentProgress >= challenge.target;
    const wasCompletedBefore = history[dateKey] === challenge.id;

    if (isCompletedNow && !wasCompletedBefore) {
      // Just hit the target!
      history[dateKey] = challenge.id;
      localStorage.setItem(historyKey, JSON.stringify(history));
      if (window.Toast) {
        window.Toast.show('Daily Challenge Completed! ✅', 'success');
      }
    }

    const isCompleted = isCompletedNow || wasCompletedBefore;

    if (isCompleted) {
      container.innerHTML = `
        <div class="challenge-header">
          <div class="challenge-title">
            <span class="challenge-icon">🏆</span>
            <strong>Daily Challenge</strong>
          </div>
          <span class="challenge-difficulty diff-easy">🟢 Done</span>
        </div>
        <p class="challenge-desc" style="color: var(--green); margin-top: 0.5rem; font-weight: 500;">
          ${challenge.title}
        </p>
        <div class="challenge-done">
          <div class="done-icon-wrapper">
            <span class="done-icon">✅</span>
            <span>Awesome! Challenge completed!</span>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="challenge-header">
          <div class="challenge-title">
            <span class="challenge-icon">${challenge.icon}</span>
            <strong>Daily Challenge</strong>
          </div>
          <span class="challenge-difficulty diff-${challenge.diff.toLowerCase()}">${challenge.color} ${challenge.diff}</span>
        </div>
        <p class="challenge-desc">${challenge.title}</p>
        
        <div class="challenge-stats">
          <span>${currentProgress} / ${challenge.target} ${challenge.unit}</span>
          <span>${percent}%</span>
        </div>
        <div class="progress-track" style="margin-top: 0.5rem;">
          <div class="progress-fill fill-green challenge-progress-fill" style="width: ${percent}%"></div>
        </div>
      `;
    }
  }

  return { render };
})();
