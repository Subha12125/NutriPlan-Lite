const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {};
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};
global.fetch = async (url, options) => {
  return { ok: true, status: 200, json: async () => ({ data: {} }) };
};
global.console = console;

try {
  const code = fs.readFileSync(path.join(__dirname, '../../scripts/storage.js'), 'utf8');
  eval(code);
  
  console.log('✓ scripts/storage.js parsed and executed successfully in mock DOM environment.');
  const keys = Object.keys(global.window.Storage);
  console.log('window.Storage exported keys:', keys);
  
  // Verify required functions are present
  const required = [
    'getProfile', 'saveProfile',
    'getFoods', 'addFood', 'updateFood', 'deleteFood',
    'getWater', 'addWater', 'setWater',
    'syncFromServer'
  ];
  
  for (const r of required) {
    if (typeof global.window.Storage[r] !== 'function') {
      throw new Error(`Missing expected exported function: ${r}`);
    }
  }
  console.log('✓ All expected API service layer functions are successfully exported.');
  process.exit(0);
} catch (error) {
  console.error('Failed to parse scripts/storage.js:', error);
  process.exit(1);
}
