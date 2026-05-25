// ═══════════════════════════════════════════════════════════════
//  NutriPlan Lite — script.js
//  Fully wired: calorie ring, macro % badges, water tracker,
//  keyboard shortcuts, daily reset, visual feedback.
//  Macro ratios based on NIH DRI (PMC4121911):
//    Carbs 45%, Protein 25%, Fat 30% of total kcal.
// ═══════════════════════════════════════════════════════════════

// ── Food database ────────────────────────────────────────────
let foodDB = {};
let foodDbLoaded = false;

const fallbackFoodDB = {
    apple:            { cal: 52,  carbs: 14,   protein: 0.3,  fat: 0.2  },
    banana:           { cal: 89,  carbs: 23,   protein: 1.1,  fat: 0.3  },
    orange:           { cal: 47,  carbs: 12,   protein: 0.9,  fat: 0.1  },
    mango:            { cal: 60,  carbs: 15,   protein: 0.8,  fat: 0.4  },
    grapes:           { cal: 69,  carbs: 18,   protein: 0.7,  fat: 0.2  },
    strawberry:       { cal: 32,  carbs: 7.7,  protein: 0.7,  fat: 0.3  },
    watermelon:       { cal: 30,  carbs: 7.6,  protein: 0.6,  fat: 0.2  },
    'chicken breast': { cal: 165, carbs: 0,    protein: 31,   fat: 3.6  },
    'chicken thigh':  { cal: 209, carbs: 0,    protein: 26,   fat: 11   },
    salmon:           { cal: 208, carbs: 0,    protein: 20,   fat: 13   },
    tuna:             { cal: 132, carbs: 0,    protein: 28,   fat: 1.0  },
    egg:              { cal: 155, carbs: 1.1,  protein: 13,   fat: 11   },
    'egg white':      { cal: 52,  carbs: 0.7,  protein: 11,   fat: 0.2  },
    rice:             { cal: 130, carbs: 28,   protein: 2.7,  fat: 0.3  },
    'brown rice':     { cal: 112, carbs: 23.5, protein: 2.6,  fat: 0.9  },
    oats:             { cal: 389, carbs: 66,   protein: 16.9, fat: 6.9  },
    bread:            { cal: 265, carbs: 49,   protein: 9,    fat: 3.2  },
    pasta:            { cal: 131, carbs: 25,   protein: 5,    fat: 1.1  },
    quinoa:           { cal: 120, carbs: 21.3, protein: 4.4,  fat: 1.9  },
    milk:             { cal: 42,  carbs: 5,    protein: 3.4,  fat: 1    },
    'greek yogurt':   { cal: 59,  carbs: 3.6,  protein: 10,   fat: 0.4  },
    paneer:           { cal: 265, carbs: 1.2,  protein: 18,   fat: 20   },
    tofu:             { cal: 76,  carbs: 1.9,  protein: 8,    fat: 4.8  },
    almonds:          { cal: 579, carbs: 22,   protein: 21,   fat: 49   },
    walnuts:          { cal: 654, carbs: 14,   protein: 15,   fat: 65   },
    'peanut butter':  { cal: 588, carbs: 20,   protein: 25,   fat: 50   },
    broccoli:         { cal: 34,  carbs: 7,    protein: 2.8,  fat: 0.4  },
    spinach:          { cal: 23,  carbs: 3.6,  protein: 2.9,  fat: 0.4  },
    carrot:           { cal: 41,  carbs: 10,   protein: 0.9,  fat: 0.2  },
    potato:           { cal: 77,  carbs: 17,   protein: 2,    fat: 0.1  },
    'sweet potato':   { cal: 86,  carbs: 20,   protein: 1.6,  fat: 0.1  },
    avocado:          { cal: 160, carbs: 9,    protein: 2,    fat: 15   },
    'olive oil':      { cal: 884, carbs: 0,    protein: 0,    fat: 100  },
    butter:           { cal: 717, carbs: 0.1,  protein: 0.9,  fat: 81   },
    cheese:           { cal: 402, carbs: 1.3,  protein: 25,   fat: 33   },
    beef:             { cal: 250, carbs: 0,    protein: 26,   fat: 15   },
    lentils:          { cal: 116, carbs: 20,   protein: 9,    fat: 0.4  },
    chickpeas:        { cal: 164, carbs: 27,   protein: 9,    fat: 2.6  },
    'black beans':    { cal: 132, carbs: 24,   protein: 8.9,  fat: 0.5  },
};

