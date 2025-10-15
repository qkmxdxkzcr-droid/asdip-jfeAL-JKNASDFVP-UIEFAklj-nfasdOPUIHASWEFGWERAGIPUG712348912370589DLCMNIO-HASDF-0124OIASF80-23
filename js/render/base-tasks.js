// Base tasks rendering and management
import { baseTasks, projects } from '../store.js';

let currentBaseTasks = [];
let filteredBaseTasks = [];
let currentProject = null;

/**
 * Initialize base tasks page
 */
export async function initBaseTasks() {
  // Load base tasks
  currentBaseTasks = await baseTasks.getAll();
  filteredBaseTasks = [...currentBaseTasks];
  
  // Render base tasks table
  await renderBaseTasksTable();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Render base tasks table
 */
async function renderBaseTasksTable() {
  const table = document.getElementById('base-tasks-table');
  if (!table) return;
  
  table.innerHTML = `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Sample Titles</th>
            <th>Default Minutes</th>
            <th>Default Priority</th>
            <th>Default Type</th>
            <th>Project</th>
            <th>Weights</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="base-tasks-tbody">
          <!-- Base tasks will be rendered here -->
        </tbody>
      </table>
    </div>
  `;
  
  await renderBaseTasksRows();
}

/**
 * Render base tasks rows
 */
async function renderBaseTasksRows() {
  const tbody = document.getElementById('base-tasks-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  for (const baseTask of filteredBaseTasks) {
    const row = createBaseTaskRow(baseTask);
    tbody.appendChild(row);
  }
}

/**
 * Create base task row
 * @param {Object} baseTask - Base task object
 * @returns {HTMLElement} Table row element
 */
async function createBaseTaskRow(baseTask) {
  const row = document.createElement('tr');
  row.dataset.slug = baseTask.slug;
  
  // Get project name
  const projectName = baseTask.defaultProjectId 
    ? (await projects.get(baseTask.defaultProjectId))?.name || 'Unknown'
    : 'None';
  
  // Format weights
  const weights = baseTask.weights || {};
  const weightsText = Object.entries(weights)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ') || 'None';
  
  row.innerHTML = `
    <td>
      <input type="text" class="form-input" value="${escapeHtml(baseTask.slug)}" 
             onchange="updateBaseTask('${baseTask.slug}', 'slug', this.value)">
    </td>
    <td>
      <textarea class="form-input" rows="2" 
                onchange="updateBaseTask('${baseTask.slug}', 'sampleTitles', this.value.split(',').map(s => s.trim()))">${baseTask.sampleTitles.join(', ')}</textarea>
    </td>
    <td>
      <input type="number" class="form-input" min="1" max="1440" 
             value="${baseTask.defaultMinutes}" 
             onchange="updateBaseTask('${baseTask.slug}', 'defaultMinutes', parseInt(this.value))">
    </td>
    <td>
      <select class="form-select" 
              onchange="updateBaseTask('${baseTask.slug}', 'defaultPriority', this.value)">
        <option value="P1" ${baseTask.defaultPriority === 'P1' ? 'selected' : ''}>P1</option>
        <option value="P2" ${baseTask.defaultPriority === 'P2' ? 'selected' : ''}>P2</option>
        <option value="P3" ${baseTask.defaultPriority === 'P3' ? 'selected' : ''}>P3</option>
        <option value="P4" ${baseTask.defaultPriority === 'P4' ? 'selected' : ''}>P4</option>
      </select>
    </td>
    <td>
      <select class="form-select" 
              onchange="updateBaseTask('${baseTask.slug}', 'defaultType', this.value)">
        <option value="U" ${baseTask.defaultType === 'U' ? 'selected' : ''}>U (Mental)</option>
        <option value="M" ${baseTask.defaultType === 'M' ? 'selected' : ''}>M (Monotonous)</option>
        <option value="F" ${baseTask.defaultType === 'F' ? 'selected' : ''}>F (Physical)</option>
        <option value="S" ${baseTask.defaultType === 'S' ? 'selected' : ''}>S (Mixed)</option>
        <option value="RA" ${baseTask.defaultType === 'RA' ? 'selected' : ''}>RA (Active Rest)</option>
        <option value="RP" ${baseTask.defaultType === 'RP' ? 'selected' : ''}>RP (Passive Rest)</option>
      </select>
    </td>
    <td>
      <select class="form-select" 
              onchange="updateBaseTask('${baseTask.slug}', 'defaultProjectId', this.value || null)">
        <option value="">None</option>
        ${await getProjectOptions(baseTask.defaultProjectId)}
      </select>
    </td>
    <td>
      <input type="text" class="form-input" 
             value="${weightsText}" 
             placeholder="focus: 0.8, physical: 0.6"
             onchange="updateBaseTaskWeights('${baseTask.slug}', this.value)">
    </td>
    <td>
      <button class="btn btn-sm danger" onclick="deleteBaseTask('${baseTask.slug}')">Delete</button>
    </td>
  `;
  
  return row;
}

/**
 * Get project options for select
 * @param {string} selectedId - Currently selected project ID
 * @returns {string} HTML options
 */
async function getProjectOptions(selectedId) {
  const allProjects = await projects.getAll();
  
  return allProjects.map(project => 
    `<option value="${project.id}" ${project.id === selectedId ? 'selected' : ''}>${escapeHtml(project.name)}</option>`
  ).join('');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Search functionality
  const searchInput = document.getElementById('base-task-search');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  // Add base task button
  const addBtn = document.getElementById('add-base-task-btn');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddBaseTask);
  }
}

