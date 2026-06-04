// ================================================================
// reports.js — Weekly nutrition reports, smart insights, and exporters
// NutriPlan-Lite
// ================================================================

window.WeeklyReport = (() => {

  // ── Open Modal and Populate Report Data ──────────────────────────
  function openReportModal() {
    const modal = document.getElementById('weekly-report-modal');
    if (!modal) return;

    const weeklyData = window.Storage.getWeeklyData();
    const profile = window.Storage.getProfile();
    const targets = window.Dashboard ? window.Dashboard.computeTargets(profile) : { calories: 2000, protein: 120, waterTarget: 2500 };
    const targetCalories = profile.targetCalories || targets.calories;
    const targetProtein = profile.targetProtein || targets.protein;
    const targetWater = profile.targetWater || profile.waterTarget || 2500;

    // 1. Populate Report Summary Data
    updateReportPrintDOM(weeklyData, targetCalories, targetProtein, targetWater, profile.goal || 'maintain');

    // Reset AI report trigger placeholder
    const contentDiv = document.getElementById('report-ai-insights-content');
    if (contentDiv) {
      contentDiv.innerHTML = `
        <div class="ai-insights-placeholder" style="text-align: center; padding: 1.5rem; color: #64748b; font-size: 0.82rem; border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc;">
          <p style="margin: 0;">Click "Generate AI Insights" to analyze your week-over-week trends, compute your Weekly Nutrition Score, and fetch personalized AI advice.</p>
        </div>
      `;
    }

    // 2. Open drawer and lock scroll
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  // ── Close Modal ──────────────────────────────────────────────────
  function closeReportModal() {
    const modal = document.getElementById('weekly-report-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ── Build Report Sheet Content inside printable DOM container ──────
  function updateReportPrintDOM(weeklyData, targetCalories, targetProtein, targetWater, goal) {
    // A. Range dates
    const startDay = weeklyData[0]?.date ? new Date(weeklyData[0].date) : new Date();
    const endDay = weeklyData[weeklyData.length - 1]?.date ? new Date(weeklyData[weeklyData.length - 1].date) : new Date();
    
    const formatDateStr = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dateRangeEl = document.getElementById('report-date-range');
    if (dateRangeEl) dateRangeEl.textContent = `${formatDateStr(startDay)} - ${formatDateStr(endDay)}`;

    // B. Calculate aggregates
    const avgCal = Math.round(weeklyData.reduce((s, d) => s + d.calories, 0) / 7);
    const avgProt = Math.round((weeklyData.reduce((s, d) => s + d.protein, 0) / 7) * 10) / 10;
    const avgCarbs = Math.round((weeklyData.reduce((s, d) => s + d.carbs, 0) / 7) * 10) / 10;
    const avgFats = Math.round((weeklyData.reduce((s, d) => s + d.fat, 0) / 7) * 10) / 10;
    const totalWater = weeklyData.reduce((s, d) => s + d.water, 0);
    const totalWaterLiters = (totalWater / 1000).toFixed(1);
    const avgWater = Math.round(totalWater / 7);

    const calAdherenceDays = weeklyData.filter(d => d.calories > 0 && Math.abs(d.calories - targetCalories) / targetCalories <= 0.15).length;
    const waterAdherenceDays = weeklyData.filter(d => d.water > 0 && d.water >= targetWater * 0.75).length;
    const consistencyScore = Math.min(100, Math.round(((calAdherenceDays + waterAdherenceDays) / 14) * 100));

    const loggedDays = weeklyData.filter(d => d.calories > 0).length;
    const calorieAdherencePct = loggedDays > 0 ? Math.round((calAdherenceDays / loggedDays) * 100) : 0;
    const proteinStatusPct = targetProtein > 0 ? Math.round((avgProt / targetProtein) * 100) : 0;
    const streak = window.Storage.getStreak();

    // Populate aggregated stats
    setEl('report-stat-calories', avgCal > 0 ? avgCal + ' kcal' : '—');
    setEl('report-stat-water', totalWater > 0 ? totalWaterLiters + ' Liters' : '—');
    setEl('report-stat-protein', avgProt > 0 ? avgProt + ' grams' : '—');
    setEl('report-stat-consistency', (consistencyScore > 0 ? consistencyScore : 0) + '%');

    // Stats meta values
    setElMeta('report-meta-calories', loggedDays > 0 ? `${calorieAdherencePct}% Adherence` : 'No logs yet', calorieAdherencePct >= 70 ? '#10b981' : calorieAdherencePct >= 40 ? '#f59e0b' : '#ef4444');
    setElMeta('report-meta-protein', avgProt > 0 ? `${proteinStatusPct}% of Goal` : 'No logs yet', proteinStatusPct >= 85 ? '#10b981' : proteinStatusPct >= 50 ? '#f59e0b' : '#ef4444');
    setElMeta('report-meta-water', totalWater > 0 ? `${avgWater} ml / day` : 'No water logged', avgWater >= targetWater * 0.85 ? '#06b6d4' : avgWater >= targetWater * 0.5 ? '#f59e0b' : '#ef4444');
    setElMeta('report-meta-streak', `${streak}-day streak`, streak > 0 ? '#10b981' : '#f59e0b');

    // C. Draw Mini Bar Charts (CSS based high contrast print grids)
    drawPrintMiniBars('print-weekly-calories-bars', weeklyData.map(d => ({ label: d.label, value: d.calories })), targetCalories, '#10b981', '#f59e0b', 'kcal');
    drawPrintMiniBars('print-weekly-water-bars', weeklyData.map(d => ({ label: d.label, value: d.water })), targetWater, '#06b6d4', 'rgba(6,182,212,0.4)', 'ml');

    // D. Build Averages Table Rows
    const tableBody = document.getElementById('report-table-body');
    if (tableBody) {
      tableBody.innerHTML = weeklyData.map(day => `
        <tr>
          <td><strong>${day.label}</strong></td>
          <td style="text-align:right;">${day.calories > 0 ? day.calories : '—'}</td>
          <td style="text-align:right;">${day.protein > 0 ? day.protein + 'g' : '—'}</td>
          <td style="text-align:right;">${day.carbs > 0 ? day.carbs + 'g' : '—'}</td>
          <td style="text-align:right;">${day.fat > 0 ? day.fat + 'g' : '—'}</td>
          <td style="text-align:right;">${day.water > 0 ? day.water + ' ml' : '—'}</td>
        </tr>
      `).join('');
    }

    // E. Generate and render smart AI insights
    const insightsList = document.getElementById('report-insights-list');
    if (insightsList) {
      const insights = generateSmartInsights(weeklyData, targetCalories, targetProtein, targetWater, goal);
      insightsList.innerHTML = insights.map(item => `
        <div class="report-insight-item">
          <span>${item.icon}</span>
          <div>
            <strong>${item.title}</strong> — <span>${item.desc}</span>
          </div>
        </div>
      `).join('');
    }

    // F. Stamp Generation Time
    const timeEl = document.getElementById('report-generation-time');
    if (timeEl) timeEl.textContent = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  }

  // ── Draw Mini Progress Bars snapshot inside white report sheet ─────
  function drawPrintMiniBars(containerId, dataset, targetVal, primaryColor, altColor, unit) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const maxVal = Math.max(targetVal * 1.25, ...dataset.map(d => d.value), 1);
    container.innerHTML = dataset.map(day => {
      const heightPct = Math.min(100, (day.value / maxVal) * 100);
      const isTargetMet = day.value >= targetVal * 0.85;
      const color = day.value === 0 ? '#e2e8f0' : isTargetMet ? primaryColor : altColor;

      return `
        <div class="report-bar-col">
          <span class="report-bar-val">${day.value > 0 ? (day.value >= 1000 && unit === 'ml' ? (day.value/1000).toFixed(1)+'L' : day.value) : '—'}</span>
          <div class="report-bar-wrap">
            <div class="report-bar-fill" style="height:${heightPct}%; background:${color};" title="${day.label}: ${day.value} ${unit}"></div>
          </div>
          <span class="report-bar-label">${day.label}</span>
        </div>
      `;
    }).join('');
  }

  // ── Smart Insights Rule-based Generator ────────────────────────────
  function generateSmartInsights(weeklyData, targetCalories, targetProtein, waterTarget, goal) {
    const insights = [];
    const avgCal = Math.round(weeklyData.reduce((s, d) => s + d.calories, 0) / 7);
    const avgProt = Math.round(weeklyData.reduce((s, d) => s + d.protein, 0) / 7);
    const avgWater = Math.round(weeklyData.reduce((s, d) => s + d.water, 0) / 7);

    const loggedDays = weeklyData.filter(d => d.calories > 0).length;
    const waterMetDays = weeklyData.filter(d => d.water >= waterTarget).length;
    const proteinMetDays = weeklyData.filter(d => d.protein >= targetProtein).length;

    // 1. Calorie insights based on active goal
    if (loggedDays > 0) {
      const calPct = avgCal / targetCalories;
      if (goal === 'lose') {
        if (calPct >= 0.8 && calPct <= 1.0) {
          insights.push({ icon: '🎯', title: 'Optimal calorie deficit', desc: `Your average intake of ${avgCal} kcal aligns with your weight loss plan. Consistently maintaining this deficit supports fat loss.` });
        } else if (calPct > 1.05) {
          insights.push({ icon: '⚠️', title: 'Slight surplus detected', desc: `Your calorie average (${avgCal} kcal) exceeds your target goal of ${targetCalories} kcal. Consider incorporating higher volume, lower calorie foods.` });
        } else {
          insights.push({ icon: '🥗', title: 'Aggressive calorie reduction', desc: `You are averaging ${avgCal} kcal, which is significantly lower than your goal. Ensure you feed your body enough macronutrients to protect lean muscle mass.` });
        }
      } else if (goal === 'gain') {
        if (calPct >= 1.0 && calPct <= 1.15) {
          insights.push({ icon: '📈', title: 'Lean bulking on track', desc: `Average calories (${avgCal} kcal) support muscle protein synthesis surpluses. Combine with progressive strength workouts.` });
        } else if (calPct < 0.95) {
          insights.push({ icon: '⚠️', title: 'Deficit while gaining', desc: `Your average intake (${avgCal} kcal) falls below maintenance targets. Double down on caloric density (nuts, healthy fats) to meet your muscle building goal.` });
        }
      } else {
        if (Math.abs(calPct - 1) <= 0.1) {
          insights.push({ icon: '⚖️', title: 'Weight maintenance baseline met', desc: `Excellent steady energy balance! Your calorie average of ${avgCal} kcal maps neatly to your maintenance target.` });
        }
      }
    }

    // 2. Hydration insights
    if (avgWater > 0) {
      if (waterMetDays >= 5) {
        insights.push({ icon: '💧', title: 'Superior hydration habits', desc: `You hit your fluid target on ${waterMetDays}/7 days this week. Excellent hydration consistency supports joint health, cognitive function, and energy.` });
      } else if (avgWater < waterTarget * 0.7) {
        insights.push({ icon: '🥤', title: 'Increase fluid frequency', desc: `Your average hydration level (${avgWater} ml) is low compared to your target (${waterTarget} ml). Try keeping a water bottle nearby and logging drinks hourly.` });
      }
    } else {
      insights.push({ icon: '❓', title: 'Start tracking water', desc: 'No water logged this week. Stay refreshed and support digestion by drinking at least 2 liters of water daily.' });
    }

    // 3. Protein insights
    if (avgProt > 0) {
      if (proteinMetDays >= 4) {
        insights.push({ icon: '💪', title: 'High-quality protein adherence', desc: `You met your protein targets on ${proteinMetDays} days this week, keeping lean muscle tissues supported and aiding post-workout recovery.` });
      } else if (avgProt < targetProtein * 0.75) {
        insights.push({ icon: '🍗', title: 'Boost amino acids profile', desc: `Average protein (${avgProt}g) is below target (${targetProtein}g). Try adding lean meats, eggs, tofu, fish, or plant-based protein powders to your meals.` });
      }
    }

    // Fallback if no entries yet
    if (insights.length === 0) {
      insights.push({ icon: '🌱', title: 'Welcome to NutriPlan Reports', desc: 'Log meals, proteins, and fluid targets consistently across the week to compile advanced comparative insights.' });
    }

    return insights;
  }

  // ── AI Weekly Report Generation logic ──────────────────────────────
  async function generateAIReport() {
    const btnAI = document.getElementById('btn-generate-ai-report');
    const contentDiv = document.getElementById('report-ai-insights-content');
    if (!contentDiv) return;

    if (btnAI) {
      btnAI.disabled = true;
      btnAI.textContent = 'Generating...';
    }

    contentDiv.innerHTML = `
      <div class="ai-loading-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; gap: 1rem; color: #06b6d4;">
        <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(6,182,212,0.2); border-top-color: #06b6d4; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span style="font-size: 0.85rem; font-weight: 600; animation: pulse 1.5s ease-in-out infinite;">Analyzing weekly nutrition logs and compiling trends...</span>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      </style>
    `;

    try {
      const currentWeek = window.Storage.getWeeklyData(0);
      const prevWeek = window.Storage.getWeeklyData(1);
      const profile = window.Storage.getProfile();

      const targets = window.Dashboard ? window.Dashboard.computeTargets(profile) : { calories: 2000, protein: 120, waterTarget: 2500 };
      const targetCalories = profile.targetCalories || targets.calories;
      const targetProtein = profile.targetProtein || targets.protein;
      const targetCarbs = profile.targetCarbs || targets.carbs || 200;
      const targetFat = profile.targetFat || targets.fat || 65;
      const targetWater = profile.targetWater || profile.waterTarget || 2500;

      // Current week aggregates
      const avgCal = Math.round(currentWeek.reduce((s, d) => s + d.calories, 0) / 7);
      const avgProt = Math.round((currentWeek.reduce((s, d) => s + d.protein, 0) / 7) * 10) / 10;
      const avgCarbs = Math.round((currentWeek.reduce((s, d) => s + d.carbs, 0) / 7) * 10) / 10;
      const avgFat = Math.round((currentWeek.reduce((s, d) => s + d.fat, 0) / 7) * 10) / 10;
      const avgWater = Math.round(currentWeek.reduce((s, d) => s + d.water, 0) / 7);

      const totalMeals = currentWeek.reduce((sum, day) => {
        const log = window.Storage.getDayLog(day.date);
        return sum + (log && log.foods ? log.foods.length : 0);
      }, 0);

      // Compliance calculation
      const calCompliance = Math.max(0, 100 - Math.round(Math.abs(avgCal - targetCalories) / targetCalories * 100));
      const protCompliance = targetProtein > 0 ? Math.min(100, Math.round((avgProt / targetProtein) * 100)) : 0;
      const carbsCompliance = targetCarbs > 0 ? Math.max(0, 100 - Math.round(Math.abs(avgCarbs - targetCarbs) / targetCarbs * 100)) : 0;
      const fatCompliance = targetFat > 0 ? Math.max(0, 100 - Math.round(Math.abs(avgFat - targetFat) / targetFat * 100)) : 0;
      const waterCompliance = targetWater > 0 ? Math.min(100, Math.round((avgWater / targetWater) * 100)) : 0;

      const weeklyScore = Math.round((calCompliance + protCompliance + carbsCompliance + fatCompliance + waterCompliance) / 5);

      // Score status mapping
      let scoreCategory = 'Needs Improvement';
      let scoreColor = '#ef4444'; // Red
      let scoreEmoji = '🔴';
      if (weeklyScore >= 85) {
        scoreCategory = 'Excellent';
        scoreColor = '#10b981'; // Green
        scoreEmoji = '🟢';
      } else if (weeklyScore >= 70) {
        scoreCategory = 'Good';
        scoreColor = '#f59e0b'; // Amber/Yellow
        scoreEmoji = '🟡';
      } else if (weeklyScore >= 50) {
        scoreCategory = 'Fair';
        scoreColor = '#ff781f'; // Orange
        scoreEmoji = '🟠';
      }

      // WoW comparison
      const prevTotalCal = prevWeek.reduce((s, d) => s + d.calories, 0);
      const prevAvgCal = Math.round(prevTotalCal / 7);
      const prevAvgProt = Math.round((prevWeek.reduce((s, d) => s + d.protein, 0) / 7) * 10) / 10;
      const prevAvgWater = Math.round(prevWeek.reduce((s, d) => s + d.water, 0) / 7);

      const currentCalAdherenceDays = currentWeek.filter(d => d.calories > 0 && Math.abs(d.calories - targetCalories) / targetCalories <= 0.15).length;
      const currentWaterAdherenceDays = currentWeek.filter(d => d.water > 0 && d.water >= targetWater * 0.75).length;
      const consistencyScoreCurrent = Math.min(100, Math.round(((currentCalAdherenceDays + currentWaterAdherenceDays) / 14) * 100));

      const prevCalAdherenceDays = prevWeek.filter(d => d.calories > 0 && Math.abs(d.calories - targetCalories) / targetCalories <= 0.15).length;
      const prevWaterAdherenceDays = prevWeek.filter(d => d.water > 0 && d.water >= targetWater * 0.75).length;
      const consistencyScorePrev = Math.min(100, Math.round(((prevCalAdherenceDays + prevWaterAdherenceDays) / 14) * 100));

      const calTrend = prevAvgCal > 0 ? Math.round(((avgCal - prevAvgCal) / prevAvgCal) * 100) : 0;
      const protTrend = prevAvgProt > 0 ? Math.round(((avgProt - prevAvgProt) / prevAvgProt) * 100) : 0;
      const waterTrend = prevAvgWater > 0 ? Math.round(((avgWater - prevAvgWater) / prevAvgWater) * 100) : 0;
      const consistencyChange = consistencyScoreCurrent - consistencyScorePrev;

      const trendsHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem; text-align: center;">
            <small style="color: #64748b; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">Calories</small>
            <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-top: 0.15rem;">
              ${calTrend >= 0 ? '+' : ''}${calTrend}%
            </div>
            <span style="font-size: 0.55rem; color: #94a3b8;">vs last week</span>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem; text-align: center;">
            <small style="color: #64748b; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">Protein</small>
            <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-top: 0.15rem;">
              ${protTrend >= 0 ? '+' : ''}${protTrend}%
            </div>
            <span style="font-size: 0.55rem; color: #94a3b8;">vs last week</span>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem; text-align: center;">
            <small style="color: #64748b; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">Water</small>
            <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-top: 0.15rem;">
              ${waterTrend >= 0 ? '+' : ''}${waterTrend}%
            </div>
            <span style="font-size: 0.55rem; color: #94a3b8;">vs last week</span>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem; text-align: center;">
            <small style="color: #64748b; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">Consistency</small>
            <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-top: 0.15rem;">
              ${consistencyChange > 0 ? '+' + consistencyChange + '%' : consistencyChange < 0 ? consistencyChange + '%' : 'Same'}
            </div>
            <span style="font-size: 0.55rem; color: #94a3b8;">vs last week</span>
          </div>
        </div>
      `;

      const scoreCardHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 42px; height: 42px; border-radius: 50%; border: 3px solid ${scoreColor}; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 900; color: #0f172a;">
              ${weeklyScore}
            </div>
            <div>
              <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em;">Weekly Nutrition Score</div>
              <div style="font-size: 0.85rem; font-weight: 800; color: ${scoreColor}; display: flex; align-items: center; gap: 0.25rem; margin-top: 0.1rem;">
                <span>${scoreEmoji}</span> <span>${scoreCategory}</span>
              </div>
            </div>
          </div>
          <div style="font-size: 0.76rem; color: #475569; font-weight: 550; max-width: 250px;">
            Target Adherence: Calories ${calCompliance}%, Protein ${protCompliance}%, Water ${waterCompliance}%.
          </div>
        </div>
      `;

      let aiResponseText = null;

      if (window.AI && typeof window.AI.queryCloudGeminiAI === 'function' && window.AI.isCloudModeActive()) {
        const prompt = `You are a clinical nutritionist and health coach analyzing a user's fitness and nutrition logs.
Analyze the user's weekly nutrition data:
- Goal: ${profile.goal || 'maintain'}
- Metrics: Age ${profile.age}, Weight ${profile.weight}kg, Height ${profile.height}cm, Gender ${profile.gender}, Activity Multiplier: ${profile.activity || 1.55}

Current Week Summary Averages:
- Calories: ${avgCal} kcal (Target: ${targetCalories} kcal)
- Protein: ${avgProt}g (Target: ${targetProtein}g)
- Carbs: ${avgCarbs}g (Target: ${targetCarbs}g)
- Fats: ${avgFat}g (Target: ${targetFat}g)
- Water: ${avgWater} ml (Target: ${targetWater} ml)
- Total Tracked Meals: ${totalMeals} meals

Weekly Nutrition Adherence/Compliance:
- Calories compliance: ${calCompliance}%
- Protein compliance: ${protCompliance}%
- Carbs compliance: ${carbsCompliance}%
- Fats compliance: ${fatCompliance}%
- Water compliance: ${waterCompliance}%

Weekly Nutrition Score: ${weeklyScore}/100

Week-over-Week Trends:
- Calories: ${calTrend >= 0 ? '+' : ''}${calTrend}% (vs last week)
- Protein: ${protTrend >= 0 ? '+' : ''}${protTrend}% (vs last week)
- Water: ${waterTrend >= 0 ? '+' : ''}${waterTrend}% (vs last week)
- Consistency: ${consistencyChange > 0 ? '+' + consistencyChange + '%' : consistencyChange < 0 ? consistencyChange + '%' : 'Same'} (vs last week)

Provide a brief clinical health report in markdown containing:
1. AI Health Insights: 3 bullet points of actionable advice based on compliance/trends.
2. Recommendations for the upcoming week.

Be encouraging, concise, professional, and clear. Format key metrics in bold. Do not use generic placeholders.`;

        aiResponseText = await window.AI.queryCloudGeminiAI(prompt);
      }

      if (!aiResponseText) {
        // Local Fallback (privacy-focused offline response)
        const ruleBasedInsights = [];
        if (avgCal > 0) {
          const calPct = avgCal / targetCalories;
          if (profile.goal === 'lose') {
            if (calPct >= 0.8 && calPct <= 1.0) {
              ruleBasedInsights.push("Your calorie deficit remains optimal for fat loss, supporting steady lean-mass retention.");
            } else if (calPct > 1.0) {
              ruleBasedInsights.push(`Your calories average exceeds the deficit target by **${avgCal - targetCalories} kcal**. Try tracking snacks closer.`);
            } else {
              ruleBasedInsights.push("Calorie intake is extremely low; ensure you're consuming enough macros to support basic metabolism.");
            }
          } else if (profile.goal === 'gain') {
            if (calPct >= 1.0 && calPct <= 1.15) {
              ruleBasedInsights.push("Your caloric surplus is perfect for lean muscle growth when combined with resistance workouts.");
            } else {
              ruleBasedInsights.push("Calorie average is currently in a deficit. Increase calorie-dense healthy fats (nuts, seeds) to support muscle gain.");
            }
          } else {
            if (Math.abs(calPct - 1) <= 0.1) {
              ruleBasedInsights.push("Caloric baseline is matching maintenance levels cleanly. Great consistency.");
            }
          }
        }

        if (avgProt > 0) {
          if (avgProt >= targetProtein * 0.85) {
            ruleBasedInsights.push("Excellent protein compliance. High amino acid availability helps preserve muscle mass and support training.");
          } else {
            ruleBasedInsights.push(`Protein average is at **${avgProt}g** against target **${targetProtein}g**. Focus on lean poultry, tofu, fish, or legumes.`);
          }
        }

        if (avgWater > 0) {
          if (avgWater >= targetWater * 0.85) {
            ruleBasedInsights.push("Hydration levels are superb. High compliance supports cognitive function and digestion.");
          } else {
            ruleBasedInsights.push(`Average hydration (${avgWater} ml) is low compared to goal (${targetWater} ml). Increase water frequency.`);
          }
        }

        if (ruleBasedInsights.length === 0) {
          ruleBasedInsights.push("Start logging meals consistently to unlock customized weekly insights.");
        }

        const recommendations = [];
        if (avgWater < targetWater * 0.8) recommendations.push("💧 Drink an extra 500ml water starting with a full glass upon waking.");
        if (avgProt < targetProtein * 0.8) recommendations.push("🍗 Add a protein source to your breakfast (e.g., eggs, protein shake, tofu scramble).");
        if (calTrend > 10 && profile.goal === 'lose') recommendations.push("⚖️ Watch out for portion sizes in dinner meals to prevent minor calorie creep.");
        if (recommendations.length === 0) recommendations.push("✨ Keep up your current daily logging routines and maintain consistency.");

        aiResponseText = `### AI Health Insights
${ruleBasedInsights.map(insight => `- ${insight}`).join('\n')}

### Recommendations for Next Week
${recommendations.map(rec => `- ${rec}`).join('\n')}`;
      }

      // Convert Markdown to premium HTML layout
      const formattedAIResponse = aiResponseText
        .replace(/### (.*)/g, '<h5 style="margin: 0.75rem 0 0.4rem 0; font-size: 0.82rem; font-weight: 850; color: #1e293b; text-transform: uppercase; letter-spacing: 0.01em;">$1</h5>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/- (.*)/g, '<div class="report-insight-item" style="margin-bottom: 0.4rem; padding: 0.6rem 0.75rem; font-size: 0.78rem;">• $1</div>');

      contentDiv.innerHTML = `
        ${scoreCardHTML}
        ${trendsHTML}
        <div style="border-top: 1px solid #e2e8f0; padding-top: 0.5rem; text-align: left;">
          ${formattedAIResponse}
        </div>
      `;
      Toast.show('AI Weekly Insights compiled successfully!', 'success');

    } catch (err) {
      console.error(err);
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: #ef4444; font-size: 0.82rem; border: 1px solid #fecaca; border-radius: 12px; background: #fef2f2;">
          <p style="margin: 0; font-weight: 600;">Failed to generate AI insights. Please check your connectivity and try again.</p>
        </div>
      `;
      Toast.show('AI Report generation failed.', 'error');
    } finally {
      if (btnAI) {
        btnAI.disabled = false;
        btnAI.textContent = 'Generate AI Insights';
      }
    }
  }

  // ── PDF Document Exporter using html2canvas & jsPDF ──────────────────
  async function exportPDF() {
    const reportSheet = document.getElementById('nutrition-report-print');
    if (!reportSheet) return;

    const btnPDF = document.getElementById('btn-export-pdf');
    if (btnPDF) {
      btnPDF.disabled = true;
      btnPDF.textContent = 'Rendering...';
    }

    try {
      // 1. Capture white report sheet as canvas
      const canvas = await html2canvas(reportSheet, {
        scale: 2, // High resolution crisp text rendering
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // 2. Initialize jsPDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate responsive dimensions to center A4 page perfectly
      const imgWidth = pageWidth - 20; // 10mm margins on left and right
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Top margin

      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Handle multi-page reports if text wraps extremely long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 3. Download the PDF
      pdf.save('NutriPlan-Lite-Weekly-Report.pdf');
      Toast.show('PDF Report downloaded successfully!', 'success');

    } catch (err) {
      console.error('PDF generation error:', err);
      Toast.show('Failed to generate PDF. Please try again.', 'error');
    } finally {
      if (btnPDF) {
        btnPDF.disabled = false;
        btnPDF.textContent = 'Download PDF';
      }
    }
  }

  // ── CSV Tabular Summaries Exporter ─────────────────────────────────
  function exportCSV() {
    const weeklyData = window.Storage.getWeeklyData();
    if (weeklyData.length === 0) {
      Toast.show('No weekly log data available to export.', 'warning');
      return;
    }

    try {
      // 1. Build CSV headers and rows
      const headers = ['Date', 'Day Label', 'Calories Consumed (kcal)', 'Protein (g)', 'Carbs (g)', 'Fats (g)', 'Hydration Intake (ml)'];
      const rows = weeklyData.map(d => [
        d.date,
        d.label,
        d.calories,
        d.protein,
        d.carbs,
        d.fat,
        d.water
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(val => `"${val}"`).join(','))
      ].join('\n');

      // 2. Download Blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `NutriPlan-Weekly-Intake-Summary.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Toast.show('CSV Intake Summary downloaded!', 'success');

    } catch (err) {
      console.error('CSV compilation error:', err);
      Toast.show('Failed to compile CSV spreadsheet.', 'error');
    }
  }

  // ── DOM Helpers ──────────────────────────────────────────────────
  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function setElMeta(id, val, color) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = val;
      el.style.color = color;
    }
  }

  // ── Wire up events ───────────────────────────────────────────────
  let initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;

    document.addEventListener('click', e => {
      if (e.target.closest('#btn-generate-report')) {
        openReportModal();
      } else if (e.target.closest('#close-report-x') || e.target.closest('#close-report-backdrop')) {
        closeReportModal();
      } else if (e.target.closest('#btn-export-pdf')) {
        exportPDF();
      } else if (e.target.closest('#btn-export-csv')) {
        exportCSV();
      } else if (e.target.closest('#btn-generate-ai-report')) {
        generateAIReport();
      }
    });
  }

  // ── Public APIs ──────────────────────────────────────────────────
  return {
    init,
    openReportModal,
    closeReportModal,
    exportPDF,
    exportCSV
  };
})();
