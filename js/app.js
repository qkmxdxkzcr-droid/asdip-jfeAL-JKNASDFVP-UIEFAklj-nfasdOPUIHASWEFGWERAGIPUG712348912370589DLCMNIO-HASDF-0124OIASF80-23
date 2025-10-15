// Main application file - loads all modules and initializes the app
import { initNavigation } from './nav.js';
import { initializeCache } from './store.js';
import { initSettings } from './settings.js';

// Make functions globally available
window.initializeCache = initializeCache;
window.initSettings = initSettings;
window.initNavigation = initNavigation;

// Initialize application
async function init() {
  try {
    console.log('Application starting...');
    
    // Wait for external libraries to load
    if (typeof Sortable === 'undefined' || typeof Chart === 'undefined' || typeof idb === 'undefined') {
      setTimeout(init, 100);
      return;
    }
    
    console.log('External libraries loaded, initializing app...');
    
    // Initialize database cache
    await initializeCache();
    
    // Initialize settings
    await initSettings();
    
    // Initialize navigation
    initNavigation();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
}

// Start application when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