// ── App State ─────────────────────────────────────────────────
let appState = {
    profile:         { age: 25, weight: 70, height: 175, gender: 'male', activity: '1.2' },
    currentTarget:   2000,
    targetMacros:    { carbs: 225, protein: 125, fat: 67 },
    currentConsumed: 0,
    consumedMacros:  { carbs: 0, protein: 0, fat: 0 },
    loggedEntries:   [],
    waterTarget:     2500,
    waterConsumed:   0,
    lastResetDate:   new Date().toDateString()
};

// ── Macro info (NIH PMC4121911) ───────────────────────────────
const _macroInfo = {
    protein: {
        title: 'Protein — 25% of daily calories',
        text:  'Per NIH DRI (PMC4121911), protein should provide ~25% of total energy. It supports muscle synthesis, enzyme production, and immunity. Aim for 0.8–1.2 g per kg bodyweight.'
    },
    carbs: {
        title: 'Carbohydrates — 45% of daily calories',
        text:  'NIH DRI recommends 45–65% of energy from carbohydrates (PMC4121911). They are the brain\'s primary fuel. Choose complex carbs (whole grains, legumes) over refined sugars.'
    },
    fats: {
        title: 'Fats — 30% of daily calories',
        text:  'Dietary fat should supply 20–35% of energy per NIH DRI (PMC4121911). Essential for vitamins A, D, E, K and hormone production. Prefer unsaturated fats (olive oil, nuts, fish).'
    }
};
let _openMacro = null;

// ── Initialisation ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    loadFromLocalStorage();
    checkDailyReset();
    refreshUI();
    setupKeyboardShortcuts();
    setupAutocompleteDismissal();
    setupWaterButtonFeedback();
    await initFoodDB();
});

// ── localStorage ──────────────────────────────────────────────
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('nutriPlanState');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge to keep defaults for any new fields
            appState = { ...appState, ...parsed };
            appState.profile       = { ...appState.profile,       ...(parsed.profile       || {}) };
            appState.targetMacros  = { ...appState.targetMacros,  ...(parsed.targetMacros  || {}) };
            appState.consumedMacros= { ...appState.consumedMacros,...(parsed.consumedMacros || {}) };
        } else {
            calculateMacros();
        }
    } catch (e) {
        console.error('localStorage load failed', e);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('nutriPlanState', JSON.stringify(appState));
    } catch (e) {
        console.error('localStorage save failed', e);
    }
}

// ── Daily auto-reset ─────────────────────────────────────────
function checkDailyReset() {
    const today = new Date().toDateString();
    if (appState.lastResetDate && appState.lastResetDate !== today) {
        // New day — reset consumed values only
        appState.currentConsumed = 0;
        appState.consumedMacros  = { carbs: 0, protein: 0, fat: 0 };
        appState.loggedEntries   = [];
        appState.waterConsumed   = 0;
        appState.lastResetDate   = today;
        saveToLocalStorage();
    }
    // Always stamp today
    if (!appState.lastResetDate) {
        appState.lastResetDate = today;
        saveToLocalStorage();
    }
}

// ── Food DB ───────────────────────────────────────────────────
async function initFoodDB() {
    foodDB = { ...fallbackFoodDB };
    try {
        const apiUrl = `${window.location.origin}/api/food-db`;
        const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
        if (res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
                foodDB = { ...fallbackFoodDB, ...data };
                foodDbLoaded = true;
            }
        }
    } catch (_) {
        // Offline / no server — fallbackFoodDB is used
    }
    refreshUI();
}

function getFoodInfo(nameLower) {
    if (foodDB[nameLower]) return foodDB[nameLower];
    const key = Object.keys(foodDB).find(k => k.toLowerCase() === nameLower);
    return key ? foodDB[key] : null;
}

// ── Profile & macros ─────────────────────────────────────────
function calculateMacros() {
    const { age, weight, height, gender, activity } = appState.profile;
    if (!age || !weight || !height) return;

    // Mifflin–St Jeor BMR (NIH recommended)
    const bmr = gender === 'female'
        ? 10 * weight + 6.25 * height - 5 * age - 161
        : 10 * weight + 6.25 * height - 5 * age + 5;

    appState.currentTarget = Math.round(bmr * parseFloat(activity));

    // NIH DRI ratios: Carbs 45%, Protein 25%, Fat 30%
    appState.targetMacros.carbs   = Math.round((appState.currentTarget * 0.45) / 4);
    appState.targetMacros.protein = Math.round((appState.currentTarget * 0.25) / 4);
    appState.targetMacros.fat     = Math.round((appState.currentTarget * 0.30) / 9);

    // Recommended water: ~35 ml/kg/day (WHO guideline)
    appState.waterTarget = Math.round(weight * 35);
}

