// Extended food database with macronutrients per 100g
const foodDB = {
    'apple': { cal: 52, carbs: 14, protein: 0.3, fat: 0.2 },
    'banana': { cal: 89, carbs: 23, protein: 1.1, fat: 0.3 },
    'chicken breast': { cal: 165, carbs: 0, protein: 31, fat: 3.6 },
    'rice': { cal: 130, carbs: 28, protein: 2.7, fat: 0.3 },
    'egg': { cal: 155, carbs: 1.1, protein: 13, fat: 11 },
    'oats': { cal: 389, carbs: 66, protein: 16.9, fat: 6.9 },
    'milk': { cal: 42, carbs: 5, protein: 3.4, fat: 1 },
    'paneer': { cal: 265, carbs: 1.2, protein: 18, fat: 20 },
    'tofu': { cal: 76, carbs: 1.9, protein: 8, fat: 4.8 },
    'almonds': { cal: 579, carbs: 22, protein: 21, fat: 49 },
    'salmon': { cal: 208, carbs: 0, protein: 20, fat: 13 },
    'broccoli': { cal: 34, carbs: 7, protein: 2.8, fat: 0.4 },
    'peanut butter': { cal: 588, carbs: 20, protein: 25, fat: 50 },
    'greek yogurt': { cal: 59, carbs: 3.6, protein: 10, fat: 0.4 }
};

// Application State
let appState = {
    profile: {
        age: 25,
        weight: 70,
        height: 175,
        gender: 'male',
        activity: '1.2'
    },
    currentTarget: 2000,
    targetMacros: { carbs: 225, protein: 125, fat: 67 },
    currentConsumed: 0,
    consumedMacros: { carbs: 0, protein: 0, fat: 0 },
    loggedEntries: [],
    waterTarget: 2500,
    waterConsumed: 0
};

// Initialize app on load
window.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    refreshUI();
    setupAutocompleteDismissal();
});

// Load state from LocalStorage
function loadFromLocalStorage() {
    try {
        const savedState = localStorage.getItem('nutriPlanState');
        if (savedState) {
            appState = JSON.parse(savedState);
        } else {
            // Calculate initial targets if no state exists
            calculateMacros();
        }
    } catch (e) {
        console.error("Could not load from localStorage", e);
    }
}

// Save state to LocalStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('nutriPlanState', JSON.stringify(appState));
    } catch (e) {
        console.error("Could not save to localStorage", e);
    }
}

// Calculate calorie & macro targets based on profile state
function calculateMacros() {
    const { age, weight, height, gender, activity } = appState.profile;
    if (age && weight && height) {
        // Mifflin-St Jeor Equation
        let bmr = 0;
        if (gender === 'female') {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        }
        
        appState.currentTarget = Math.round(bmr * parseFloat(activity));
        
        // Balanced Diet Split: Carbs (45%), Protein (25%), Fats (30%)
        // Carbs: 4 kcal/g, Protein: 4 kcal/g, Fats: 9 kcal/g
        appState.targetMacros.carbs = Math.round((appState.currentTarget * 0.45) / 4);
        appState.targetMacros.protein = Math.round((appState.currentTarget * 0.25) / 4);
        appState.targetMacros.fat = Math.round((appState.currentTarget * 0.30) / 9);
    }
}

// Update Profile & Calorie Goals from inputs with validation limits
function updatePlan() {
    const ageEl = document.getElementById('age');
    const weightEl = document.getElementById('weight');
    const heightEl = document.getElementById('height');
    const genderEl = document.getElementById('gender');
    const activityEl = document.getElementById('activity');

    const age = parseFloat(ageEl.value);
    const weight = parseFloat(weightEl.value);
    const height = parseFloat(heightEl.value);
    const gender = genderEl.value;
    const activity = activityEl.value;

    if (height < 0 || height > 300) {
        alert("Height should be between 0 to 300 cm");
        return;
    } else if (weight < 0 || weight > 250) {
        alert("Weight should not exceed 250 kg and must be greater than 0 kg");
        return;
    } else if (age && weight && height) {
        appState.profile = { age, weight, height, gender, activity };
        calculateMacros();
        saveToLocalStorage();
        refreshUI();
    } else {
        alert("Please fill in all profile fields to calculate your goals.");
    }
}

// Recalculate consumed totals from logs
function recalculateTotals() {
    appState.currentConsumed = 0;
    appState.consumedMacros = { carbs: 0, protein: 0, fat: 0 };

    appState.loggedEntries.forEach(entry => {
        appState.currentConsumed += entry.cal;
        appState.consumedMacros.carbs += entry.carbs;
        appState.consumedMacros.protein += entry.protein;
        appState.consumedMacros.fat += entry.fat;
    });

    // Round values to 1 decimal place
    appState.consumedMacros.carbs = Math.round(appState.consumedMacros.carbs * 10) / 10;
    appState.consumedMacros.protein = Math.round(appState.consumedMacros.protein * 10) / 10;
    appState.consumedMacros.fat = Math.round(appState.consumedMacros.fat * 10) / 10;
}

