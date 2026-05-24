// ================================================================
// storage.js — Persistent localStorage database layer
// NutriPlan-Lite
// ================================================================

const DB_KEY = 'nutriplan_v2';

const DEFAULT_PROFILE = {
  isSetup: false,
  name: 'User',
  age: 25,
  weight: 70,
  height: 175,
  gender: 'male',
  activity: 1.55,
  goal: 'maintain',
  macroSplit: 'balanced',
  customProtein: 25,
  customCarbs: 45,
  customFat: 30,
  waterTarget: 2500
};

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return createEmptyDB();
    const db = JSON.parse(raw);
    if (!db.profile) db.profile = { ...DEFAULT_PROFILE };
    if (!db.logs) db.logs = {};
    if (!db.settings) db.settings = { theme: 'dark', notifications: true };
    return db;
  } catch {
    return createEmptyDB();
  }
}

function createEmptyDB() {
  return {
    profile: { ...DEFAULT_PROFILE },
    logs: {},
    settings: { theme: 'dark', notifications: true }
  };
}

function saveDB(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

// ── API Sync Service Configuration ───────────────────────────────
const API_BASE_URL = 'http://localhost:4000/api/v1';
let authToken = localStorage.getItem('np_auth_token') || null;

async function initAuth() {
  if (authToken) return true;
  try {
    const creds = { email: 'user@nutriplan.com', password: 'DefaultPassword123!' };
    
    // Attempt Login
    let res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    
    if (res.status === 200) {
      const data = await res.json();
      authToken = data.data.token;
      localStorage.setItem('np_auth_token', authToken);
      return true;
    }
    
    // Attempt Registration if Login fails
    res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    
    if (res.status === 201) {
      const data = await res.json();
      authToken = data.data.token;
      localStorage.setItem('np_auth_token', authToken);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[API Sync] Auth initialization failed:', error);
    return false;
  }
}

async function syncFromServer(dateKey) {
  const authed = await initAuth();
  if (!authed) {
    console.warn('[API Sync] Server offline or unauthorized. Running in Local-Only Demo mode.');
    return;
  }
  
  try {
    console.log(`[API Sync] Starting remote fetch for date: ${dateKey}...`);
    
    // 1. Fetch Remote Profile
    const profileRes = await fetch(`${API_BASE_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      const p = profileData.data;
      if (p) {
        const mappedProfile = {
          age: p.age,
          weight: Number(p.weight),
          height: Number(p.height),
          gender: p.gender,
          activity: Number(p.activity_level),
          goal: p.fitness_goal,
          macroSplit: p.macro_split,
          customProtein: p.custom_protein !== null ? Number(p.custom_protein) : 25,
          customCarbs: p.custom_carbs !== null ? Number(p.custom_carbs) : 45,
          customFat: p.custom_fat !== null ? Number(p.custom_fat) : 30,
          waterTarget: p.water_target,
          isSetup: true
        };
        const db = loadDB();
        db.profile = { ...db.profile, ...mappedProfile };
        saveDB(db);
      }
    }
    
    // 2. Fetch Remote Food Logs
    const foodRes = await fetch(`${API_BASE_URL}/food-logs?date=${dateKey}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (foodRes.ok) {
      const foodData = await foodRes.json();
      const rows = foodData.data;
      if (Array.isArray(rows)) {
        const mappedFoods = rows.map(r => ({
          id: r.id,
          timestamp: r.created_at || new Date().toISOString(),
          name: r.food_name,
          meal: r.meal_type,
          quantity: Number(r.quantity_grams),
          calories: Number(r.calories),
          protein: Number(r.protein),
          carbs: Number(r.carbs),
          fat: Number(r.fat)
        }));
        const db = loadDB();
        if (!db.logs[dateKey]) db.logs[dateKey] = { foods: [], water: 0 };
        db.logs[dateKey].foods = mappedFoods;
        saveDB(db);
      }
    }
    
    // 3. Fetch Remote Water Logs
    const waterRes = await fetch(`${API_BASE_URL}/water-logs?date=${dateKey}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (waterRes.ok) {
      const waterData = await waterRes.json();
      const rows = waterData.data;
      if (Array.isArray(rows)) {
        const totalWater = rows.reduce((acc, r) => acc + Number(r.amount_ml), 0);
        const db = loadDB();
        if (!db.logs[dateKey]) db.logs[dateKey] = { foods: [], water: 0 };
        db.logs[dateKey].water = totalWater;
        saveDB(db);
      }
    }
    
    console.log('[API Sync] Synchronization complete.');
    if (window.App && window.App.refresh) {
      window.App.refresh();
    }
  } catch (error) {
    console.error('[API Sync] Sync failed:', error);
  }
}

// ── Profile ──────────────────────────────────────────────────────

function getProfile() {
  return loadDB().profile;
}

function saveProfile(updates) {
  const db = loadDB();
  db.profile = { ...db.profile, ...updates };
  saveDB(db);
  
  // Asynchronously save profile to remote server
  (async () => {
    const authed = await initAuth();
    if (!authed) return;
    try {
      const p = db.profile;
      const apiBody = {
        age: p.age,
        weight: p.weight,
        height: p.height,
        gender: p.gender,
        activity_level: p.activity,
        fitness_goal: p.goal,
        macro_split: p.macroSplit,
        custom_protein: p.customProtein,
        custom_carbs: p.customCarbs,
        custom_fat: p.customFat,
        water_target: p.waterTarget
      };
      await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiBody)
      });
    } catch (e) {
      console.error('[API Sync] Failed to update profile on server:', e);
    }
  })();
  
  return db.profile;
}

// ── Day log helpers ───────────────────────────────────────────────

function todayKey() {
  return getLocalDateString(new Date());
}

function getLocalDateString(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
}

function getDayLog(dateKey) {
  const db = loadDB();
  if (!db.logs[dateKey]) {
    db.logs[dateKey] = { foods: [], water: 0 };
  }
  return db.logs[dateKey];
}

function saveDayLog(dateKey, dayLog) {
  const db = loadDB();
  db.logs[dateKey] = dayLog;
  saveDB(db);
}

// ── Food entries ──────────────────────────────────────────────────

function getFoods(dateKey) {
  return getDayLog(dateKey).foods || [];
}

function addFood(dateKey, entry) {
  const db = loadDB();
  if (!db.logs[dateKey]) db.logs[dateKey] = { foods: [], water: 0 };
  const food = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };
  db.logs[dateKey].foods.push(food);
  saveDB(db);
  
  // Asynchronously save food log to remote server
  (async () => {
    const authed = await initAuth();
    if (!authed) return;
    try {
      const apiBody = {
        log_date: dateKey,
        meal_type: entry.meal,
        food_name: entry.name,
        quantity_grams: entry.quantity,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat
      };
      
      const res = await fetch(`${API_BASE_URL}/food-logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiBody)
      });
      if (res.ok) {
        const data = await res.json();
        // Update local id to map to database UUID
        if (data.data && data.data.id) {
          const freshDb = loadDB();
          const list = freshDb.logs[dateKey].foods;
          const idx = list.findIndex(f => f.id === food.id);
          if (idx !== -1) {
            list[idx].id = data.data.id;
            saveDB(freshDb);
            if (window.App && window.App.refresh) window.App.refresh();
          }
        }
      }
    } catch (e) {
      console.error('[API Sync] Failed to save food entry on server:', e);
    }
  })();
  
  return food;
}