function updatePlan() {
    const age      = parseFloat(document.getElementById('age').value);
    const weight   = parseFloat(document.getElementById('weight').value);
    const height   = parseFloat(document.getElementById('height').value);
    const gender   = document.getElementById('gender').value;
    const activity = document.getElementById('activity').value;

    if (!age || !weight || !height) {
        showToast('Please fill in all profile fields.', 'warn'); return;
    }
    if (height < 50 || height > 300) {
        showToast('Height must be between 50–300 cm.', 'warn'); return;
    }
    if (weight < 20 || weight > 300) {
        showToast('Weight must be between 20–300 kg.', 'warn'); return;
    }
    if (age < 5 || age > 120) {
        showToast('Age must be between 5–120 years.', 'warn'); return;
    }

    appState.profile = { age, weight, height, gender, activity };
    calculateMacros();
    saveToLocalStorage();
    refreshUI();
    showToast('✓ Goals updated!', 'success');
}

// ── Food logging ──────────────────────────────────────────────
function recalculateTotals() {
    appState.currentConsumed = 0;
    appState.consumedMacros  = { carbs: 0, protein: 0, fat: 0 };
    appState.loggedEntries.forEach(e => {
        appState.currentConsumed      += e.cal;
        appState.consumedMacros.carbs   += e.carbs;
        appState.consumedMacros.protein += e.protein;
        appState.consumedMacros.fat     += e.fat;
    });
    appState.consumedMacros.carbs   = Math.round(appState.consumedMacros.carbs   * 10) / 10;
    appState.consumedMacros.protein = Math.round(appState.consumedMacros.protein * 10) / 10;
    appState.consumedMacros.fat     = Math.round(appState.consumedMacros.fat     * 10) / 10;
}

function addEntry() {
    const inputEl = document.getElementById('food-input');
    const qtyEl   = document.getElementById('qty-input');
    const name    = (inputEl.value || '').toLowerCase().trim();
    const qty     = parseFloat(qtyEl.value) || 100;

    if (!name) { inputEl.focus(); return; }

    let base = getFoodInfo(name) || { cal: 150, carbs: 15, protein: 10, fat: 5 };
    const f  = qty / 100;
    const entry = {
        id:      Date.now().toString(),
        name,
        qty,
        cal:     Math.round(base.cal     * f),
        carbs:   Math.round(base.carbs   * f * 10) / 10,
        protein: Math.round(base.protein * f * 10) / 10,
        fat:     Math.round(base.fat     * f * 10) / 10
    };

    appState.loggedEntries.push(entry);
    recalculateTotals();
    saveToLocalStorage();
    refreshUI();

    inputEl.value = '';
    qtyEl.value   = '';
    hideSuggestions();
    inputEl.focus();
    showToast(`+${entry.cal} kcal from ${name}`, 'success');
}

function editEntry(id) {
    const entry = appState.loggedEntries.find(e => e.id === id);
    if (!entry) return;
    const newQtyStr = prompt(`New quantity (grams) for ${entry.name}:`, entry.qty);
    if (newQtyStr === null) return;
    const newQty = parseFloat(newQtyStr);
    if (isNaN(newQty) || newQty <= 0) { showToast('Enter a valid positive number.', 'warn'); return; }

    const base = getFoodInfo(entry.name) || { cal: 150, carbs: 15, protein: 10, fat: 5 };
    const f    = newQty / 100;
    entry.qty     = newQty;
    entry.cal     = Math.round(base.cal     * f);
    entry.carbs   = Math.round(base.carbs   * f * 10) / 10;
    entry.protein = Math.round(base.protein * f * 10) / 10;
    entry.fat     = Math.round(base.fat     * f * 10) / 10;

    recalculateTotals();
    saveToLocalStorage();
    refreshUI();
}

function deleteEntry(id) {
    appState.loggedEntries = appState.loggedEntries.filter(e => e.id !== id);
    recalculateTotals();
    saveToLocalStorage();
    refreshUI();
}

// ── Water ─────────────────────────────────────────────────────
function addWater(amount) {
    appState.waterConsumed += amount;
    saveToLocalStorage();
    refreshUI();
    showToast(`+${amount} ml water`, 'water');
}

function resetWater() {
    appState.waterConsumed = 0;
    saveToLocalStorage();
    refreshUI();
}

