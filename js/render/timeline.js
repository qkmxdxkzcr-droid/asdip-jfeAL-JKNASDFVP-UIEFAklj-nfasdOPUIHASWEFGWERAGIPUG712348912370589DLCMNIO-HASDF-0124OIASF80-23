// Timeline rendering and DnD functionality
import { tasks, days, projects, baseTasks } from '../store.js';
import { autoSchedule } from '../scheduler.js';
import { buildCurves, getChartData, getChartOptions } from '../curves.js';
import { getCurrentSettings } from '../settings.js';

let sortables = [];
let currentDay = null;
let curvesChart = null;

/**
 * Initialize timeline
 */
export async function initTimeline() {
  // Get current date
  const today = new Date().toISOString().slice(0, 10);
  currentDay = await getDay(today);
  
  if (!currentDay) {
    // Create new day
    currentDay = {
      date: today,
      windows: [
        { id: 'morning', title: 'Morning', startMin: 8 * 60, endMin: 12 * 60 },
        { id: 'afternoon', title: 'Afternoon', startMin: 12 * 60, endMin: 17 * 60 },
        { id: 'evening', title: 'Evening', startMin: 17 * 60, endMin: 22 * 60 }
      ],
      fixed: [
        { id: 'lunch', title: 'Lunch', startMin: 13 * 60, endMin: 14 * 60, kind: 'meal' }
      ],
      placed: []
    };
    
    await days.put(currentDay);
  }
  
  // Render timeline
  await renderTimeline();
  
  // Initialize DnD
  initDnD();
  
  // Initialize curves
  await initCurves();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Render timeline
 */
async function renderTimeline() {
  const timelineGrid = document.getElementById('timeline-grid');
  const unplannedList = document.getElementById('unplanned');
  
  if (!timelineGrid || !unplannedList) return;
  
  // Render windows
  timelineGrid.innerHTML = '';
  for (const window of currentDay.windows) {
    const windowEl = createWindowElement(window);
    timelineGrid.appendChild(windowEl);
  }
  
  // Render unplanned tasks
  await renderUnplannedTasks();
  
  // Render placed tasks
  await renderPlacedTasks();
}

/**
 * Create window element
 * @param {Object} window - Window object
 * @returns {HTMLElement} Window element
 */
function createWindowElement(window) {
  const windowEl = document.createElement('div');
  windowEl.className = 'timeline-window';
  windowEl.dataset.windowId = window.id;
  
  // Calculate used time
  const placed = currentDay.placed.filter(p => p.windowId === window.id);
  const used = placed.reduce((sum, p) => sum + (p.endMin - p.startMin), 0);
  const total = window.endMin - window.startMin;
  const progress = total > 0 ? (used / total) * 100 : 0;
  
  windowEl.innerHTML = `
    <div class="window-header">
      <h3 class="window-title">${window.title}</h3>
      <div class="window-time">${formatTime(window.startMin)} - ${formatTime(window.endMin)}</div>
      <div class="window-stats">
        <span class="used">${used}min</span>
        <span class="total">/${total}min</span>
      </div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${progress}%"></div>
    </div>
    <div class="droplist window-tasks" data-total="${total}" data-used="${used}">
      <!-- Tasks will be rendered here -->
    </div>
  `;
  
  return windowEl;
}

/**
 * Render unplanned tasks
 */
async function renderUnplannedTasks() {
  const unplannedList = document.getElementById('unplanned');
  if (!unplannedList) return;
  
  const unplannedTasks = await tasks.getUnplannedTasks();
  
  unplannedList.innerHTML = '';
  for (const task of unplannedTasks) {
    const taskEl = createTaskElement(task);
    unplannedList.appendChild(taskEl);
  }
}

/**
 * Render placed tasks
 */
async function renderPlacedTasks() {
  for (const placement of currentDay.placed) {
    const task = await tasks.get(placement.taskId);
    if (!task) continue;
    
    const windowEl = document.querySelector(`[data-window-id="${placement.windowId}"] .window-tasks`);
    if (!windowEl) continue;
    
    const taskEl = createTaskElement(task);
    taskEl.dataset.placement = JSON.stringify(placement);
    windowEl.appendChild(taskEl);
  }
}

/**
 * Create task element
 * @param {Object} task - Task object
 * @returns {HTMLElement} Task element
 */
function createTaskElement(task) {
  const taskEl = document.createElement('div');
  taskEl.className = 'task';
  taskEl.dataset.taskId = task.id;
  taskEl.dataset.minutes = task.minutes || 0;
  
  const priorityClass = task.priority ? `priority-${task.priority.toLowerCase()}` : 'priority-p2';
  const typeClass = task.type ? `type-${task.type.toLowerCase()}` : '';
  
  taskEl.innerHTML = `
    <div class="task-checkbox">
      <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTaskCompletion(this)">
      <span class="checkmark"></span>
      <span class="label">${escapeHtml(task.title)}</span>
    </div>
    <div class="drag-handle">⋮⋮</div>
    <div class="task-content">
      <div class="task-meta">
        <span class="minutes">${task.minutes || 0}min</span>
        ${task.projectId ? `<span class="project">${getProjectName(task.projectId)}</span>` : ''}
      </div>
    </div>
    <span class="priority ${priorityClass}">${task.priority || 'P2'}</span>
    <button class="del" title="Delete" onclick="deleteTask('${task.id}')">&times;</button>
  `;
  
  if (typeClass) {
    taskEl.classList.add(typeClass);
  }
  
  return taskEl;
}

/**
 * Initialize DnD with SortableJS
 */
function initDnD() {
  // Destroy existing sortables
  sortables.forEach(sortable => sortable.destroy());
  sortables = [];
  
  // Initialize sortables for all droplists
  document.querySelectorAll('.droplist').forEach(listEl => {
    const sortable = new Sortable(listEl, {
      group: 'windows',
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'task-ghost',
      chosenClass: 'task-chosen',
      dragClass: 'task-drag',
      onStart: (evt) => {
        evt.item.classList.add('dragging');
      },
      onEnd: async (evt) => {
        evt.item.classList.remove('dragging');
        
        const taskId = evt.item.dataset.taskId;
        const fromList = evt.from;
        const toList = evt.to;
        
        // Check if moving to window (not unplanned)
        if (toList.id !== 'unplanned') {
          const total = parseInt(toList.dataset.total) || 0;
          const used = parseInt(toList.dataset.used) || 0;
          const taskMinutes = parseInt(evt.item.dataset.minutes) || 0;
          
          if (used + taskMinutes > total + 3) { // 3-minute tolerance
            // Revert move
            evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex]);
            showToast('Task does not fit in this window');
            return;
          }
        }
        
        // Update task placement
        await updateTaskPlacement(taskId, fromList, toList);
        
        // Recalculate window stats
        recalculateWindowStats();
      }
    });
    
    sortables.push(sortable);
  });
}