// Add Food Entry
function addEntry() {
    const inputEl = document.getElementById('food-input');
    const qtyEl = document.getElementById('qty-input');
    const name = inputEl.value.toLowerCase().trim();
    const qty = parseFloat(qtyEl.value) || 100;

    if (!name) return;

    // Get food item or fallback to general profile
    let baseInfo = foodDB[name];
    if (!baseInfo) {
        // Fallback nutrition profile for general items (per 100g)
        baseInfo = { cal: 150, carbs: 15, protein: 10, fat: 5 };
    }

    const factor = qty / 100;
    const entry = {
        id: Date.now().toString(),
        name: name,
        qty: qty,
        cal: Math.round(baseInfo.cal * factor),
        carbs: Math.round(baseInfo.carbs * factor * 10) / 10,
        protein: Math.round(baseInfo.protein * factor * 10) / 10,
        fat: Math.round(baseInfo.fat * factor * 10) / 10
    };

    appState.loggedEntries.push(entry);
    recalculateTotals();
    saveToLocalStorage();
    refreshUI();

    // Clear inputs and hide suggestions
    inputEl.value = '';
    qtyEl.value = '';
    hideSuggestions();
}

// Edit Log Entry
function editEntry(id) {
    const entry = appState.loggedEntries.find(e => e.id === id);
    if (!entry) return;

    const newQtyStr = prompt(`Enter new quantity in grams for ${entry.name}:`, entry.qty);
    if (newQtyStr === null) return; // user cancelled

    const newQty = parseFloat(newQtyStr);
    if (isNaN(newQty) || newQty <= 0) {
        alert("Please enter a valid positive weight in grams.");
        return;
    }

    // Get food item base info
    let baseInfo = foodDB[entry.name] || { cal: 150, carbs: 15, protein: 10, fat: 5 };

    const factor = newQty / 100;
    entry.qty = newQty;
    entry.cal = Math.round(baseInfo.cal * factor);
    entry.carbs = Math.round(baseInfo.carbs * factor * 10) / 10;
    entry.protein = Math.round(baseInfo.protein * factor * 10) / 10;
    entry.fat = Math.round(baseInfo.fat * factor * 10) / 10;

    recalculateTotals();
    saveToLocalStorage();
    refreshUI();
}

// Delete Log Entry
function deleteEntry(id) {
    appState.loggedEntries = appState.loggedEntries.filter(entry => entry.id !== id);
    recalculateTotals();
    saveToLocalStorage();
    refreshUI();
}

// Water Hydration tracking
function addWater(amount) {
    appState.waterConsumed += amount;
    saveToLocalStorage();
    refreshUI();
}

function resetWater() {
    appState.waterConsumed = 0;
    saveToLocalStorage();
    refreshUI();
}