function addCustomWater() {
    const el  = document.getElementById('custom-water-input');
    const val = parseFloat(el.value);
    if (!val || val <= 0 || val > 5000) {
        showToast('Enter a value between 1–5000 ml.', 'warn'); return;
    }
    addWater(Math.round(val));
    el.value = '';
}

function setWaterTarget() {
    const el  = document.getElementById('water-target-input');
    const val = parseFloat(el.value);
    if (!val || val < 500 || val > 6000) {
        showToast('Target must be 500–6000 ml.', 'warn'); return;
    }
    appState.waterTarget = Math.round(val);
    saveToLocalStorage();
    refreshUI();
    showToast(`Water target set to ${appState.waterTarget} ml`, 'success');
    el.value = '';
}

// ── Macro card detail popup ───────────────────────────────────
function toggleMacroDetail(type) {
    const popup  = document.getElementById('macro-detail-popup');
    const textEl = document.getElementById('macro-detail-text');
    if (!popup || !textEl) return;

    // Highlight active card
    ['protein','carbs','fats'].forEach(t => {
        const btn = document.getElementById(`macro-${t}-btn`);
        if (btn) btn.setAttribute('data-active', t === type && _openMacro !== type ? 'true' : 'false');
    });

    if (_openMacro === type) {
        popup.style.maxHeight = '0';
        popup.style.opacity   = '0';
        setTimeout(() => popup.classList.add('hidden'), 250);
        _openMacro = null;
        return;
    }

    _openMacro = type;
    const info = _macroInfo[type];
    textEl.innerHTML = `<strong class="block mb-1" style="color:#fff;opacity:0.85">${info.title}</strong>${info.text}`;
    popup.classList.remove('hidden');
    // Animate open
    requestAnimationFrame(() => {
        popup.style.maxHeight = '200px';
        popup.style.opacity   = '1';
    });
}

// ── Autocomplete ──────────────────────────────────────────────
function showSuggestions() {
    const inputEl = document.getElementById('food-input');
    const listEl  = document.getElementById('autocomplete-list');
    const query   = (inputEl.value || '').toLowerCase().trim();

    if (!query) { hideSuggestions(); return; }

    const matches = Object.keys(foodDB).filter(k => k.includes(query)).slice(0, 6);
    if (!matches.length) { hideSuggestions(); return; }

    listEl.innerHTML = '';
    matches.forEach(match => {
        const item = foodDB[match];
        const div  = document.createElement('div');
        div.className = 'p-3 hover:bg-white/10 cursor-pointer flex justify-between items-center text-sm transition-colors border-b border-white/5 last:border-0';
        div.innerHTML = `
            <span class="capitalize font-semibold text-white/90">${match}</span>
            <span class="text-xs text-white/40 flex gap-2">
                <span class="text-[#00ff66]">${item.cal} kcal</span>
                <span>P:${item.protein}g</span>
                <span>C:${item.carbs}g</span>
                <span>F:${item.fat}g</span>
            </span>`;
        div.addEventListener('click', () => {
            inputEl.value = match;
            hideSuggestions();
            document.getElementById('qty-input').focus();
        });
        listEl.appendChild(div);
    });
    listEl.classList.remove('hidden');
}

function hideSuggestions() {
    const listEl = document.getElementById('autocomplete-list');
    if (listEl) listEl.classList.add('hidden');
}

function setupAutocompleteDismissal() {
    document.addEventListener('click', e => {
        const inputEl = document.getElementById('food-input');
        const listEl  = document.getElementById('autocomplete-list');
        if (!listEl) return;
        if (e.target !== inputEl && !listEl.contains(e.target)) hideSuggestions();
    });
}

// ── Keyboard shortcuts ────────────────────────────────────────
function setupKeyboardShortcuts() {
    // Enter on food-input → addEntry
    const foodInput = document.getElementById('food-input');
    if (foodInput) {
        foodInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); addEntry(); }
        });
    }

    // Enter on qty-input → addEntry
    const qtyInput = document.getElementById('qty-input');
    if (qtyInput) {
        qtyInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); addEntry(); }
        });
    }

    // Enter on custom-water-input → addCustomWater
    const customWaterInput = document.getElementById('custom-water-input');
    if (customWaterInput) {
        customWaterInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); addCustomWater(); }
        });
    }

    // Enter on water-target-input → setWaterTarget
    const waterTargetInput = document.getElementById('water-target-input');
    if (waterTargetInput) {
        waterTargetInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); setWaterTarget(); }
        });
    }
}

