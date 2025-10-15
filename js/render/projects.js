// Projects rendering and management
import { projects, tasks } from '../store.js';

let currentProjects = [];
let currentProject = null;

/**
 * Initialize projects page
 */
export async function initProjects() {
  // Load projects
  currentProjects = await projects.getAll();
  
  // Render projects grid
  await renderProjectsGrid();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Render projects grid
 */
async function renderProjectsGrid() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  for (const project of currentProjects) {
    const projectCard = await createProjectCard(project);
    grid.appendChild(projectCard);
  }
  
  // Add "Add Project" card
  const addCard = createAddProjectCard();
  grid.appendChild(addCard);
}

/**
 * Create project card
 * @param {Object} project - Project object
 * @returns {HTMLElement} Project card element
 */
async function createProjectCard(project) {
  const card = document.createElement('div');
  card.className = 'project-card';
  card.dataset.projectId = project.id;
  
  // Get project statistics
  const stats = await getProjectStats(project.id);
  
  card.innerHTML = `
    <div class="project-header">
      <div class="project-color" style="background-color: ${project.color || '#7C4DFF'}"></div>
      <h3 class="project-name">${escapeHtml(project.name)}</h3>
      <div class="project-actions">
        <button class="btn btn-sm" onclick="editProject('${project.id}')">Edit</button>
        <button class="btn btn-sm danger" onclick="deleteProject('${project.id}')">Delete</button>
      </div>
    </div>
    
    <div class="project-stats">
      <div class="stat-item">
        <span class="stat-label">Total Tasks</span>
        <span class="stat-value">${stats.totalTasks}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Completed</span>
        <span class="stat-value">${stats.completedTasks}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Completion</span>
        <span class="stat-value">${stats.completionRate.toFixed(1)}%</span>
      </div>
    </div>
    
    <div class="project-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${stats.completionRate}%"></div>
      </div>
    </div>
    
    <div class="project-meta">
      <span class="project-total-time">${stats.totalMinutes}min total</span>
      <span class="project-created">Created ${formatDate(new Date(project.createdAt))}</span>
    </div>
  `;
  
  // Add click handler for filtering
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.project-actions')) {
      filterByProject(project.id);
    }
  });
  
  return card;
}

/**
 * Create add project card
 * @returns {HTMLElement} Add project card element
 */
function createAddProjectCard() {
  const card = document.createElement('div');
  card.className = 'project-card add-project-card';
  
  card.innerHTML = `
    <div class="add-project-content">
      <div class="add-project-icon">+</div>
      <h3 class="add-project-title">Add New Project</h3>
      <p class="add-project-description">Create a new project to organize your tasks</p>
    </div>
  `;
  
  card.addEventListener('click', handleAddProject);
  
  return card;
}

/**
 * Get project statistics
 * @param {string} projectId - Project ID
 * @returns {Object} Project statistics
 */
async function getProjectStats(projectId) {
  const projectTasks = await tasks.getTasksByProject(projectId);
  const completed = projectTasks.filter(task => task.done).length;
  const total = projectTasks.length;
  const totalMinutes = projectTasks.reduce((sum, task) => sum + (task.minutes || 0), 0);
  
  return {
    totalTasks: total,
    completedTasks: completed,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    totalMinutes
  };
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Add project button
  const addBtn = document.getElementById('add-project-btn');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddProject);
  }
}

/**
 * Handle add project
 */
function handleAddProject() {
  const name = prompt('Enter project name:');
  if (!name) return;
  
  const project = {
    id: generateId(),
    name: name.trim(),
    color: generateProjectColor(),
    createdAt: Date.now()
  };
  
  addProject(project);
}

/**
 * Add project
 * @param {Object} project - Project object
 */
async function addProject(project) {
  try {
    await projects.put(project);
    currentProjects.push(project);
    await renderProjectsGrid();
    showToast('Project added successfully');
  } catch (error) {
    showToast(`Failed to add project: ${error.message}`);
  }
}

/**
 * Edit project
 * @param {string} projectId - Project ID
 */
window.editProject = async function(projectId) {
  const project = await projects.get(projectId);
  if (!project) return;
  
  const newName = prompt('Enter new project name:', project.name);
  if (!newName || newName === project.name) return;
  
  try {
    project.name = newName.trim();
    await projects.put(project);
    
    // Update local cache
    const index = currentProjects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      currentProjects[index] = project;
    }
    
    await renderProjectsGrid();
    showToast('Project updated successfully');
  } catch (error) {
    showToast(`Failed to update project: ${error.message}`);
  }
};

/**
 * Delete project
 * @param {string} projectId - Project ID
 */
window.deleteProject = async function(projectId) {
  if (!confirm('Delete this project? All associated tasks will be unassigned.')) return;
  
  try {
    // Unassign tasks from this project
    const projectTasks = await tasks.getTasksByProject(projectId);
    for (const task of projectTasks) {
      task.projectId = null;
      await tasks.put(task);
    }
    
    // Delete project
    await projects.delete(projectId);
    
    // Update local cache
    currentProjects = currentProjects.filter(p => p.id !== projectId);
    
    await renderProjectsGrid();
    showToast('Project deleted successfully');
  } catch (error) {
    showToast(`Failed to delete project: ${error.message}`);
  }
};

/**
 * Filter tasks by project
 * @param {string} projectId - Project ID
 */
async function filterByProject(projectId) {
  // TODO: Implement project filtering in timeline
  console.log('Filter by project:', projectId);
  showToast(`Filtering by project: ${(await projects.get(projectId))?.name}`);
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate project color
 * @returns {string} Hex color
 */
function generateProjectColor() {
  const colors = [
    '#7C4DFF', '#22C55E', '#F59E0B', '#EF4444', '#0EA5E9',
    '#8B5CF6', '#10B981', '#F97316', '#DC2626', '#3B82F6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Format date
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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
  initProjects,
  renderProjectsGrid
};