// Autocomplete logic
function showSuggestions() {
    const inputEl = document.getElementById('food-input');
    const listEl = document.getElementById('autocomplete-list');
    const query = inputEl.value.toLowerCase().trim();

    if (!query) {
        hideSuggestions();
        return;
    }

    const matches = Object.keys(foodDB).filter(key => key.includes(query)).slice(0, 5);

    if (matches.length === 0) {
        hideSuggestions();
        return;
    }

    listEl.innerHTML = '';
    matches.forEach(match => {
        const item = foodDB[match];
        const div = document.createElement('div');
        div.className = "p-3 hover:bg-white/10 cursor-pointer flex justify-between items-center text-sm transition-colors border-b border-white/5 last:border-0";
        div.innerHTML = `
            <span class="capitalize font-semibold text-white/90">${match}</span>
            <span class="text-xs text-white/50">${item.cal} kcal/100g</span>
        `;
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
    listEl.classList.add('hidden');
}

function setupAutocompleteDismissal() {
    document.addEventListener('click', (e) => {
        const inputEl = document.getElementById('food-input');
        const listEl = document.getElementById('autocomplete-list');
        if (e.target !== inputEl && e.target !== listEl && !listEl.contains(e.target)) {
            hideSuggestions();
        }
    });
}

// Refresh whole UI elements from State
function refreshUI() {
    // Populate profile inputs
    document.getElementById('age').value = appState.profile.age || '';
    document.getElementById('weight').value = appState.profile.weight || '';
    document.getElementById('height').value = appState.profile.height || '';
    document.getElementById('gender').value = appState.profile.gender || 'male';
    document.getElementById('activity').value = appState.profile.activity || '1.2';

    // Calorie stats updates
    document.getElementById('consumed-val').innerText = appState.currentConsumed;
    document.getElementById('target-val').innerText = appState.currentTarget;
    
    const caloriePct = Math.min(100, (appState.currentConsumed / appState.currentTarget) * 100);
    document.getElementById('progress-bar').style.width = caloriePct + '%';

    // Toggle target achieved congratulatory message
    const msgEl = document.getElementById('target-message');
    if (msgEl) {
        if (appState.currentConsumed >= appState.currentTarget && appState.currentTarget > 0) {
            msgEl.classList.remove('hidden');
        } else {
            msgEl.classList.add('hidden');
        }
    }

    // Macronutrients updates
    document.getElementById('protein-consumed').innerText = Math.round(appState.consumedMacros.protein);
    document.getElementById('protein-target').innerText = appState.targetMacros.protein;
    const proteinPct = Math.min(100, (appState.consumedMacros.protein / appState.targetMacros.protein) * 100);
    document.getElementById('protein-bar').style.width = proteinPct + '%';

    document.getElementById('carbs-consumed').innerText = Math.round(appState.consumedMacros.carbs);
    document.getElementById('carbs-target').innerText = appState.targetMacros.carbs;
    const carbsPct = Math.min(100, (appState.consumedMacros.carbs / appState.targetMacros.carbs) * 100);
    document.getElementById('carbs-bar').style.width = carbsPct + '%';

    document.getElementById('fats-consumed').innerText = Math.round(appState.consumedMacros.fat);
    document.getElementById('fats-target').innerText = appState.targetMacros.fat;
    const fatsPct = Math.min(100, (appState.consumedMacros.fat / appState.targetMacros.fat) * 100);
    document.getElementById('fats-bar').style.width = fatsPct + '%';

    // Water updates
    document.getElementById('water-consumed').innerText = appState.waterConsumed;
    document.getElementById('water-target').innerText = appState.waterTarget;
    const waterPct = Math.min(100, (appState.waterConsumed / appState.waterTarget) * 100);
    document.getElementById('water-fill').style.height = waterPct + '%';

    // Re-render Log list
    const logList = document.getElementById('log-list');
    if (appState.loggedEntries.length === 0) {
        logList.innerHTML = `<p class="text-center text-white/30 py-10 font-medium italic">Your daily log is empty</p>`;
    } else {
        logList.innerHTML = '';
        // Loop backwards to show newest first
        for (let i = appState.loggedEntries.length - 1; i >= 0; i--) {
            const entry = appState.loggedEntries[i];
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group hover:border-[#00ff66]/30";
            div.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="capitalize font-bold text-base tracking-tight truncate text-white">${entry.name}</span>
                        <span class="text-[10px] text-white/40 uppercase font-black tracking-widest bg-white/5 px-2 py-0.5 rounded-full">${entry.qty}g</span>
                    </div>
                    <div class="text-[11px] text-white/40 mt-1 flex gap-2">
                        <span>P: <strong class="text-[#ff9f0a]">${entry.protein}g</strong></span>
                        <span>C: <strong class="text-[#00d2ff]">${entry.carbs}g</strong></span>
                        <span>F: <strong class="text-[#ff375f]">${entry.fat}g</strong></span>
                    </div>
                </div>
                <div class="flex items-center">
                    <div class="text-right mr-2">
                        <span class="text-[#00ff66] font-black text-lg drop-shadow-[0_0_10px_rgba(0,255,102,0.2)]">+${entry.cal}</span>
                        <span class="text-[10px] text-[#00ff66]/50 uppercase font-black ml-1">kcal</span>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="editEntry('${entry.id}')" class="text-white/20 hover:text-[#ff9f0a] p-2 rounded-xl hover:bg-white/5 transition-all" title="Edit entry">
                            <i class="fas fa-pen text-sm"></i>
                        </button>
                        <button onclick="deleteEntry('${entry.id}')" class="text-white/20 hover:text-[#ff375f] p-2 rounded-xl hover:bg-white/5 transition-all" title="Delete entry">
                            <i class="fas fa-trash-alt text-sm"></i>
                        </button>
                    </div>
                </div>
            `;
            logList.appendChild(div);
        }
    }
}

// Custom Identity Dropdown & Tab Logic for Smart AI Routine Diet Planner
document.addEventListener('DOMContentLoaded', () => {
    // 1. Dropdown Controls
    const dropdownBtn = document.getElementById('identity-dropdown-btn');
    const dropdownMenu = document.getElementById('identity-dropdown-menu');
    const dropdownChevron = document.getElementById('identity-dropdown-chevron');
    const selectedLabel = document.getElementById('identity-selected-label');
    const hiddenInput = document.getElementById('identity-input');
    const options = document.querySelectorAll('.identity-option');

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
            dropdownChevron.classList.toggle('rotate-180');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                const val = option.getAttribute('data-value');
                const label = option.textContent;
                selectedLabel.textContent = label;
                hiddenInput.value = val;
                dropdownMenu.classList.add('hidden');
                dropdownChevron.classList.remove('rotate-180');
            });
        });

        document.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
                dropdownChevron.classList.remove('rotate-180');
            }
        });
    }

    // 2. AI Planner Form Submit (Open in new browser tab)
    const plannerForm = document.getElementById('ai-planner-form');
    if (plannerForm) {
        plannerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const identity = document.getElementById('identity-input').value;
            window.open('ai-plan.html?identity=' + identity, '_blank');
        });
    }
});
