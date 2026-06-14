// ================================================================
// reminders.js — Smart Meal Reminder & Habit Tracking System
// NutriPlan-Lite
// ================================================================

window.Reminders = (() => {
  let globalSettings = {
    dndStart: "22:00",
    dndEnd: "07:00",
    soundEnabled: true,
    lastWaterNotificationTime: 0
  };

  let remindersState = {
    breakfast: { enabled: true, time: "08:00", label: "Breakfast" },
    lunch: { enabled: true, time: "13:00", label: "Lunch" },
    dinner: { enabled: true, time: "20:00", label: "Dinner" },
    snacks: { enabled: false, time: "16:00", label: "Snacks" },
    hydration: { enabled: true, interval: "2", label: "Hydration" } // interval in hours
  };

  let habitsState = [
    { id: "habit-log-meals", name: "Complete meal logging", desc: "Log breakfast, lunch, and dinner today.", points: 15, checked: false },
    { id: "habit-water-target", name: "Hit water goal", desc: "Meet your calculated daily hydration target.", points: 10, checked: false },
    { id: "habit-protein-floor", name: "protein floor baseline", desc: "Hit at least 85% of your target daily protein.", points: 15, checked: false },
    { id: "habit-calorie-bounds", name: "Stay in calorie budget", desc: "Do not exceed your target calories limit.", points: 20, checked: false }
  ];

  let schedulerTimer = null;

  function isDNDActive() {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = globalSettings.dndStart.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    
    const [endH, endM] = globalSettings.dndEnd.split(':').map(Number);
    const endTotal = endH * 60 + endM;

    if (startTotal <= endTotal) {
      return currentMins >= startTotal && currentMins < endTotal;
    } else {
      return currentMins >= startTotal || currentMins < endTotal;
    }
  }

  function hasLoggedMealToday(mealKey) {
    if (!window.Storage) return false;
    const dateKey = window.Storage.todayKey();
    const foods = window.Storage.getFoods(dateKey) || [];
    return foods.some(f => f.meal === mealKey);
  }

  function getSmartContextText(label) {
    if (label === "Hydration") {
      return "Time to hydrate! Grab a fresh glass of water to keep your hydration streak going.";
    }

    let text = `Time for your ${label}! Log your food intake in NutriPlan to keep your calorie goals aligned.`;
    
    if (!window.Storage) return text;
    
    // Streak motivation
    if (window.Storage.getStreak) {
      const streak = window.Storage.getStreak();
      if (streak >= 3) {
        text += ` 🔥 Day ${streak} streak! Log ${label} to keep it going.`;
      }
    }

    // Calorie context
    const dateKey = window.Storage.todayKey();
    const foods = window.Storage.getFoods(dateKey) || [];
    const consumedCal = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
    
    const profile = window.Storage.getProfile() || {};
    let targetCal = 0;
    if (window.Dashboard && window.Dashboard.computeTargets) {
      targetCal = window.Dashboard.computeTargets(profile).calories || 0;
    }

    if (targetCal > 0) {
      const pct = (consumedCal / targetCal) * 100;
      if (pct >= 80 && pct < 100) {
        text += ` You're ${Math.round(pct)}% to your calorie goal! Log ${label} to finish strong.`;
      }
    }

    return text;
  }

  // Schedule polling to check for custom notification alarms
  function startNotificationScheduler() {
    if (schedulerTimer) clearInterval(schedulerTimer);

    schedulerTimer = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMins}`;

      // Skip everything if Do Not Disturb is active
      if (isDNDActive()) return;

      Object.entries(remindersState).forEach(([key, config]) => {
        if (!config.enabled) return;

        if (key === 'hydration') {
          // Hydration interval logic
          const intervalMs = parseInt(config.interval) * 60 * 60 * 1000;
          if (now.getTime() - globalSettings.lastWaterNotificationTime >= intervalMs) {
             triggerNotification(config.label, key);
             globalSettings.lastWaterNotificationTime = now.getTime();
             saveGlobalSettings();
          }
        } else {
          // Exact time logic
          if (config.time === currentTime) {
            triggerNotification(config.label, key);
          }
        }
      });
    }, 60000); // Check once per minute
  }

  function triggerNotification(label, key, isPreview = false) {
    if (!isPreview) {
      if (key !== 'hydration' && hasLoggedMealToday(key)) {
        return; // Skip if already logged
      }
      if (isDNDActive()) {
        return; // Skip if DND
      }
    }

    const text = getSmartContextText(label);
    const title = `NutriPlan Reminder: ${label}`;
    const silentFlag = !globalSettings.soundEnabled;

    // 1. Try ServiceWorker Push Notification
    if ('serviceWorker' in navigator && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body: text,
          icon: "/favicon.ico",
          silent: silentFlag
        });
      }).catch(err => {
        // Fallback to basic notification
        new Notification(title, { body: text, icon: "/favicon.ico", silent: silentFlag });
      });
    } else if (Notification.permission === "granted") {
      // Basic browser notification fallback
      new Notification(title, { body: text, icon: "/favicon.ico", silent: silentFlag });
    }

    // 2. Trigger beautiful In-App Toast
    if (window.Toast) {
      window.Toast.show(`🔔 ${label} Reminder: ${text}`, "info", 5000);
    }
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      if (window.Toast) window.Toast.show("This browser does not support desktop notifications.", "warning");
      return false;
    }

    if (Notification.permission === "granted") return true;

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      if (window.Toast) window.Toast.show("Notifications enabled successfully!", "success");
      return true;
    } else {
      if (window.Toast) window.Toast.show("Notification permission denied.", "warning");
      return false;
    }
  }

  function saveGlobalSettings() {
    localStorage.setItem("np_reminders_global", JSON.stringify(globalSettings));
  }

  function saveRemindersState() {
    localStorage.setItem("np_reminders_schedule", JSON.stringify(remindersState));
  }

  function toggleReminder(key, enabled) {
    if (remindersState[key]) {
      remindersState[key].enabled = enabled;
      saveRemindersState();
      if (window.Toast) window.Toast.show(`${remindersState[key].label} reminder ${enabled ? 'enabled' : 'disabled'}.`, "info");
    }
  }

  function updateReminderTime(key, time) {
    if (remindersState[key]) {
      remindersState[key].time = time;
      saveRemindersState();
    }
  }

  function updateReminderInterval(key, interval) {
    if (remindersState[key]) {
      remindersState[key].interval = interval;
      saveRemindersState();
    }
  }

  // Load and save state routines
  function loadPersistedState() {
    const savedGlobal = localStorage.getItem("np_reminders_global");
    if (savedGlobal) {
      try {
        globalSettings = { ...globalSettings, ...JSON.parse(savedGlobal) };
      } catch (e) {
        console.error("Could not parse global settings", e);
      }
    }

    const savedSchedule = localStorage.getItem("np_reminders_schedule");
    if (savedSchedule) {
      try {
        const parsed = JSON.parse(savedSchedule);
        Object.keys(parsed).forEach(k => {
          if (remindersState[k]) {
             remindersState[k] = { ...remindersState[k], ...parsed[k] };
          }
        });
      } catch (e) {
        console.error("Could not parse reminders schedule", e);
      }
    }

    // Load Checklist states for the current selected day
    const dateKey = window.Tracker ? window.Tracker.currentDate : new Date().toISOString().split('T')[0];
    const savedHabits = localStorage.getItem(`np_habits_log_${dateKey}`);
    if (savedHabits) {
      try {
        const checkedIds = JSON.parse(savedHabits);
        habitsState.forEach(h => {
          h.checked = checkedIds.includes(h.id);
        });
      } catch (e) {
        console.error("Could not parse habits log", e);
      }
    } else {
      // Reset checklist default states for a new day
      habitsState.forEach(h => {
        h.checked = false;
      });
    }
  }

  function toggleHabit(id) {
    const habit = habitsState.find(x => x.id === id);
    if (habit) {
      habit.checked = !habit.checked;

      // Save Checked Checklist items to localStorage
      const dateKey = window.Tracker ? window.Tracker.currentDate : new Date().toISOString().split('T')[0];
      const checkedIds = habitsState.filter(x => x.checked).map(x => x.id);
      localStorage.setItem(`np_habits_log_${dateKey}`, JSON.stringify(checkedIds));

      if (window.Toast) window.Toast.show(`Habit updated: +${habit.points} consistency points earned!`, "success");
      
      render();
    }
  }

  function getHabitProgress() {
    if (habitsState.length === 0) return 0;
    const checked = habitsState.filter(x => x.checked).length;
    return Math.round((checked / habitsState.length) * 100);
  }

  function render() {
    const remindersContainer = document.getElementById("reminders-timeline");
    if (!remindersContainer) return;

    let schedulerHtml = "";
    Object.entries(remindersState).forEach(([key, config]) => {
      let inputHtml = "";
      if (key === 'hydration') {
        inputHtml = `
          <select class="scheduler-time-input" data-reminder-interval-key="${key}" style="max-width: 100px;">
            <option value="1" ${config.interval === "1" ? "selected" : ""}>Every 1 hr</option>
            <option value="2" ${config.interval === "2" ? "selected" : ""}>Every 2 hrs</option>
            <option value="3" ${config.interval === "3" ? "selected" : ""}>Every 3 hrs</option>
          </select>
        `;
      } else {
        inputHtml = `<input type="time" class="scheduler-time-input" data-reminder-time-key="${key}" value="${config.time}">`;
      }

      schedulerHtml += `
        <div class="scheduler-item">
          <div class="scheduler-item-left">
            <span class="scheduler-icon">${key === 'hydration' ? '💧' : '⏰'}</span>
            <div>
              <span class="scheduler-title">${config.label} Alert</span>
              <span class="scheduler-desc">Trigger a push notification alert.</span>
            </div>
          </div>
          <div class="scheduler-item-right" style="display:flex; align-items:center; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="secondary-button compact" data-preview-btn="${key}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">👀 Preview</button>
            ${inputHtml}
            <label class="switch">
              <input type="checkbox" data-reminder-switch-key="${key}" ${config.enabled ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `;
    });

    let habitsHtml = "";
    habitsState.forEach(h => {
      habitsHtml += `
        <div class="habit-item ${h.checked ? 'checked' : ''}" data-habit-id="${h.id}">
          <div class="habit-item-left">
            <div class="habit-checkbox"></div>
            <div>
              <span class="habit-name">${h.name}</span>
              <span class="habit-desc">${h.desc}</span>
            </div>
          </div>
          <span class="habit-points">+${h.points} pts</span>
        </div>
      `;
    });

    const progress = getHabitProgress();

    remindersContainer.innerHTML = `
      <div class="reminders-layout">
        <!-- Reminders Scheduler Card -->
        <div class="glass-panel reminders-card" style="margin-bottom: 2rem;">
          <div class="reminders-card-header">
            <h2>Smart Reminders</h2>
            <p>Schedule meal time triggers and fluid ingestion alerts to remain context-aware.</p>
          </div>
          
          <!-- Global Preferences -->
          <div class="glass-panel" style="background: rgba(0,0,0,0.02); border: 1px solid var(--line); margin-bottom: 1.5rem; padding: 1rem; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <strong>Do Not Disturb</strong>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="time" id="dnd-start" value="${globalSettings.dndStart}" class="scheduler-time-input">
                <span>to</span>
                <input type="time" id="dnd-end" value="${globalSettings.dndEnd}" class="scheduler-time-input">
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong>Notification Sound</strong>
              <label class="switch">
                <input type="checkbox" id="sound-toggle" ${globalSettings.soundEnabled ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <button id="reminders-btn-permission" class="secondary-button" style="margin-bottom:var(--space-xs);" type="button">🔔 Request Notification Permission</button>
          
          <div class="scheduler-list">
            ${schedulerHtml}
          </div>
        </div>

        <!-- Daily Habits Card -->
        <div class="glass-panel reminders-card">
          <div class="reminders-card-header">
            <h2>Habits Checklist</h2>
            <p>Log everyday baseline guidelines. Achieve consistency to advance streaks and compliance indices.</p>
          </div>
          <div class="reminders-progress-card">
            <div class="reminders-progress-info">
              <h4>Daily Compliance</h4>
              <p>Checked checklist points progress.</p>
            </div>
            <div class="reminders-progress-ring" id="reminders-progress-ring" style="--progress: ${progress}%">
              <span>${progress}%</span>
            </div>
          </div>
          <div class="habit-item-list" style="margin-top:var(--space-xs)">
            ${habitsHtml}
          </div>
        </div>
      </div>
    `;

    // Bind Global Preference inputs
    const dndStartEl = document.getElementById("dnd-start");
    if (dndStartEl) {
      dndStartEl.addEventListener("change", (e) => {
        globalSettings.dndStart = e.target.value;
        saveGlobalSettings();
      });
    }
    const dndEndEl = document.getElementById("dnd-end");
    if (dndEndEl) {
      dndEndEl.addEventListener("change", (e) => {
        globalSettings.dndEnd = e.target.value;
        saveGlobalSettings();
      });
    }
    const soundEl = document.getElementById("sound-toggle");
    if (soundEl) {
      soundEl.addEventListener("change", (e) => {
        globalSettings.soundEnabled = e.target.checked;
        saveGlobalSettings();
      });
    }

    // Bind Preview Buttons
    document.querySelectorAll("[data-preview-btn]").forEach(el => {
      el.addEventListener("click", () => {
        const key = el.dataset.previewBtn;
        const config = remindersState[key];
        // For preview, we force DND and log checks to be ignored via isPreview=true flag
        triggerNotification(config.label, key, true);
      });
    });

    // Bind Checklist elements
    document.querySelectorAll("[data-habit-id]").forEach(el => {
      el.addEventListener("click", () => {
        toggleHabit(el.dataset.habitId);
      });
    });

    // Bind toggle buttons
    document.querySelectorAll("[data-reminder-switch-key]").forEach(el => {
      el.addEventListener("change", (e) => {
        toggleReminder(el.dataset.reminderSwitchKey, e.target.checked);
      });
    });

    // Bind time inputs
    document.querySelectorAll("[data-reminder-time-key]").forEach(el => {
      el.addEventListener("change", (e) => {
        updateReminderTime(el.dataset.reminderTimeKey, e.target.value);
      });
    });

    // Bind interval inputs
    document.querySelectorAll("[data-reminder-interval-key]").forEach(el => {
      el.addEventListener("change", (e) => {
        updateReminderInterval(el.dataset.reminderIntervalKey, e.target.value);
      });
    });

    // Bind Permission Button
    const permBtn = document.getElementById("reminders-btn-permission");
    if (permBtn) {
      permBtn.addEventListener("click", requestNotificationPermission);
    }

    // Update Progress Ring rendering
    const ring = document.getElementById("reminders-progress-ring");
    if (ring) {
      ring.style.background = `conic-gradient(var(--accent) ${progress}%, rgba(148, 163, 184, 0.12) ${progress}%)`;
    }
  }

  function init() {
    loadPersistedState();
    render();
    startNotificationScheduler();
  }

  return { init, refresh: init };
})();