/**
 * Handle search
 * @param {Event} event - Input event
 */
function handleSearch(event) {
  const query = event.target.value.toLowerCase().trim();
  
  if (!query) {
    filteredBaseTasks = [...currentBaseTasks];
  } else {
    filteredBaseTasks = currentBaseTasks.filter(baseTask =>
      baseTask.slug.toLowerCase().includes(query) ||
      baseTask.sampleTitles.some(title => title.toLowerCase().includes(query))
    );
  }
  
  renderBaseTasksRows();
}

/**
 * Handle add base task
 */
function handleAddBaseTask() {
  const slug = prompt('Enter base task slug:');
  if (!slug) return;
  
  const baseTask = {
    slug: slug.trim(),
    sampleTitles: [slug],
    defaultMinutes: 30,
    defaultPriority: 'P2',
    defaultType: 'S',
    defaultProjectId: null,
    weights: {}
  };
  
  addBaseTask(baseTask);
}

/**
 * Add base task
 * @param {Object} baseTask - Base task object
 */
async function addBaseTask(baseTask) {
  try {
    await baseTasks.put(baseTask);
    currentBaseTasks.push(baseTask);
    filteredBaseTasks = [...currentBaseTasks];
    await renderBaseTasksRows();
    showToast('Base task added successfully');
  } catch (error) {
    showToast(`Failed to add base task: ${error.message}`);
  }
}

/**
 * Update base task
 * @param {string} slug - Base task slug
 * @param {string} field - Field to update
 * @param {*} value - New value
 */
window.updateBaseTask = async function(slug, field, value) {
  try {
    const baseTask = await baseTasks.get(slug);
    if (!baseTask) return;
    
    baseTask[field] = value;
    await baseTasks.put(baseTask);
    
    // Update local cache
    const index = currentBaseTasks.findIndex(bt => bt.slug === slug);
    if (index !== -1) {
      currentBaseTasks[index] = baseTask;
    }
    
    showToast('Base task updated successfully');
  } catch (error) {
    showToast(`Failed to update base task: ${error.message}`);
  }
};

/**
 * Update base task weights
 * @param {string} slug - Base task slug
 * @param {string} weightsText - Weights text
 */
window.updateBaseTaskWeights = async function(slug, weightsText) {
  try {
    const baseTask = await baseTasks.get(slug);
    if (!baseTask) return;
    
    const weights = parseWeights(weightsText);
    baseTask.weights = weights;
    await baseTasks.put(baseTask);
    
    // Update local cache
    const index = currentBaseTasks.findIndex(bt => bt.slug === slug);
    if (index !== -1) {
      currentBaseTasks[index] = baseTask;
    }
    
    showToast('Base task weights updated successfully');
  } catch (error) {
    showToast(`Failed to update weights: ${error.message}`);
  }
};

/**
 * Parse weights text
 * @param {string} weightsText - Weights text
 * @returns {Object} Weights object
 */
function parseWeights(weightsText) {
  const weights = {};
  
  if (!weightsText.trim()) {
    return weights;
  }
  
  const pairs = weightsText.split(',').map(pair => pair.trim());
  
  for (const pair of pairs) {
    const [key, value] = pair.split(':').map(s => s.trim());
    if (key && value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
        weights[key] = numValue;
      }
    }
  }
  
  return weights;
}

/**
 * Delete base task
 * @param {string} slug - Base task slug
 */
window.deleteBaseTask = async function(slug) {
  if (!confirm('Delete this base task?')) return;
  
  try {
    await baseTasks.delete(slug);
    
    // Update local cache
    currentBaseTasks = currentBaseTasks.filter(bt => bt.slug !== slug);
    filteredBaseTasks = filteredBaseTasks.filter(bt => bt.slug !== slug);
    
    await renderBaseTasksRows();
    showToast('Base task deleted successfully');
  } catch (error) {
    showToast(`Failed to delete base task: ${error.message}`);
  }
};

/**
 * Show toast message
 * @param {string} message - Message to show
 */
function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
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
  initBaseTasks,
  renderBaseTasksTable,
  renderBaseTasksRows
};
