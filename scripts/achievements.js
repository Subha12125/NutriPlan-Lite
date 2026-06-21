// ================================================================
// achievements.js — Gamification & Badge System
// NutriPlan-Lite
// ================================================================

window.Achievements = (() => {
  const BADGES = [
    {
      id: 'first_log',
      icon: '🌱',
      title: 'First Bite',
      desc: 'Log your first meal in the app.',
      condition: (data) => data.totalFoodsLogged > 0
    },
    {
      id: 'water_3l',
      icon: '🌊',
      title: 'Hydration Hero',
      desc: 'Drink at least 3L of water in a single day.',
      condition: (data) => data.waterToday >= 3000
    },
    {
      id: 'streak_3',
      icon: '🔥',
      title: 'Consistency is Key',
      desc: 'Achieve a 3-day tracking streak.',
      condition: (data) => data.streak >= 3
    },
    {
      id: 'streak_7',
      icon: '⭐',
      title: 'Unstoppable',
      desc: 'Achieve a 7-day tracking streak.',
      condition: (data) => data.streak >= 7
    },
    {
      id: 'macro_master',
      icon: '🎯',
      title: 'Macro Master',
      desc: 'Hit your daily calorie target within 100 kcal.',
      condition: (data) => {
        if (!data.targets || !data.targets.calories) return false;
        return data.caloriesToday > 0 && Math.abs(data.caloriesToday - data.targets.calories) <= 100;
      }
    }
  ];

  function getUnlockedBadges() {
    try {
      return JSON.parse(localStorage.getItem('np_unlocked_badges')) || [];
    } catch(e) {
      return [];
    }
  }

  function setUnlockedBadges(badges) {
    localStorage.setItem('np_unlocked_badges', JSON.stringify(badges));
  }

  function evaluate() {
    if (!window.Storage || !window.Tracker) return;
    
    const unlocked = getUnlockedBadges();
    const dateKey = window.Tracker.currentDate || window.Storage.todayKey();
    
    // Gather data for evaluation
    const foods = window.Storage.getFoods(dateKey) || [];
    const water = window.Storage.getWater(dateKey) || 0;
    const profile = window.Storage.getProfile() || {};
    let targets = null;
    
    if (window.Dashboard && window.Dashboard.computeTargets) {
      targets = window.Dashboard.computeTargets(profile);
    }

    // Since we don't have a direct totalFoodsLogged property in local storage across all days easily,
    // we'll just check if they logged anything today or have a streak > 0.
    const hasLoggedAnything = foods.length > 0 || (window.Storage.getStreak && window.Storage.getStreak() > 0);
    
    const data = {
      totalFoodsLogged: hasLoggedAnything ? 1 : 0,
      waterToday: water,
      streak: window.Storage.getStreak ? window.Storage.getStreak() : 0,
      caloriesToday: foods.reduce((sum, f) => sum + (f.calories || 0), 0),
      targets: targets
    };

    let newlyUnlocked = false;

    BADGES.forEach(badge => {
      if (!unlocked.includes(badge.id)) {
        if (badge.condition(data)) {
          unlocked.push(badge.id);
          newlyUnlocked = true;
          
          // Trigger pop animation effect by saving a temporary flag
          sessionStorage.setItem(`np_badge_new_${badge.id}`, 'true');

          if (window.Toast) {
            window.Toast.show(`Badge Unlocked: ${badge.icon} ${badge.title}`, 'success');
          }
        }
      }
    });

    if (newlyUnlocked) {
      setUnlockedBadges(unlocked);
    }
    
    // Always render so the grid appears on load
    render();
  }

  function render() {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    const unlocked = getUnlockedBadges();

    let html = `
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Gamification</p>
          <h2>Achievements (${unlocked.length}/${BADGES.length})</h2>
        </div>
      </div>
      <div class="badge-grid">
    `;

    BADGES.forEach(badge => {
      const isUnlocked = unlocked.includes(badge.id);
      const isNew = sessionStorage.getItem(`np_badge_new_${badge.id}`) === 'true';
      
      if (isNew) {
        // Clear flag after rendering so it only animates once
        sessionStorage.removeItem(`np_badge_new_${badge.id}`);
      }

      if (isUnlocked) {
        html += `
          <div class="badge-item unlocked ${isNew ? 'badge-pop' : ''}" title="${badge.desc}">
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-info">
              <strong>${badge.title}</strong>
              <span>${badge.desc}</span>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="badge-item locked" title="Locked">
            <div class="badge-icon">🔒</div>
            <div class="badge-info">
              <strong>???</strong>
              <span>Keep tracking to unlock</span>
            </div>
          </div>
        `;
      }
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  return { evaluate, render };
})();
