// Navigation and routing
import { renderCurrentMonth } from './calendar.js';

// Route definitions
const routes = {
  '/': 'timeline',
  '/timeline': 'timeline',
  '/curves': 'curves',
  '/projects': 'projects',
  '/calendar': 'calendar',
  '/templates': 'templates',
  '/import': 'import',
  '/stats': 'stats',
  '/base-tasks': 'base-tasks',
  '/draft': 'draft',
  '/settings': 'settings'
};

// Current route
let currentRoute = 'timeline';

// Navigation elements
let sidebar = null;
let content = null;

/**
 * Initialize navigation
 */
export function initNavigation() {
  sidebar = document.querySelector('.sidebar');
  content = document.querySelector('.content');
  
  if (!sidebar || !content) {
    console.error('Navigation elements not found');
    return;
  }
  
  // Set up route handlers
  setupRouteHandlers();
  
  // Handle initial route
  handleRouteChange();
  
  // Set up hash change listener
  window.addEventListener('hashchange', handleRouteChange);
  
  // Set up mobile menu toggle
  setupMobileMenu();
}

/**
 * Set up route handlers
 */
function setupRouteHandlers() {
  const navItems = sidebar.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const href = item.getAttribute('href');
      if (href) {
        navigateTo(href);
      }
    });
  });
}

/**
 * Handle route change
 */
function handleRouteChange() {
  const hash = window.location.hash.slice(1) || '/';
  const route = routes[hash] || 'timeline';
  
  if (route !== currentRoute) {
    currentRoute = route;
    updateActiveNavItem();
    renderRoute(route);
  }
}

/**
 * Navigate to route
 * @param {string} path - Route path
 */
export function navigateTo(path) {
  window.location.hash = path;
}

/**
 * Update active navigation item
 */
function updateActiveNavItem() {
  const navItems = sidebar.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.classList.remove('active');
    const href = item.getAttribute('href');
    if (href === window.location.hash || (href === '/' && window.location.hash === '')) {
      item.classList.add('active');
    }
  });
}

/**
 * Render route content
 * @param {string} route - Route name
 */
async function renderRoute(route) {
  if (!content) return;
  
  // Clear content
  content.innerHTML = '';
  
  switch (route) {
    case 'timeline':
      await renderTimeline();
      break;
    case 'curves':
      await renderCurves();
      break;
    case 'projects':
      await renderProjects();
      break;
    case 'calendar':
      await renderCalendar();
      break;
    case 'templates':
      await renderTemplates();
      break;
    case 'import':
      await renderImport();
      break;
    case 'stats':
      await renderStats();
      break;
    case 'base-tasks':
      await renderBaseTasks();
      break;
    case 'draft':
      await renderDraft();
      break;
    case 'settings':
      await renderSettings();
      break;
    default:
      await renderTimeline();
  }
}

/**
 * Render timeline page
 */