// ── Water button visual pulse feedback ────────────────────────
function setupWaterButtonFeedback() {
    document.querySelectorAll('.water-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.add('scale-95');
            setTimeout(() => btn.classList.remove('scale-95'), 150);
        });
    });
}

// ── Toast notification ────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = 'success') {
    let toast = document.getElementById('np-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'np-toast';
        toast.style.cssText = `
            position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(80px);
            padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700;
            z-index:9999; transition:transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s;
            opacity:0; white-space:nowrap; pointer-events:none;
            backdrop-filter:blur(12px);
        `;
        document.body.appendChild(toast);
    }

    const styles = {
        success: { bg: 'rgba(0,255,102,0.15)', border: '1px solid rgba(0,255,102,0.4)', color: '#00ff66' },
        warn:    { bg: 'rgba(255,159,10,0.15)', border: '1px solid rgba(255,159,10,0.4)', color: '#ff9f0a' },
        water:   { bg: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.4)', color: '#00f0ff' },
    };
    const s = styles[type] || styles.success;
    toast.style.background = s.bg;
    toast.style.border      = s.border;
    toast.style.color       = s.color;
    toast.textContent       = msg;

    // Show
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity   = '1';
    });

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(80px)';
        toast.style.opacity   = '0';
    }, 2400);
}

// ── Main UI refresh ───────────────────────────────────────────
function refreshUI() {
    // Profile inputs
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('age',      appState.profile.age      || '');
    set('weight',   appState.profile.weight   || '');
    set('height',   appState.profile.height   || '');
    set('gender',   appState.profile.gender   || 'male');
    set('activity', appState.profile.activity || '1.2');

    // ── Calorie ring ──────────────────────────────────────────
    const calPct = appState.currentTarget > 0
        ? Math.min(100, (appState.currentConsumed / appState.currentTarget) * 100) : 0;

    setText('consumed-val', appState.currentConsumed);
    setText('target-val',   appState.currentTarget);
    setText('calorie-pct-label', Math.round(calPct) + '%');

    const ringEl = document.getElementById('calorie-ring');
    if (ringEl) {
        ringEl.setAttribute('stroke-dasharray', `${calPct.toFixed(1)} 100`);
        const over = appState.currentConsumed >= appState.currentTarget && appState.currentTarget > 0;
        ringEl.setAttribute('stroke', over ? '#ff375f' : 'url(#calRingGrad)');
    }

    // Legacy progress bar
    setStyle('progress-bar', 'width', calPct + '%');

    // Target achieved banner
    const msgEl = document.getElementById('target-message');
    if (msgEl) msgEl.classList.toggle('hidden',
        !(appState.currentConsumed >= appState.currentTarget && appState.currentTarget > 0));

    // ── Protein ───────────────────────────────────────────────
    const protPct = pct(appState.consumedMacros.protein, appState.targetMacros.protein);
    setText('protein-consumed', Math.round(appState.consumedMacros.protein));
    setText('protein-target',   appState.targetMacros.protein);
    setStyle('protein-bar', 'width', protPct + '%');
    setBadge('protein-pct-badge', protPct, 'rgba(255,159,10,');

    // ── Carbs ─────────────────────────────────────────────────
    const carbPct = pct(appState.consumedMacros.carbs, appState.targetMacros.carbs);
    setText('carbs-consumed', Math.round(appState.consumedMacros.carbs));
    setText('carbs-target',   appState.targetMacros.carbs);
    setStyle('carbs-bar', 'width', carbPct + '%');
    setBadge('carbs-pct-badge', carbPct, 'rgba(0,210,255,');

    // ── Fats ──────────────────────────────────────────────────
    const fatPct = pct(appState.consumedMacros.fat, appState.targetMacros.fat);
    setText('fats-consumed', Math.round(appState.consumedMacros.fat));
    setText('fats-target',   appState.targetMacros.fat);
    setStyle('fats-bar', 'width', fatPct + '%');
    setBadge('fats-pct-badge', fatPct, 'rgba(255,55,95,');

    // ── Water ─────────────────────────────────────────────────
    const waterPct = appState.waterTarget > 0
        ? Math.min(100, (appState.waterConsumed / appState.waterTarget) * 100) : 0;

    setText('water-consumed', appState.waterConsumed);
    setText('water-target',   appState.waterTarget);
    setStyle('water-fill',          'height', waterPct + '%');
    setStyle('water-progress-bar',  'width',  waterPct + '%');
    setText('water-pct-label', Math.round(waterPct) + '%');

    const glassEl = document.getElementById('water-glass-label');
    if (glassEl) {
        if      (waterPct === 0)   glassEl.textContent = '';
        else if (waterPct < 30)    glassEl.textContent = 'Low';
        else if (waterPct < 60)    glassEl.textContent = 'Good';
        else if (waterPct < 100)   glassEl.textContent = 'Great';
        else                       glassEl.textContent = '✓ Done';
    }

    // ── Food log ──────────────────────────────────────────────
    const logList = document.getElementById('log-list');
    if (!logList) return;

    if (!appState.loggedEntries.length) {
        logList.innerHTML = '<p class="text-center text-white/30 py-10 font-medium italic">Your daily log is empty — add a food above ↑</p>';
        return;
    }

    logList.innerHTML = '';
    for (let i = appState.loggedEntries.length - 1; i >= 0; i--) {
        const entry = appState.loggedEntries[i];
        const div   = document.createElement('div');
        div.className = 'flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group hover:border-[#00ff66]/30';
        div.innerHTML = `
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <span class="capitalize font-bold text-base tracking-tight truncate text-white">${entry.name}</span>
                    <span class="text-[10px] text-white/40 uppercase font-black tracking-widest bg-white/5 px-2 py-0.5 rounded-full">${entry.qty}g</span>
                </div>
                <div class="text-[11px] text-white/40 mt-1 flex gap-3">
                    <span>P: <strong class="text-[#ff9f0a]">${entry.protein}g</strong></span>
                    <span>C: <strong class="text-[#00d2ff]">${entry.carbs}g</strong></span>
                    <span>F: <strong class="text-[#ff375f]">${entry.fat}g</strong></span>
                </div>
            </div>
            <div class="flex items-center gap-1">
                <div class="text-right mr-1">
                    <span class="text-[#00ff66] font-black text-lg">+${entry.cal}</span>
                    <span class="text-[10px] text-[#00ff66]/50 font-black ml-0.5">kcal</span>
                </div>
                <button onclick="editEntry('${entry.id}')"
                    class="text-white/20 hover:text-[#ff9f0a] p-2 rounded-xl hover:bg-white/5 transition-all" title="Edit">
                    <i class="fas fa-pen text-sm"></i>
                </button>
                <button onclick="deleteEntry('${entry.id}')"
                    class="text-white/20 hover:text-[#ff375f] p-2 rounded-xl hover:bg-white/5 transition-all" title="Delete">
                    <i class="fas fa-trash-alt text-sm"></i>
                </button>
            </div>`;
        logList.appendChild(div);
    }
}