function updateFood(dateKey, id, updates) {
  const db = loadDB();
  if (!db.logs[dateKey]) return;
  const idx = db.logs[dateKey].foods.findIndex(f => f.id === id);
  if (idx !== -1) {
    db.logs[dateKey].foods[idx] = { ...db.logs[dateKey].foods[idx], ...updates };
    saveDB(db);
    
    // Asynchronously update food log on remote server
    (async () => {
      const authed = await initAuth();
      if (!authed) return;
      try {
        const entry = db.logs[dateKey].foods[idx];
        const apiBody = {
          meal_type: entry.meal,
          food_name: entry.name,
          quantity_grams: entry.quantity,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat
        };
        
        await fetch(`${API_BASE_URL}/food-logs/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiBody)
        });
      } catch (e) {
        console.error('[API Sync] Failed to update food entry on server:', e);
      }
    })();
  }
}

function deleteFood(dateKey, id) {
  const db = loadDB();
  if (!db.logs[dateKey]) return;
  db.logs[dateKey].foods = db.logs[dateKey].foods.filter(f => f.id !== id);
  saveDB(db);
  
  // Asynchronously delete food log on remote server
  (async () => {
    const authed = await initAuth();
    if (!authed) return;
    try {
      await fetch(`${API_BASE_URL}/food-logs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    } catch (e) {
      console.error('[API Sync] Failed to delete food entry on server:', e);
    }
  })();
}

// ── Hydration ─────────────────────────────────────────────────────

function getWater(dateKey) {
  return getDayLog(dateKey).water || 0;
}

function addWater(dateKey, ml) {
  const db = loadDB();
  if (!db.logs[dateKey]) db.logs[dateKey] = { foods: [], water: 0 };
  db.logs[dateKey].water = (db.logs[dateKey].water || 0) + ml;
  saveDB(db);
  
  // Asynchronously save water log on remote server
  (async () => {
    const authed = await initAuth();
    if (!authed) return;
    try {
      await fetch(`${API_BASE_URL}/water-logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          log_date: dateKey,
          amount_ml: ml
        })
      });
    } catch (e) {
      console.error('[API Sync] Failed to save water log on server:', e);
    }
  })();
  
  return db.logs[dateKey].water;
}

function setWater(dateKey, ml) {
  const db = loadDB();
  if (!db.logs[dateKey]) db.logs[dateKey] = { foods: [], water: 0 };
  db.logs[dateKey].water = ml;
  saveDB(db);
  
  // Asynchronously reset water logs on remote server if set to 0
  if (ml === 0) {
    (async () => {
      const authed = await initAuth();
      if (!authed) return;
      try {
        await fetch(`${API_BASE_URL}/water-logs?date=${dateKey}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (e) {
        console.error('[API Sync] Failed to reset water logs on server:', e);
      }
    })();
  }
}

// ── Weekly data for analytics ─────────────────────────────────────

function getWeeklyData() {
  const db = loadDB();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = getLocalDateString(d);
    const log = db.logs[key] || { foods: [], water: 0 };
    const calories = log.foods.reduce((s, f) => s + (f.calories || 0), 0);
    const protein = log.foods.reduce((s, f) => s + (f.protein || 0), 0);
    const carbs = log.foods.reduce((s, f) => s + (f.carbs || 0), 0);
    const fat = log.foods.reduce((s, f) => s + (f.fat || 0), 0);
    result.push({
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      water: log.water || 0
    });
  }
  return result;
}

// ── Settings ──────────────────────────────────────────────────────

function getSettings() {
  return loadDB().settings;
}

function saveSettings(updates) {
  const db = loadDB();
  db.settings = { ...db.settings, ...updates };
  saveDB(db);
}

// ── Streak calculation ────────────────────────────────────────────

function getStreak() {
  const db = loadDB();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getLocalDateString(d);
    const log = db.logs[key];
    if (log && log.foods && log.foods.length > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Export as global
window.Storage = {
  getProfile, saveProfile,
  getFoods, addFood, updateFood, deleteFood,
  getWater, addWater, setWater,
  getDayLog, saveDayLog,
  getWeeklyData,
  getSettings, saveSettings,
  getStreak,
  todayKey, getLocalDateString,
  syncFromServer
};
