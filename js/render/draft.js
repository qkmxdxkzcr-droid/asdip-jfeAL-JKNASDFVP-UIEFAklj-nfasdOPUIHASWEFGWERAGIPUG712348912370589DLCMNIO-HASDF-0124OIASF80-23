// Draft page rendering and management
import { tasks, days } from '../store.js';
import { autoSchedule } from '../scheduler.js';
import { getCurrentSettings } from '../settings.js';

let draftTasks = [];

/**
 * Initialize draft page
 */
export async function initDraft() {
  // Load draft tasks
  await loadDraftTasks();
  
  // Render draft tasks
  await renderDraftTasks();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Load draft tasks
 */
async function loadDraftTasks() {
  const allTasks = await tasks.getAll();
  draftTasks = allTasks.filter(task => !task.planned && !task.done);
}

/**
 * Render draft tasks
 */
async function renderDraftTasks() {
  const container = document.getElementById('draft-tasks');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (draftTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-draft">
        <div class="empty-icon">📝</div>
        <h3>No Draft Tasks</h3>
        <p>Add some tasks to start planning your day</p>
        <button class="btn primary" onclick="addDraftTask()">Add Task</button>
      </div>
    `;
    return;
  }
  
  for (const task of draftTasks) {
    const taskEl = createDraftTaskElement(task);
    container.appendChild(taskEl);
  }
}

/**
 * Create draft task element
 * @param {Object} task - Task object
 * @returns {HTMLElement} Task element
 */
function createDraftTaskElement(task) {
  const taskEl = document.createElement('div');
  taskEl.className = 'draft-task';
  taskEl.dataset.taskId = task.id;
  
  const priorityClass = task.priority ? `priority-${task.priority.toLowerCase()}` : 'priority-p2';
  const typeClass = task.type ? `type-${task.type.toLowerCase()}` : '';
  
  taskEl.innerHTML = `
    <div class="task-checkbox">
      <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleDraftTaskCompletion(this)">
      <span class="checkmark"></span>
      <span class="label">${escapeHtml(task.title)}</span>
    </div>
    
    <div class="task-content">
      <div class="task-meta">
        <span class="minutes">${task.minutes || 0}min</span>
        ${task.priority ? `<span class="priority ${priorityClass}">${task.priority}</span>` : ''}
        ${task.type ? `<span class="type ${typeClass}">${task.type}</span>` : ''}
      </div>
    </div>
    
    <div class="task-actions">
      <button class="btn btn-sm" onclick="editDraftTask('${task.id}')">Edit</button>
      <button class="btn btn-sm danger" onclick="deleteDraftTask('${task.id}')">Delete</button>
    </div>
  `;
  
  if (typeClass) {
    taskEl.classList.add(typeClass);
  }
  
  return taskEl;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Add draft task button
  const addBtn = document.getElementById('add-draft-task-btn');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddDraftTask);
  }
  
  // Distribute draft button
  const distributeBtn = document.getElementById('distribute-draft-btn');
  if (distributeBtn) {
    distributeBtn.addEventListener('click', handleDistributeDraft);
  }
}

/**
 * Handle add draft task
 */
function handleAddDraftTask() {
  const title = prompt('Enter task title:');
  if (!title) return;
  
  const minutes = prompt('Enter duration in minutes:', '30');
  const priority = prompt('Enter priority (P1-P4):', 'P2');
  
  const task = {
    id: generateId(),
    title: title.trim(),
    minutes: parseInt(minutes) || 30,
    priority: priority || 'P2',
    type: 'S',
    done: false,
    createdAt: Date.now()
  };
  
  addDraftTask(task);
}

/**
 * Add draft task
 * @param {Object} task - Task object
 */
async function addDraftTask(task) {
  try {
    await tasks.put(task);
    draftTasks.push(task);
    await renderDraftTasks();
    showToast('Draft task added successfully');
  } catch (error) {
    showToast(`Failed to add draft task: ${error.message}`);
  }
}

/**
 * Handle distribute draft
 */
async function handleDistributeDraft() {
  if (draftTasks.length === 0) {
    showToast('No draft tasks to distribute');
    return;
  }
  
  const days = prompt('How many days to distribute over?', '7');
  const daysCount = parseInt(days) || 7;
  
  if (daysCount < 1 || daysCount > 30) {
    showToast('Please enter a number between 1 and 30');
    return;
  }
  
  try {
    await distributeDraftTasks(daysCount);
    showToast(`Distributed ${draftTasks.length} tasks over ${daysCount} days`);
  } catch (error) {
    showToast(`Failed to distribute tasks: ${error.message}`);
  }
}

/**
 * Distribute draft tasks over multiple days
 * @param {number} daysCount - Number of days
 */
async function distributeDraftTasks(daysCount) {
  const settings = getCurrentSettings();
  const tasksPerDay = Math.ceil(draftTasks.length / daysCount);
  
  for (let i = 0; i < daysCount; i++) {
    const startIndex = i * tasksPerDay;
    const endIndex = Math.min(startIndex + tasksPerDay, draftTasks.length);
    const dayTasks = draftTasks.slice(startIndex, endIndex);
    
    if (dayTasks.length === 0) break;
    
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().slice(0, 10);
    
    // Get or create day
    let day = await days.get(dateString);
    if (!day) {
      day = {
        date: dateString,
        windows: [
          { id: 'morning', title: 'Morning', startMin: 8 * 60, endMin: 12 * 60 },
          { id: 'afternoon', title: 'Afternoon', startMin: 12 * 60, endMin: 17 * 60 },
          { id: 'evening', title: 'Evening', startMin: 17 * 60, endMin: 22 * 60 }
        ],
        fixed: [],
        placed: []
      };
    }
    
    // Auto-schedule tasks for this day
    const result = await autoSchedule(day, dayTasks, settings);
    
    // Update day
    await days.put(result.day);
    
    // Update tasks
    for (const task of result.tasks) {
      await tasks.put(task);
    }
  }
  
  // Clear draft tasks
  draftTasks = [];
  await renderDraftTasks();
}

/**
 * Toggle draft task completion
 * @param {HTMLInputElement} checkbox - Checkbox element
 */
window.toggleDraftTaskCompletion = async function(checkbox) {
  const taskEl = checkbox.closest('.draft-task');
  const taskId = taskEl.dataset.taskId;
  const task = await tasks.get(taskId);
  
  if (task) {
    task.done = checkbox.checked;
    await tasks.put(task);
    
    // Update visual state
    if (checkbox.checked) {
      taskEl.classList.add('status-done');
    } else {
      taskEl.classList.remove('status-done');
    }
  }
};

/**
 * Edit draft task
 * @param {string} taskId - Task ID
 */
window.editDraftTask = async function(taskId) {
  const task = await tasks.get(taskId);
  if (!task) return;
  
  const newTitle = prompt('Enter new title:', task.title);
  if (!newTitle || newTitle === task.title) return;
  
  const newMinutes = prompt('Enter new duration in minutes:', task.minutes?.toString() || '30');
  const newPriority = prompt('Enter new priority (P1-P4):', task.priority || 'P2');
  
  try {
    task.title = newTitle.trim();
    task.minutes = parseInt(newMinutes) || 30;
    task.priority = newPriority || 'P2';
    
    await tasks.put(task);
    
    // Update local cache
    const index = draftTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      draftTasks[index] = task;
    }
    
    await renderDraftTasks();
    showToast('Draft task updated successfully');
  } catch (error) {
    showToast(`Failed to update draft task: ${error.message}`);
  }
};

/**
 * Delete draft task
 * @param {string} taskId - Task ID
 */
window.deleteDraftTask = async function(taskId) {
  if (!confirm('Delete this draft task?')) return;
  
  try {
    await tasks.delete(taskId);
    
    // Update local cache
    draftTasks = draftTasks.filter(t => t.id !== taskId);
    
    await renderDraftTasks();
    showToast('Draft task deleted successfully');
  } catch (error) {
    showToast(`Failed to delete draft task: ${error.message}`);
  }
};

/**
 * Add draft task (global function)
 */
window.addDraftTask = function() {
  handleAddDraftTask();
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
  initDraft
};