/**
 * Update task placement after DnD
 * @param {string} taskId - Task ID
 * @param {HTMLElement} fromList - Source list
 * @param {HTMLElement} toList - Target list
 */
async function updateTaskPlacement(taskId, fromList, toList) {
  const task = await tasks.get(taskId);
  if (!task) return;
  
  // Remove from current placement
  if (task.planned) {
    currentDay.placed = currentDay.placed.filter(p => p.taskId !== taskId);
  }
  
  // Add to new placement
  if (toList.id !== 'unplanned') {
    const windowId = toList.closest('.timeline-window')?.dataset.windowId;
    if (windowId) {
      const window = currentDay.windows.find(w => w.id === windowId);
      if (window) {
        const startMin = findNextFreeSlot(window, task.minutes || 0);
        if (startMin !== null) {
          const placement = {
            windowId,
            taskId,
            startMin,
            endMin: startMin + (task.minutes || 0)
          };
          
          currentDay.placed.push(placement);
          task.planned = {
            date: currentDay.date,
            windowId,
            startMin,
            endMin: placement.endMin
          };
        }
      }
    }
  } else {
    // Moving to unplanned
    task.planned = null;
  }
  
  // Save changes
  await tasks.put(task);
  await days.put(currentDay);
}

/**
 * Find next free slot in window
 * @param {Object} window - Window object
 * @param {number} duration - Duration in minutes
 * @returns {number|null} Start time in minutes
 */
function findNextFreeSlot(window, duration) {
  const placed = currentDay.placed.filter(p => p.windowId === window.id);
  const slots = [];
  
  // Add window boundaries
  slots.push({ start: window.startMin, end: window.startMin });
  slots.push({ start: window.endMin, end: window.endMin });
  
  // Add placed tasks
  placed.forEach(placement => {
    slots.push({ start: placement.startMin, end: placement.endMin });
  });
  
  // Sort by start time
  slots.sort((a, b) => a.start - b.start);
  
  // Find first gap that fits
  for (let i = 0; i < slots.length - 1; i++) {
    const gapStart = slots[i].end;
    const gapEnd = slots[i + 1].start;
    const gapSize = gapEnd - gapStart;
    
    if (gapSize >= duration) {
      return gapStart;
    }
  }
  
  return null;
}

