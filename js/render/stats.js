// Statistics rendering
import { getTaskStats, getProjectStats } from '../store.js';

let currentStats = null;
let currentProjectStats = [];

/**
 * Initialize stats page
 */
export async function initStats() {
  // Load statistics
  await loadStatistics();
  
  // Render statistics
  await renderStatistics();
  
  // Set up auto-refresh
  setupAutoRefresh();
}

/**
 * Load statistics
 */
async function loadStatistics() {
  currentStats = await getTaskStats();
  currentProjectStats = await getProjectStats();
}

/**
 * Render statistics
 */
async function renderStatistics() {
  await renderKPIs();
  await renderProjectStats();
}

/**
 * Render KPIs
 */
async function renderKPIs() {
  const container = document.getElementById('stats-kpis');
  if (!container) return;
  
  container.innerHTML = `
    <div class="stats-kpis-grid">
      <div class="kpi-card">
        <div class="kpi-icon">📋</div>
        <div class="kpi-content">
          <h3 class="kpi-value">${currentStats.total}</h3>
          <p class="kpi-label">Total Tasks</p>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">✅</div>
        <div class="kpi-content">
          <h3 class="kpi-value">${currentStats.completionRate.toFixed(1)}%</h3>
          <p class="kpi-label">Completion Rate</p>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">⏰</div>
        <div class="kpi-content">
          <h3 class="kpi-value">${Math.round(currentStats.totalMinutes / 60)}h</h3>
          <p class="kpi-label">Total Time</p>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">🎯</div>
        <div class="kpi-content">
          <h3 class="kpi-value">${Math.round(currentStats.completedMinutes / 60)}h</h3>
          <p class="kpi-label">Completed Time</p>
        </div>
      </div>
    </div>
    
    <div class="stats-details">
      <div class="detail-item">
        <span class="detail-label">Planned Tasks:</span>
        <span class="detail-value">${currentStats.planned}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Unplanned Tasks:</span>
        <span class="detail-value">${currentStats.total - currentStats.planned}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Planned Time:</span>
        <span class="detail-value">${Math.round(currentStats.plannedMinutes / 60)}h</span>
      </div>
    </div>
  `;
}

/**
 * Render project statistics
 */
async function renderProjectStats() {
  const container = document.getElementById('stats-projects');
  if (!container) return;
  
  container.innerHTML = `
    <div class="project-stats-header">
      <h3>Project Statistics</h3>
    </div>
    <div class="project-stats-list">
      ${currentProjectStats.map(project => `
        <div class="project-stat-item">
          <div class="project-info">
            <div class="project-color" style="background-color: ${project.color || '#7C4DFF'}"></div>
            <div class="project-details">
              <h4 class="project-name">${escapeHtml(project.name)}</h4>
              <p class="project-meta">${project.totalTasks} tasks • ${Math.round(project.totalMinutes / 60)}h total</p>
            </div>
          </div>
          
          <div class="project-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${project.completionRate}%"></div>
            </div>
            <div class="progress-text">
              <span class="progress-completed">${project.completedTasks}</span>
              <span class="progress-separator">/</span>
              <span class="progress-total">${project.totalTasks}</span>
              <span class="progress-percentage">(${project.completionRate.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      `).join('')}
      
      ${currentProjectStats.length === 0 ? `
        <div class="no-projects">
          <p>No projects found. Create some projects to see statistics here.</p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Set up auto-refresh
 */
function setupAutoRefresh() {
  // Refresh every 30 seconds
  setInterval(async () => {
    await loadStatistics();
    await renderStatistics();
  }, 30000);
}

/**
 * Show toast message
 * @param {string} message - Message to show
 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/**
 * Escape HTML
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export default
export default {
  initStats
};
