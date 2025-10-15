// Import page rendering and functionality
import { importTasks, getImportFormats, validateImportText } from '../importer.js';
import { tasks } from '../store.js';

let importText = '';
let parsedTasks = [];

/**
 * Initialize import page
 */
export async function initImport() {
  // Render import formats help
  renderImportFormats();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Render import formats help
 */
function renderImportFormats() {
  const container = document.querySelector('.import-container');
  if (!container) return;
  
  const formats = getImportFormats();
  
  const helpCard = document.createElement('div');
  helpCard.className = 'card';
  helpCard.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Import Formats</h3>
    </div>
    <div class="formats-help">
      ${formats.map(format => `
        <div class="format-example">
          <h4>${format.name}</h4>
          <p>${format.description}</p>
          <div class="format-code">
            <code>${escapeHtml(format.example)}</code>
          </div>
          <div class="format-fields">
            Fields: ${format.fields.join(', ')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  container.appendChild(helpCard);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Parse button
  const parseBtn = document.getElementById('parse-import-btn');
  if (parseBtn) {
    parseBtn.addEventListener('click', handleParse);
  }
  
  // Import button
  const importBtn = document.getElementById('import-tasks-btn');
  if (importBtn) {
    importBtn.addEventListener('click', handleImport);
  }
  
  // Text area
  const textarea = document.getElementById('import-text');
  if (textarea) {
    textarea.addEventListener('input', handleTextChange);
  }
}

/**
 * Handle text change
 * @param {Event} event - Input event
 */
function handleTextChange(event) {
  importText = event.target.value;
  
  // Auto-validate as user types
  if (importText.trim()) {
    const validation = validateImportText(importText);
    updateValidationDisplay(validation);
  } else {
    clearValidationDisplay();
  }
}

/**
 * Handle parse
 */
function handleParse() {
  if (!importText.trim()) {
    showToast('Please enter some text to parse');
    return;
  }
  
  const validation = validateImportText(importText);
  
  if (!validation.valid) {
    showToast(`Validation failed: ${validation.errors.join(', ')}`);
    return;
  }
  
  // Parse tasks
  const { parseImportText } = await import('../importer.js');
  parsedTasks = parseImportText(importText);
  
  // Render parsed tasks preview
  renderParsedTasksPreview();
  
  // Enable import button
  const importBtn = document.getElementById('import-tasks-btn');
  if (importBtn) {
    importBtn.disabled = false;
  }
  
  showToast(`Parsed ${parsedTasks.length} tasks successfully`);
}

/**
 * Handle import
 */
async function handleImport() {
  if (parsedTasks.length === 0) {
    showToast('No tasks to import. Please parse first.');
    return;
  }
  
  try {
    const result = await importTasks(importText);
    
    if (result.success) {
      showToast(result.message);
      
      // Clear form
      const textarea = document.getElementById('import-text');
      if (textarea) {
        textarea.value = '';
        importText = '';
      }
      
      // Disable import button
      const importBtn = document.getElementById('import-tasks-btn');
      if (importBtn) {
        importBtn.disabled = true;
      }
      
      // Clear preview
      clearParsedTasksPreview();
      
      // Clear validation
      clearValidationDisplay();
      
    } else {
      showToast(`Import failed: ${result.message}`);
    }
  } catch (error) {
    showToast(`Import error: ${error.message}`);
  }
}

/**
 * Render parsed tasks preview
 */
function renderParsedTasksPreview() {
  const container = document.querySelector('.import-container');
  if (!container) return;
  
  // Remove existing preview
  const existingPreview = container.querySelector('.parsed-tasks-preview');
  if (existingPreview) {
    existingPreview.remove();
  }
  
  const previewCard = document.createElement('div');
  previewCard.className = 'card parsed-tasks-preview';
  previewCard.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Parsed Tasks Preview (${parsedTasks.length})</h3>
    </div>
    <div class="parsed-tasks-list">
      ${parsedTasks.map((task, index) => `
        <div class="parsed-task-item">
          <div class="task-info">
            <span class="task-title">${escapeHtml(task.title)}</span>
            <div class="task-meta">
              ${task.minutes ? `<span class="meta-item">${task.minutes}min</span>` : ''}
              ${task.priority ? `<span class="meta-item priority-${task.priority.toLowerCase()}">${task.priority}</span>` : ''}
              ${task.type ? `<span class="meta-item type-${task.type.toLowerCase()}">${task.type}</span>` : ''}
              ${task.projectId ? `<span class="meta-item">Project: ${task.projectId}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  container.appendChild(previewCard);
}

/**
 * Clear parsed tasks preview
 */
function clearParsedTasksPreview() {
  const preview = document.querySelector('.parsed-tasks-preview');
  if (preview) {
    preview.remove();
  }
  parsedTasks = [];
}

/**
 * Update validation display
 * @param {Object} validation - Validation result
 */
function updateValidationDisplay(validation) {
  const container = document.querySelector('.import-container');
  if (!container) return;
  
  // Remove existing validation
  const existingValidation = container.querySelector('.validation-display');
  if (existingValidation) {
    existingValidation.remove();
  }
  
  const validationCard = document.createElement('div');
  validationCard.className = 'card validation-display';
  
  const statusClass = validation.valid ? 'valid' : 'invalid';
  const statusText = validation.valid ? 'Valid' : 'Invalid';
  
  validationCard.innerHTML = `
    <div class="validation-header">
      <h3 class="validation-title ${statusClass}">${statusText} (${validation.taskCount} tasks)</h3>
    </div>
    <div class="validation-details">
      ${validation.errors.length > 0 ? `
        <div class="validation-errors">
          <h4>Errors:</h4>
          <ul>
            ${validation.errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      ${validation.warnings.length > 0 ? `
        <div class="validation-warnings">
          <h4>Warnings:</h4>
          <ul>
            ${validation.warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
  
  container.appendChild(validationCard);
}

/**
 * Clear validation display
 */
function clearValidationDisplay() {
  const validation = document.querySelector('.validation-display');
  if (validation) {
    validation.remove();
  }
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
  initImport
};
