// ================================================================
// analytics.js — Dashboard analytics, charts, and health score
// NutriPlan-Lite
// ================================================================

window.Analytics = {

  // ── Health Score Calculation ────────────────────────────────────
  calculateHealthScore(consumed, targets, water, waterTarget) {
    let score = 0;
    // Calorie accuracy (max 35 pts)
    const calPct = targets.calories > 0 ? consumed.calories / targets.calories : 0;
    if (calPct >= 0.85 && calPct <= 1.05) score += 35;
    else if (calPct >= 0.70 && calPct <= 1.15) score += 22;
    else if (calPct > 0) score += 10;

    // Protein adequacy (max 25 pts)
    const protPct = targets.protein > 0 ? consumed.protein / targets.protein : 0;
    if (protPct >= 0.90) score += 25;
    else if (protPct >= 0.70) score += 16;
    else if (protPct > 0) score += 8;

    // Hydration (max 25 pts)
    const hydPct = waterTarget > 0 ? water / waterTarget : 0;
    if (hydPct >= 0.90) score += 25;
    else if (hydPct >= 0.60) score += 15;
    else if (hydPct > 0) score += 7;

    // Meal variety (max 15 pts) – rewarded via food count
    const foodCount = Math.min(consumed.foodCount || 0, 5);
    score += foodCount * 3;

    return Math.min(100, Math.round(score));
  },

  // ── Nutrition Score ring ────────────────────────────────────────
  updateScoreRing(score) {
    const ring = document.getElementById('nutrition-score-ring');
    const scoreEl = document.getElementById('nutrition-score');
    if (ring) ring.style.setProperty('--progress', `${score}%`);
    if (scoreEl) scoreEl.textContent = score;
  },

  // ── Calorie balance label ───────────────────────────────────────
  getCalorieBalanceLabel(consumed, target) {
    if (target === 0) return 'Set Goal';
    const pct = consumed / target;
    if (consumed === 0) return 'Not Started';
    if (pct > 1.15) return 'Over Limit';
    if (pct > 1.0) return 'At Limit';
    if (pct >= 0.85) return 'On Track';
    if (pct >= 0.5) return 'In Progress';
    return 'Just Started';
  },

  // ── Hydration label ─────────────────────────────────────────────
  getHydrationLabel(water, target) {
    if (target === 0) return 'Set Goal';
    const pct = water / target;
    if (pct >= 1.0) return 'Goal Met! 💧';
    if (pct >= 0.75) return 'Almost There';
    if (pct >= 0.5) return 'Halfway';
    if (pct > 0) return 'Low';
    return 'None Yet';
  },

  // ── Render Chart.js line and bar charts for weekly calories ──────
  renderWeeklyCaloriesChart(weeklyData, targetCalories) {
    // 1. Update weekly summary stats cards
    const profile = window.Storage.getProfile();
    const activeWaterTarget = profile.targetWater || profile.waterTarget || 2500;
    this.updateWeeklyMetrics(weeklyData, targetCalories, activeWaterTarget);

    // 2. Render calorie trends chart
    const canvas = document.getElementById('calorieChartCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (window.__calorieChart) {
      window.__calorieChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    const isLight = window.ThemeService && window.ThemeService.getTheme() === 'light';
    const computedStyles = getComputedStyle(document.documentElement);
    const textThemeColor = computedStyles.getPropertyValue('--text-secondary').trim() || (isLight ? '#334155' : '#cbd5e1');
    const gridThemeColor = isLight ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.08)';

    window.__calorieChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeklyData.map(d => d.label),
        datasets: [
          {
            label: 'Actual Calories',
            data: weeklyData.map(d => d.calories),
            backgroundColor: isLight ? 'rgba(56, 242, 166, 0.28)' : 'rgba(56, 242, 166, 0.22)',
            borderColor: '#38f2a6',
            borderWidth: 2,
            borderRadius: 8,
            barThickness: 20
          },
          {
            label: 'Calorie Goal',
            data: weeklyData.map(() => targetCalories),
            type: 'line',
            borderColor: '#22d3ee',
            borderWidth: 2.5,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textThemeColor, font: { family: 'Inter', weight: 'bold', size: 11 } }
          },
          tooltip: {
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(13, 22, 37, 0.96)',
            titleColor: isLight ? '#0f172a' : '#f8fafc',
            bodyColor: isLight ? '#334155' : '#cbd5e1',
            borderColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 12
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textThemeColor, font: { family: 'Inter', weight: 'bold', size: 10 } }
          },
          y: {
            grid: { color: gridThemeColor },
            ticks: { color: textThemeColor, font: { family: 'Inter', size: 10 } }
          }
        }
      }
    });
  },

  // ── Render Chart.js weekly hydration chart ───────────────────────
  renderWeeklyWaterChart(weeklyData, waterTarget) {
    const canvas = document.getElementById('waterChartCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (window.__waterChart) {
      window.__waterChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    const isLight = window.ThemeService && window.ThemeService.getTheme() === 'light';
    const computedStyles = getComputedStyle(document.documentElement);
    const textThemeColor = computedStyles.getPropertyValue('--text-secondary').trim() || (isLight ? '#334155' : '#cbd5e1');
    const gridThemeColor = isLight ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.08)';

    const fillGradient = ctx.createLinearGradient(0, 0, 0, 200);
    fillGradient.addColorStop(0, isLight ? 'rgba(34, 211, 238, 0.3)' : 'rgba(34, 211, 238, 0.22)');
    fillGradient.addColorStop(1, 'rgba(34, 211, 238, 0.02)');

    window.__waterChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: weeklyData.map(d => d.label),
        datasets: [
          {
            label: 'Water Intake',
            data: weeklyData.map(d => d.water),
            borderColor: '#22d3ee',
            borderWidth: 3,
            backgroundColor: fillGradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#22d3ee',
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Hydration Target',
            data: weeklyData.map(() => waterTarget),
            borderColor: '#38f2a6',
            borderWidth: 2,
            borderDash: [6, 6],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textThemeColor, font: { family: 'Inter', weight: 'bold', size: 11 } }
          },
          tooltip: {
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(13, 22, 37, 0.96)',
            titleColor: isLight ? '#0f172a' : '#f8fafc',
            bodyColor: isLight ? '#334155' : '#cbd5e1',
            borderColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 12,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${context.raw} ml`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textThemeColor, font: { family: 'Inter', weight: 'bold', size: 10 } }
          },
          y: {
            grid: { color: gridThemeColor },
            ticks: { color: textThemeColor, font: { family: 'Inter', size: 10 } }
          }
        }
      }
    });
  },

  // ── Macro donut chart (CSS Conic + Chart.js Doughnut) ────────────
  renderMacroDonut(protein, carbs, fat) {
    // 1. Conic gradient fallback card donut
    const donut = document.getElementById('macro-donut');
    if (donut) {
      const total = protein + carbs + fat;
      if (total === 0) {
        donut.style.background = 'rgba(148,163,184,0.12)';
      } else {
        const pPct = (protein / total) * 100;
        const cPct = (carbs / total) * 100;
        donut.style.background = `conic-gradient(
          var(--amber) 0% ${pPct.toFixed(1)}%,
          var(--teal) ${pPct.toFixed(1)}% ${(pPct + cPct).toFixed(1)}%,
          var(--rose) ${(pPct + cPct).toFixed(1)}% 100%
        )`;
      }
    }

    // 2. Full interactive Chart.js doughnut
    const canvas = document.getElementById('macroChartCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (window.__macroChart) {
      window.__macroChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    const isLight = window.ThemeService && window.ThemeService.getTheme() === 'light';
    const computedStyles = getComputedStyle(document.documentElement);
    const textThemeColor = computedStyles.getPropertyValue('--text-secondary').trim() || (isLight ? '#334155' : '#cbd5e1');

    const total = protein + carbs + fat;
    const hasLog = total > 0;
    const dataVals = hasLog ? [protein, carbs, fat] : [33.3, 33.3, 33.4];
    const dataLabels = hasLog ? ['Protein (g)', 'Carbs (g)', 'Fats (g)'] : ['No Protein Logged', 'No Carbs Logged', 'No Fats Logged'];
    const colors = hasLog ? ['#fbbf24', '#22d3ee', '#fb7185'] : ['rgba(148,163,184,0.12)', 'rgba(148,163,184,0.18)', 'rgba(148,163,184,0.08)'];

    window.__macroChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: dataLabels,
        datasets: [{
          data: dataVals,
          backgroundColor: colors,
          borderWidth: isLight ? 2 : 0,
          borderColor: isLight ? '#ffffff' : 'transparent',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textThemeColor, font: { family: 'Inter', weight: 'bold', size: 10.5 }, padding: 12 }
          },
          tooltip: {
            enabled: hasLog,
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(13, 22, 37, 0.96)',
            titleColor: isLight ? '#0f172a' : '#f8fafc',
            bodyColor: isLight ? '#334155' : '#cbd5e1',
            borderColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 12
          }
        }
      }
    });
  },

  // ── Calculate and Render Weekly Highlights Stat Cards ──────────
  updateWeeklyMetrics(weeklyData, targetCalories, waterTarget) {
    const avgCal = Math.round(weeklyData.reduce((s, d) => s + d.calories, 0) / 7);
    const avgProt = Math.round((weeklyData.reduce((s, d) => s + d.protein, 0) / 7) * 10) / 10;
    const totalWater = weeklyData.reduce((s, d) => s + d.water, 0);
    const totalWaterLiters = (totalWater / 1000).toFixed(1);
    const avgWater = Math.round(totalWater / 7);

    const profile = window.Storage.getProfile();
    const targets = window.Dashboard ? window.Dashboard.computeTargets(profile) : { protein: 120 };
    const targetProtein = profile.targetProtein || targets.protein || 120;
    const protStatus = targetProtein > 0 ? Math.round((avgProt / targetProtein) * 100) : 0;

    const calAdherenceDays = weeklyData.filter(d => d.calories > 0 && Math.abs(d.calories - targetCalories) / targetCalories <= 0.15).length;
    const waterAdherenceDays = weeklyData.filter(d => d.water > 0 && d.water >= waterTarget * 0.75).length;
    const consistencyScore = Math.min(100, Math.round(((calAdherenceDays + waterAdherenceDays) / 14) * 100));

    const loggedDays = weeklyData.filter(d => d.calories > 0).length;
    const calorieAdherencePct = loggedDays > 0 ? Math.round((calAdherenceDays / loggedDays) * 100) : 0;

    const streak = window.Storage.getStreak();

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl('stat-avg-calories', avgCal > 0 ? avgCal + ' kcal' : '—');
    setEl('stat-avg-protein', avgProt > 0 ? avgProt + ' g' : '—');
    setEl('stat-total-water', totalWater > 0 ? totalWaterLiters + ' L' : '—');
    setEl('stat-consistency-score', (consistencyScore > 0 ? consistencyScore : 0) + '%');

    const calAdhEl = document.getElementById('stat-calorie-adherence');
    if (calAdhEl) {
      if (loggedDays > 0) {
        calAdhEl.textContent = `${calorieAdherencePct}% Adherence`;
        calAdhEl.className = `stat-meta ${calorieAdherencePct >= 70 ? 'text-green' : calorieAdherencePct >= 40 ? 'text-amber' : 'text-rose'}`;
      } else {
        calAdhEl.textContent = 'No logs yet';
        calAdhEl.className = 'stat-meta';
      }
    }

    const protStatEl = document.getElementById('stat-protein-status');
    if (protStatEl) {
      if (avgProt > 0) {
        protStatEl.textContent = `${protStatus}% of Goal`;
        protStatEl.className = `stat-meta ${protStatus >= 85 ? 'text-green' : protStatus >= 50 ? 'text-amber' : 'text-rose'}`;
      } else {
        protStatEl.textContent = 'No logs yet';
        protStatEl.className = 'stat-meta';
      }
    }

    const avgWatEl = document.getElementById('stat-avg-water');
    if (avgWatEl) {
      if (totalWater > 0) {
        avgWatEl.textContent = `${avgWater} ml / day`;
        avgWatEl.className = `stat-meta ${avgWater >= waterTarget * 0.85 ? 'text-teal' : avgWater >= waterTarget * 0.5 ? 'text-amber' : 'text-rose'}`;
      } else {
        avgWatEl.textContent = 'No water logged';
        avgWatEl.className = 'stat-meta';
      }
    }

    const streakMetaEl = document.getElementById('stat-streak-meta');
    if (streakMetaEl) {
      streakMetaEl.textContent = `${streak}-day streak`;
      streakMetaEl.className = `stat-meta ${streak > 0 ? 'text-green' : 'text-amber'}`;
    }
  },

  // ── Render Recommendation cards ─────────────────────────────────
  renderRecommendations(consumed, targets, water, waterTarget, goal) {
    const container = document.getElementById('recommendation-list');
    if (!container) return;
    const recs = [];
    const calPct = targets.calories > 0 ? consumed.calories / targets.calories : 0;
    const hydPct = waterTarget > 0 ? water / waterTarget : 0;
    const protPct = targets.protein > 0 ? consumed.protein / targets.protein : 0;

    if (calPct < 0.5 && consumed.calories === 0)
      recs.push({ icon: '🍽️', title: 'Log your first meal', desc: 'Start tracking to see your nutrition score rise.' });
    else if (calPct < 0.7)
      recs.push({ icon: '⚡', title: 'Fuel up!', desc: `You still have ${Math.round(targets.calories - consumed.calories)} kcal left to reach your goal.` });
    else if (calPct > 1.1)
      recs.push({ icon: '⚠️', title: 'Calorie limit exceeded', desc: `You're ${Math.round(consumed.calories - targets.calories)} kcal over your daily target.` });

    if (hydPct < 0.5)
      recs.push({ icon: '💧', title: 'Drink more water', desc: `You've reached ${Math.round(hydPct * 100)}% of your hydration goal. Aim for ${waterTarget}ml today.` });
    else if (hydPct >= 1.0)
      recs.push({ icon: '✅', title: 'Hydration goal met!', desc: `Great job! You hit your ${waterTarget}ml water target for today.` });

    if (protPct < 0.6)
      recs.push({ icon: '💪', title: 'Boost protein intake', desc: `You've consumed ${Math.round(consumed.protein)}g of your ${targets.protein}g protein goal.` });

    if (goal === 'lose' && calPct > 0.9 && calPct <= 1.0)
      recs.push({ icon: '🎯', title: 'On track for fat loss', desc: 'Keep maintaining your calorie deficit consistently.' });

    if (goal === 'gain' && calPct >= 1.0)
      recs.push({ icon: '📈', title: 'Great for muscle gain', desc: 'You hit your calorie surplus today. Combine with strength training.' });

    if (recs.length === 0)
      recs.push({ icon: '⭐', title: 'Excellent day!', desc: 'You are hitting all your nutrition and hydration goals.' });

    container.innerHTML = recs.map(r => `
      <div class="recommendation-card">
        <span class="rec-icon">${r.icon}</span>
        <div>
          <strong>${r.title}</strong>
          <span>${r.desc}</span>
        </div>
      </div>
    `).join('');
  },

  // ── Activity feed ───────────────────────────────────────────────
  renderActivityFeed(foods) {
    const container = document.getElementById('activity-list');
    if (!container) return;
    const recent = [...foods].reverse().slice(0, 5);
    if (recent.length === 0) {
      container.innerHTML = `<div class="activity-empty">No activity yet today.</div>`;
      return;
    }
    container.innerHTML = recent.map(f => {
      const time = f.timestamp ? new Date(f.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      return `
        <div class="activity-item">
          <strong>${f.name}</strong>
          <span>${f.calories} kcal · ${f.meal} · ${time}</span>
        </div>
      `;
    }).join('');
  }
};