// ── Helpers ───────────────────────────────────────────────────
function pct(consumed, target) {
    return target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
}
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
}
function setStyle(id, prop, val) {
    const el = document.getElementById(id);
    if (el) el.style[prop] = val;
}
function setBadge(id, pctVal, colorPrefix) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = pctVal + '%';
    el.style.background = pctVal >= 100
        ? colorPrefix + '0.4)' : colorPrefix + '0.15)';
}

// ── Identity dropdown + AI planner form ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const dropdownBtn    = document.getElementById('identity-dropdown-btn');
    const dropdownMenu   = document.getElementById('identity-dropdown-menu');
    const dropdownChevron= document.getElementById('identity-dropdown-chevron');
    const selectedLabel  = document.getElementById('identity-selected-label');
    const hiddenInput    = document.getElementById('identity-input');
    const options        = document.querySelectorAll('.identity-option');

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', e => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
            if (dropdownChevron) dropdownChevron.classList.toggle('rotate-180');
        });

        options.forEach(opt => {
            opt.addEventListener('click', () => {
                if (selectedLabel) selectedLabel.textContent = opt.textContent;
                if (hiddenInput)   hiddenInput.value         = opt.getAttribute('data-value');
                dropdownMenu.classList.add('hidden');
                if (dropdownChevron) dropdownChevron.classList.remove('rotate-180');
            });
        });

        document.addEventListener('click', e => {
            if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
                if (dropdownChevron) dropdownChevron.classList.remove('rotate-180');
            }
        });
    }

    const plannerForm = document.getElementById('ai-planner-form');
    if (plannerForm) {
        plannerForm.addEventListener('submit', e => {
            e.preventDefault();
            const identity = document.getElementById('identity-input').value;
            window.open('ai-plan.html?identity=' + identity, '_blank');
        });
    }

    // Year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});
