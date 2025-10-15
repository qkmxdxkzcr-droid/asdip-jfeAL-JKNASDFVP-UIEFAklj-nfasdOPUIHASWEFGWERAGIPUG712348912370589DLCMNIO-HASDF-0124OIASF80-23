// Settings management
import { setSetting, getSetting, getAllSettings } from './store.js';

// Default settings
const DEFAULT_SETTINGS = {
  autoMinutes: true,
  autoPriority: true,
  autoProject: true,
  theme: 'light',
  weights: {
    wP: 0.45, // Priority weight
    wT: 0.25, // Type weight
    wC: 0.25, // Curves weight
    wL: 0.03, // Load weight
    wS: 0.02  // Stress weight
  }
};

// Current settings cache
let currentSettings = { ...DEFAULT_SETTINGS };

/**
 * Initialize settings
 */
export async function initSettings() {
  // Load settings from store
  currentSettings = await getAllSettings();
  
  // Apply theme
  applyTheme(currentSettings.theme);
  
  // Set up UI event listeners
  setupSettingsUI();
}

/**
 * Set up settings UI event listeners
 */
function setupSettingsUI() {
  // Auto-fill checkboxes
  const autoMinutes = document.getElementById('auto-minutes');
  const autoPriority = document.getElementById('auto-priority');
  const autoProject = document.getElementById('auto-project');
  
  if (autoMinutes) {
    autoMinutes.checked = currentSettings.autoMinutes;
    autoMinutes.addEventListener('change', (e) => {
      setSetting('autoMinutes', e.target.checked);
      currentSettings.autoMinutes = e.target.checked;
    });
  }
  
  if (autoPriority) {
    autoPriority.checked = currentSettings.autoPriority;
    autoPriority.addEventListener('change', (e) => {
      setSetting('autoPriority', e.target.checked);
      currentSettings.autoPriority = e.target.checked;
    });
  }
  
  if (autoProject) {
    autoProject.checked = currentSettings.autoProject;
    autoProject.addEventListener('change', (e) => {
      setSetting('autoProject', e.target.checked);
      currentSettings.autoProject = e.target.checked;
    });
  }
  
  // Weight sliders
  setupWeightSliders();
  
  // Theme radio buttons
  setupThemeRadio();
}

/**
 * Set up weight sliders
 */
function setupWeightSliders() {
  const weightInputs = [
    { id: 'weight-priority', key: 'wP' },
    { id: 'weight-type', key: 'wT' },
    { id: 'weight-curves', key: 'wC' },
    { id: 'weight-load', key: 'wL' },
    { id: 'weight-stress', key: 'wS' }
  ];
  
  weightInputs.forEach(({ id, key }) => {
    const input = document.getElementById(id);
    if (input) {
      input.value = currentSettings.weights[key];
      
      // Update display value
      const valueDisplay = input.parentElement.querySelector('.weight-value');
      if (valueDisplay) {
        valueDisplay.textContent = input.value;
      }
      
      // Add change listener
      input.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        currentSettings.weights[key] = value;
        
        // Update display
        if (valueDisplay) {
          valueDisplay.textContent = value.toFixed(2);
        }
        
        // Save to store
        setSetting('weights', { ...currentSettings.weights });
      });
    }
  });
}

/**
 * Set up theme radio buttons
 */
function setupThemeRadio() {
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  
  themeRadios.forEach(radio => {
    radio.checked = radio.value === currentSettings.theme;
    
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        const theme = e.target.value;
        setSetting('theme', theme);
        currentSettings.theme = theme;
        applyTheme(theme);
      }
    });
  });
}

/**
 * Apply theme to document
 * @param {string} theme - Theme name ('light' or 'dark')
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Toggle theme
 */
export function toggleTheme() {
  const newTheme = currentSettings.theme === 'light' ? 'dark' : 'light';
  setSetting('theme', newTheme);
  currentSettings.theme = newTheme;
  applyTheme(newTheme);
  
  // Update radio buttons
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  themeRadios.forEach(radio => {
    radio.checked = radio.value === newTheme;
  });
}

/**
 * Get current settings
 * @returns {Object} Current settings
 */
export function getCurrentSettings() {
  return { ...currentSettings };
}

/**
 * Get setting value
 * @param {string} key - Setting key
 * @returns {*} Setting value
 */