/**
 * Recalculate window statistics
 */
function recalculateWindowStats() {
  document.querySelectorAll('.timeline-window').forEach(windowEl => {
    const windowId = windowEl.dataset.windowId;
    const window = currentDay.windows.find(w => w.id === windowId);
    if (!window) return;
    
    const placed = currentDay.placed.filter(p => p.windowId === windowId);
    const used = placed.reduce((sum, p) => sum + (p.endMin - p.startMin), 0);
    const total = window.endMin - window.startMin;
    const progress = total > 0 ? (used / total) * 100 : 0;
    
    // Update stats display
    const statsEl = windowEl.querySelector('.window-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <span class="used">${used}min</span>
        <span class="total">/${total}min</span>
      `;
    }
    
    // Update progress bar
    const progressEl = windowEl.querySelector('.progress-fill');
    if (progressEl) {
      progressEl.style.width = `${progress}%`;
    }
    
    // Update droplist data
    const droplist = windowEl.querySelector('.droplist');
    if (droplist) {
      droplist.dataset.used = used;
    }
  });
}

/**
 * Initialize curves chart
 */
async function initCurves() {
  const canvas = document.getElementById('curvesCanvas');
  if (!canvas) return;
  
  // Build curves for current day
  const curves = buildCurves({
    dayStartMin: 8 * 60,
    durationMin: 16 * 60,
    meals: currentDay.fixed?.filter(f => f.kind === 'meal').map(f => f.startMin) || []
  });
  
  // Create chart
  if (typeof Chart !== 'undefined') {
    curvesChart = new Chart(canvas, {
      type: 'line',
      data: getChartData(curves),
      options: getChartOptions()
    });
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Auto-schedule button
  const autoScheduleBtn = document.getElementById('auto-schedule-btn');
  if (autoScheduleBtn) {
    autoScheduleBtn.addEventListener('click', handleAutoSchedule);
  }
  
  // Add task button
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', handleAddTask);
  }
  
  // Add unplanned task button
  const addUnplannedBtn = document.getElementById('add-unplanned-btn');
  if (addUnplannedBtn) {
    addUnplannedBtn.addEventListener('click', handleAddUnplannedTask);
  }
}

/**
 * Handle auto-schedule
 */
async function handleAutoSchedule() {
  const unplannedTasks = await tasks.getUnplannedTasks();
  if (unplannedTasks.length === 0) {
    showToast('No unplanned tasks to schedule');
    return;
  }
  
  const settings = getCurrentSettings();
  const result = await autoSchedule(currentDay, unplannedTasks, settings);
  
  // Update current day
  currentDay = result.day;
  await days.put(currentDay);
  
  // Update tasks
  for (const task of result.tasks) {
    await tasks.put(task);
  }
  
  // Re-render timeline
  await renderTimeline();
  initDnD();
  
  showToast(`Scheduled ${result.scheduled} tasks, ${result.unscheduled} remain unplanned`);
}

/**
 * Handle add task
 */
function handleAddTask() {
  // TODO: Implement add task modal
  console.log('Add task clicked');
}

/**
 * Handle add unplanned task
 */
function handleAddUnplannedTask() {
  // TODO: Implement add unplanned task modal
  console.log('Add unplanned task clicked');
}

/**
 * Toggle task completion
 * @param {HTMLInputElement} checkbox - Checkbox element
 */
window.toggleTaskCompletion = async function(checkbox) {
  const taskEl = checkbox.closest('.task');
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
 * Delete task
 * @param {string} taskId - Task ID
 */
window.deleteTask = async function(taskId) {
  if (confirm('Delete this task?')) {
    await tasks.delete(taskId);
    
    // Remove from current day
    currentDay.placed = currentDay.placed.filter(p => p.taskId !== taskId);
    await days.put(currentDay);
    
    // Re-render timeline
    await renderTimeline();
    initDnD();
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
 * Escape HTML
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get project name by ID
 * @param {string} projectId - Project ID
 * @returns {string} Project name
 */
async function getProjectName(projectId) {
  const project = await projects.get(projectId);
  return project ? project.name : 'Unknown';
}

// Export default
export default {
  initTimeline,
  renderTimeline,
  initDnD
};
