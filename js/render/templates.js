// Templates rendering and management
import { templates, days } from '../store.js';

let currentTemplates = [];
let currentTemplate = null;

/**
 * Initialize templates page
 */
export async function initTemplates() {
  // Load templates
  currentTemplates = await templates.getAll();
  
  // Render templates list
  await renderTemplatesList();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Render templates list
 */
async function renderTemplatesList() {
  const list = document.getElementById('templates-list');
  if (!list) return;
  
  list.innerHTML = '';
  
  for (const template of currentTemplates) {
    const templateCard = createTemplateCard(template);
    list.appendChild(templateCard);
  }
  
  // Add "Add Template" card
  const addCard = createAddTemplateCard();
  list.appendChild(addCard);
}

/**
 * Create template card
 * @param {Object} template - Template object
 * @returns {HTMLElement} Template card element
 */
function createTemplateCard(template) {
  const card = document.createElement('div');
  card.className = 'template-card';
  card.dataset.templateId = template.id;
  
  const duration = Math.floor(template.durationMin / 60);
  const windowsCount = template.windows.length;
  const fixedCount = template.fixed.length;
  
  card.innerHTML = `
    <div class="template-header">
      <h3 class="template-name">${escapeHtml(template.title)}</h3>
      <div class="template-actions">
        <button class="btn btn-sm" onclick="editTemplate('${template.id}')">Edit</button>
        <button class="btn btn-sm" onclick="duplicateTemplate('${template.id}')">Duplicate</button>
        <button class="btn btn-sm" onclick="applyTemplate('${template.id}')">Apply to Today</button>
        <button class="btn btn-sm danger" onclick="deleteTemplate('${template.id}')">Delete</button>
      </div>
    </div>
    
    <div class="template-info">
      <div class="info-item">
        <span class="info-label">Duration</span>
        <span class="info-value">${duration}h</span>
      </div>
      <div class="info-item">
        <span class="info-label">Windows</span>
        <span class="info-value">${windowsCount}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Fixed Events</span>
        <span class="info-value">${fixedCount}</span>
      </div>
    </div>
    
    <div class="template-schedule">
      <h4>Schedule</h4>
      <div class="schedule-blocks">
        ${template.windows.map(window => `
          <div class="schedule-block window-block">
            <span class="block-time">${formatTime(window.startMin)} - ${formatTime(window.endMin)}</span>
            <span class="block-title">${escapeHtml(window.title)}</span>
          </div>
        `).join('')}
        ${template.fixed.map(fixed => `
          <div class="schedule-block fixed-block">
            <span class="block-time">${formatTime(fixed.startMin)} - ${formatTime(fixed.endMin)}</span>
            <span class="block-title">${escapeHtml(fixed.title)}</span>
            <span class="block-type">${fixed.kind}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  return card;
}

/**
 * Create add template card
 * @returns {HTMLElement} Add template card element
 */
function createAddTemplateCard() {
  const card = document.createElement('div');
  card.className = 'template-card add-template-card';
  
  card.innerHTML = `
    <div class="add-template-content">
      <div class="add-template-icon">+</div>
      <h3 class="add-template-title">Create New Template</h3>
      <p class="add-template-description">Design a daily schedule template</p>
    </div>
  `;
  
  card.addEventListener('click', handleAddTemplate);
  
  return card;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Add template button
  const addBtn = document.getElementById('add-template-btn');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddTemplate);
  }
}

/**
 * Handle add template
 */
function handleAddTemplate() {
  const title = prompt('Enter template name:');
  if (!title) return;
  
  const template = {
    id: generateId(),
    title: title.trim(),
    dayStart: '08:00',
    durationMin: 16 * 60, // 16 hours
    windows: [
      { id: 'morning', title: 'Morning', startMin: 8 * 60, endMin: 12 * 60 },
      { id: 'afternoon', title: 'Afternoon', startMin: 12 * 60, endMin: 17 * 60 },
      { id: 'evening', title: 'Evening', startMin: 17 * 60, endMin: 22 * 60 }
    ],
    fixed: [
      { id: 'lunch', title: 'Lunch', startMin: 13 * 60, endMin: 14 * 60, kind: 'meal' }
    ],
    createdAt: Date.now()
  };
  
  addTemplate(template);
}

/**
 * Add template
 * @param {Object} template - Template object
 */
async function addTemplate(template) {
  try {
    await templates.put(template);
    currentTemplates.push(template);
    await renderTemplatesList();
    showToast('Template created successfully');
  } catch (error) {
    showToast(`Failed to create template: ${error.message}`);
  }
}

/**
 * Edit template
 * @param {string} templateId - Template ID
 */
window.editTemplate = async function(templateId) {
  const template = await templates.get(templateId);
  if (!template) return;
  
  // TODO: Implement template editor modal
  showToast('Template editor not implemented yet');
};

/**
 * Duplicate template
 * @param {string} templateId - Template ID
 */
window.duplicateTemplate = async function(templateId) {
  const template = await templates.get(templateId);
  if (!template) return;
  
  const newTitle = prompt('Enter name for duplicated template:', `${template.title} (Copy)`);
  if (!newTitle) return;
  
  try {
    const duplicated = {
      ...template,
      id: generateId(),
      title: newTitle.trim(),
      createdAt: Date.now()
    };
    
    await templates.put(duplicated);
    currentTemplates.push(duplicated);
    await renderTemplatesList();
    showToast('Template duplicated successfully');
  } catch (error) {
    showToast(`Failed to duplicate template: ${error.message}`);
  }
};

/**
 * Apply template to today
 * @param {string} templateId - Template ID
 */
window.applyTemplate = async function(templateId) {
  const template = await templates.get(templateId);
  if (!template) return;
  
  const today = new Date().toISOString().slice(0, 10);
  
  try {
    // Create or update today's day
    const day = {
      date: today,
      templateId: templateId,
      windows: [...template.windows],
      fixed: [...template.fixed],
      placed: []
    };
    
    await days.put(day);
    showToast(`Template applied to ${today}`);
  } catch (error) {
    showToast(`Failed to apply template: ${error.message}`);
  }
};

/**
 * Delete template
 * @param {string} templateId - Template ID
 */
window.deleteTemplate = async function(templateId) {
  if (!confirm('Delete this template?')) return;
  
  try {
    await templates.delete(templateId);
    
    // Update local cache
    currentTemplates = currentTemplates.filter(t => t.id !== templateId);
    
    await renderTemplatesList();
    showToast('Template deleted successfully');
  } catch (error) {
    showToast(`Failed to delete template: ${error.message}`);
  }
};

/**
 * Format time in minutes to HH:MM
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Formatted time
 */
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return 'template_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
  initTemplates,
  renderTemplatesList
};