export function getSettingValue(key) {
  return currentSettings[key];
}

/**
 * Set setting value
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 */
export async function setSettingValue(key, value) {
  await setSetting(key, value);
  currentSettings[key] = value;
}

/**
 * Reset settings to defaults
 */
export async function resetSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await setSetting(key, value);
    currentSettings[key] = value;
  }
  
  // Apply theme
  applyTheme(currentSettings.theme);
  
  // Refresh UI
  setupSettingsUI();
}

/**
 * Export settings
 * @returns {Object} Settings object for export
 */
export function exportSettings() {
  return {
    ...currentSettings,
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };
}

/**
 * Import settings
 * @param {Object} settings - Settings object to import
 */
export async function importSettings(settings) {
  // Validate settings
  if (!validateSettings(settings)) {
    throw new Error('Invalid settings format');
  }
  
  // Import each setting
  for (const [key, value] of Object.entries(settings)) {
    if (key !== 'exportedAt' && key !== 'version') {
      await setSetting(key, value);
      currentSettings[key] = value;
    }
  }
  
  // Apply theme
  applyTheme(currentSettings.theme);
  
  // Refresh UI
  setupSettingsUI();
}

/**
 * Validate settings object
 * @param {Object} settings - Settings to validate
 * @returns {boolean} True if valid
 */
function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return false;
  }
  
  // Check required fields
  const requiredFields = ['autoMinutes', 'autoPriority', 'autoProject', 'theme', 'weights'];
  for (const field of requiredFields) {
    if (!(field in settings)) {
      return false;
    }
  }
  
  // Check types
  if (typeof settings.autoMinutes !== 'boolean') return false;
  if (typeof settings.autoPriority !== 'boolean') return false;
  if (typeof settings.autoProject !== 'boolean') return false;
  if (typeof settings.theme !== 'string') return false;
  if (!settings.weights || typeof settings.weights !== 'object') return false;
  
  // Check theme value
  if (!['light', 'dark'].includes(settings.theme)) return false;
  
  // Check weights
  const weightKeys = ['wP', 'wT', 'wC', 'wL', 'wS'];
  for (const key of weightKeys) {
    if (!(key in settings.weights)) return false;
    if (typeof settings.weights[key] !== 'number') return false;
    if (settings.weights[key] < 0 || settings.weights[key] > 1) return false;
  }
  
  return true;
}

/**
 * Get settings summary for display
 * @returns {Object} Settings summary
 */
export function getSettingsSummary() {
  return {
    autoFill: {
      minutes: currentSettings.autoMinutes,
      priority: currentSettings.autoPriority,
      project: currentSettings.autoProject
    },
    theme: currentSettings.theme,
    weights: {
      priority: currentSettings.weights.wP,
      type: currentSettings.weights.wT,
      curves: currentSettings.weights.wC,
      load: currentSettings.weights.wL,
      stress: currentSettings.weights.wS
    }
  };
}

/**
 * Validate weight constraints
 * @param {Object} weights - Weights object
 * @returns {Object} Validation result
 */
export function validateWeights(weights) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const tolerance = 0.01; // 1% tolerance
  
  return {
    valid: Math.abs(total - 1) < tolerance,
    total: total,
    message: Math.abs(total - 1) < tolerance 
      ? 'Weights are valid' 
      : `Weights sum to ${total.toFixed(3)}, should be 1.0`
  };
}

/**
 * Normalize weights to sum to 1
 * @param {Object} weights - Weights object
 * @returns {Object} Normalized weights
 */
export function normalizeWeights(weights) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  
  if (total === 0) {
    // If all weights are 0, distribute equally
    const equalWeight = 1 / Object.keys(weights).length;
    const normalized = {};
    for (const key of Object.keys(weights)) {
      normalized[key] = equalWeight;
    }
    return normalized;
  }
  
  // Normalize by total
  const normalized = {};
  for (const [key, value] of Object.entries(weights)) {
    normalized[key] = value / total;
  }
  
  return normalized;
}

// Export default
export default {
  initSettings,
  applyTheme,
  toggleTheme,
  getCurrentSettings,
  getSettingValue,
  setSettingValue,
  resetSettings,
  exportSettings,
  importSettings,
  getSettingsSummary,
  validateWeights,
  normalizeWeights
};