async function renderTimeline() {
  content.innerHTML = `
    <div class="topbar">
      <h1 class="h1">Timeline</h1>
      <div class="topbar-actions">
        <button class="btn" id="auto-schedule-btn">Auto Schedule</button>
        <button class="btn primary" id="add-task-btn">Add Task</button>
      </div>
    </div>
    
    <div class="timeline-container">
      <div class="timeline-grid" id="timeline-grid">
        <!-- Timeline windows will be rendered here -->
      </div>
      
      <div class="unplanned-section">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Unplanned Tasks</h3>
            <button class="btn btn-sm" id="add-unplanned-btn">Add</button>
          </div>
          <div class="droplist" id="unplanned">
            <!-- Unplanned tasks will be rendered here -->
          </div>
        </div>
      </div>
      
      <div class="curves-section">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Day Curves</h3>
          </div>
          <div class="curves-container">
            <canvas id="curvesCanvas" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Initialize timeline functionality
  await initTimeline();
}

/**
 * Render curves page
 */
async function renderCurves() {
  content.innerHTML = `
    <div class="topbar">
      <h1 class="h1">Day Curves</h1>
    </div>
    
    <div class="curves-page">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Biochemical Curves</h3>
        </div>
        <div class="curves-container">
          <canvas id="curvesCanvas" width="800" height="400"></canvas>
        </div>
      </div>
    </div>
  `;
  
  // Initialize curves
  await initCurves();
}

/**
 * Render projects page
 */
async function renderProjects() {
  content.innerHTML = `
    <div class="topbar">
      <h1 class="h1">Projects & Plans</h1>
      <div class="topbar-actions">
        <button class="btn primary" id="add-project-btn">Add Project</button>
      </div>
    </div>
    
    <div class="projects-grid" id="projects-grid">
      <!-- Projects will be rendered here -->
    </div>
  `;
  
  // Initialize projects
  await initProjects();
}

/**
 * Render calendar page
 */
async function renderCalendar() {
  content.innerHTML = `
    <div class="topbar">
      <h1 class="h1">Calendar</h1>
    </div>
    
    <div class="calendar-container" id="calendar-container">
      <!-- Calendar will be rendered here -->
    </div>
  `;
  
  // Initialize calendar
  await renderCurrentMonth(document.getElementById('calendar-container'));
}

/**
 * Render templates page
 */
async function renderTemplates() {
  content.innerHTML = `
    <div class="topbar">
      <h1 class="h1">Templates</h1>
      <div class="topbar-actions">
        <button class="btn primary" id="add-template-btn">Add Template</button>
      </div>
    </div>
    
    <div class="templates-list" id="templates-list">
      <!-- Templates will be rendered here -->
    </div>
  `;
  
  // Initialize templates
  await initTemplates();
}

/**
 * Render import page
 */
async function renderImport() {
  content.innerHTML = `
    <div class="topbar">
      <h1 class="h1">Import Tasks</h1>
    </div>
    
    <div class="import-container">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Import Tasks</h3>
        </div>
        <div class="form-group">
          <label class="form-label" for="import-text">Task List</label>
          <textarea 
            id="import-text" 
            class="form-input" 
            rows="10" 
            placeholder="Enter tasks in one of these formats:&#10;Task @30m #P2&#10;[U I6 R3] Chemistry @30m #P1&#10;Project: German #P2 @30m"
          ></textarea>
        </div>
        <div class="form-actions">
          <button class="btn" id="parse-import-btn">Parse</button>
          <button class="btn primary" id="import-tasks-btn" disabled>Import Tasks</button>
        </div>
      </div>
    </div>
  `;
  
  // Initialize import
  await initImport();
}

/**
 * Render stats page
 */
async function renderStats() {
  content.innerHTML = `
    <div class="topbar">
      <h1 class="h1">Statistics</h1>
    </div>
    
    <div class="stats-container">
      <div class="stats-kpis" id="stats-kpis">
        <!-- KPIs will be rendered here -->
      </div>
      <div class="stats-projects" id="stats-projects">
        <!-- Project stats will be rendered here -->
      </div>
    </div>
  `;
  
  // Initialize stats
  await initStats();
}

/**
 * Render base tasks page
 */
async function renderBaseTasks() {
  content.innerHTML = `
    <div class="topbar">
      <h1 class="h1">Base Tasks</h1>
      <div class="topbar-actions">
        <button class="btn primary" id="add-base-task-btn">Add Base Task</button>
      </div>
    </div>
    
    <div class="base-tasks-container">
      <div class="search-bar">
        <input type="text" id="base-task-search" class="form-input" placeholder="Search base tasks...">
      </div>
      <div class="base-tasks-table" id="base-tasks-table">
        <!-- Base tasks table will be rendered here -->
      </div>
    </div>
  `;
  
  // Initialize base tasks
  await initBaseTasks();
}

/**
 * Render draft page
 */
async function renderDraft() {
  content.innerHTML = `
    <div class="topbar">
      <h1 class="h1">Draft</h1>
      <div class="topbar-actions">
        <button class="btn" id="distribute-draft-btn">Distribute to Days</button>
        <button class="btn primary" id="add-draft-task-btn">Add Task</button>
      </div>
    </div>
    
    <div class="draft-container">
      <div class="droplist" id="draft-tasks">
        <!-- Draft tasks will be rendered here -->
      </div>
    </div>
  `;
  
  // Initialize draft
  await initDraft();
}

/**
 * Render settings page
 */
async function renderSettings() {
  content.innerHTML = `
    <div class="topbar">
      <h1 class="h1">Settings</h1>
    </div>
    
    <div class="settings-container">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Auto-fill Settings</h3>
        </div>
        <div class="settings-group">
          <label class="form-label">
            <input type="checkbox" id="auto-minutes" class="form-checkbox">
            Auto-fill minutes from base tasks
          </label>
          <label class="form-label">
            <input type="checkbox" id="auto-priority" class="form-checkbox">
            Auto-fill priority from base tasks
          </label>
          <label class="form-label">
            <input type="checkbox" id="auto-project" class="form-checkbox">
            Auto-fill project from base tasks
          </label>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Scoring Weights</h3>
        </div>
        <div class="weights-group">
          <div class="weight-item">
            <label class="form-label">Priority Weight</label>
            <input type="range" id="weight-priority" class="form-range" min="0" max="1" step="0.05" value="0.45">
            <span class="weight-value">0.45</span>
          </div>
          <div class="weight-item">
            <label class="form-label">Type Weight</label>
            <input type="range" id="weight-type" class="form-range" min="0" max="1" step="0.05" value="0.25">
            <span class="weight-value">0.25</span>
          </div>
          <div class="weight-item">
            <label class="form-label">Curves Weight</label>
            <input type="range" id="weight-curves" class="form-range" min="0" max="1" step="0.05" value="0.25">
            <span class="weight-value">0.25</span>
          </div>
          <div class="weight-item">
            <label class="form-label">Load Weight</label>
            <input type="range" id="weight-load" class="form-range" min="0" max="1" step="0.05" value="0.03">
            <span class="weight-value">0.03</span>
          </div>
          <div class="weight-item">
            <label class="form-label">Stress Weight</label>
            <input type="range" id="weight-stress" class="form-range" min="0" max="1" step="0.05" value="0.02">
            <span class="weight-value">0.02</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Theme</h3>
        </div>
        <div class="theme-group">
          <label class="form-label">
            <input type="radio" name="theme" value="light" class="form-radio">
            Light Theme
          </label>
          <label class="form-label">
            <input type="radio" name="theme" value="dark" class="form-radio">
            Dark Theme
          </label>
        </div>
      </div>
    </div>
  `;
  
  // Initialize settings
  await initSettings();
}

/**
 * Set up mobile menu
 */
function setupMobileMenu() {
  // Add mobile menu button if needed
  const topbar = document.querySelector('.topbar');
  if (topbar && window.innerWidth <= 768) {
    const menuBtn = document.createElement('button');
    menuBtn.className = 'btn mobile-menu-btn';
    menuBtn.innerHTML = '☰';
    menuBtn.addEventListener('click', toggleMobileMenu);
    topbar.appendChild(menuBtn);
  }
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

/**
 * Close mobile menu
 */
export function closeMobileMenu() {
  if (sidebar) {
    sidebar.classList.remove('open');
  }
}

// Placeholder functions for page initialization
// These will be implemented in their respective modules

async function initTimeline() {
  // TODO: Implement timeline initialization
  console.log('Initializing timeline...');
}

async function initCurves() {
  // TODO: Implement curves initialization
  console.log('Initializing curves...');
}

async function initProjects() {
  // TODO: Implement projects initialization
  console.log('Initializing projects...');
}

async function initTemplates() {
  // TODO: Implement templates initialization
  console.log('Initializing templates...');
}

async function initImport() {
  // TODO: Implement import initialization
  console.log('Initializing import...');
}

async function initStats() {
  // TODO: Implement stats initialization
  console.log('Initializing stats...');
}

async function initBaseTasks() {
  // TODO: Implement base tasks initialization
  console.log('Initializing base tasks...');
}

async function initDraft() {
  // TODO: Implement draft initialization
  console.log('Initializing draft...');
}

async function initSettings() {
  // TODO: Implement settings initialization
  console.log('Initializing settings...');
}

// Export default
export default {
  initNavigation,
  navigateTo,
  closeMobileMenu
};
