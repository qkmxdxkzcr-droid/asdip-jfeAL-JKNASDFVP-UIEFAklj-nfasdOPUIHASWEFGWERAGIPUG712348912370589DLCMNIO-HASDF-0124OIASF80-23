// Reactive store with in-memory cache and subscriptions
import { 
  tasksStore, 
  daysStore, 
  templatesStore, 
  projectsStore, 
  baseTasksStore, 
  settingsStore,
  safeGet,
  safePut,
  safeDelete,
  batchPut,
  batchDelete
} from './db.js';

// In-memory cache
const cache = {
  tasks: new Map(),
  days: new Map(),
  templates: new Map(),
  projects: new Map(),
  baseTasks: new Map(),
  settings: new Map()
};

// Subscribers
const subscribers = {
  tasks: new Set(),
  days: new Set(),
  templates: new Set(),
  projects: new Set(),
  baseTasks: new Set(),
  settings: new Set()
};

// Store class
class Store {
  constructor(storeName, dbStore) {
    this.storeName = storeName;
    this.dbStore = dbStore;
  }

  // Get all items (from cache or DB)
  async getAll() {
    if (cache[this.storeName].size === 0) {
      await this.loadAll();
    }
    return Array.from(cache[this.storeName].values());
  }

  // Get single item
  async get(key) {
    if (cache[this.storeName].has(key)) {
      return cache[this.storeName].get(key);
    }
    
    const item = await safeGet(this.dbStore, key);
    if (item) {
      cache[this.storeName].set(key, item);
    }
    return item;
  }

  // Add/Update item
  async put(item) {
    await safePut(this.dbStore, item);
    cache[this.storeName].set(item.id || item.key || item.slug || item.date, item);
    this.notifySubscribers();
    return item;
  }

  // Delete item
  async delete(key) {
    await safeDelete(this.dbStore, key);
    cache[this.storeName].delete(key);
    this.notifySubscribers();
  }

  // Clear all items
  async clear() {
    await this.dbStore.clear();
    cache[this.storeName].clear();
    this.notifySubscribers();
  }

  // Load all items from DB
  async loadAll() {
    const items = await this.dbStore.getAll();
    cache[this.storeName].clear();
    items.forEach(item => {
      const key = item.id || item.key || item.slug || item.date;
      cache[this.storeName].set(key, item);
    });
  }

  // Subscribe to changes
  subscribe(callback) {
    subscribers[this.storeName].add(callback);
    return () => subscribers[this.storeName].delete(callback);
  }

  // Notify subscribers
  notifySubscribers() {
    subscribers[this.storeName].forEach(callback => {
      try {
        callback(Array.from(cache[this.storeName].values()));
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  // Batch operations
  async batchPut(items) {
    await batchPut(this.storeName, items);
    items.forEach(item => {
      const key = item.id || item.key || item.slug || item.date;
      cache[this.storeName].set(key, item);
    });
    this.notifySubscribers();
  }

  async batchDelete(keys) {
    await batchDelete(this.storeName, keys);
    keys.forEach(key => cache[this.storeName].delete(key));
    this.notifySubscribers();
  }
}

// Create store instances
export const tasks = new Store('tasks', tasksStore);
export const days = new Store('days', daysStore);
export const templates = new Store('templates', templatesStore);
export const projects = new Store('projects', projectsStore);
export const baseTasks = new Store('baseTasks', baseTasksStore);
export const settings = new Store('settings', settingsStore);

// Initialize cache on load
export async function initializeCache() {
  await Promise.all([
    tasks.loadAll(),
    days.loadAll(),
    templates.loadAll(),
    projects.loadAll(),
    baseTasks.loadAll(),
    settings.loadAll()
  ]);
}

// Default settings
export const defaultSettings = {
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

// Settings helpers
export async function getSetting(key) {
  const setting = await settings.get(key);
  return setting ? setting.value : defaultSettings[key];
}

export async function setSetting(key, value) {
  await settings.put({ key, value });
}

export async function getAllSettings() {
  const settingsList = await settings.getAll();
  const result = { ...defaultSettings };
  
  settingsList.forEach(setting => {
    result[setting.key] = setting.value;
  });
  
  return result;
}

// Task helpers
export async function getTasksForDay(date) {
  const allTasks = await tasks.getAll();
  return allTasks.filter(task => task.planned?.date === date);
}

export async function getUnplannedTasks() {
  const allTasks = await tasks.getAll();
  return allTasks.filter(task => !task.planned);
}

export async function getTasksByProject(projectId) {
  const allTasks = await tasks.getAll();
  return allTasks.filter(task => task.projectId === projectId);
}

export async function getCompletedTasks() {
  const allTasks = await tasks.getAll();
  return allTasks.filter(task => task.done);
}

// Day helpers
export async function getDay(date) {
  return await days.get(date);
}

export async function createDay(date, templateId = null) {
  const day = {
    date,
    templateId,
    windows: [],
    fixed: [],
    placed: []
  };
  
  if (templateId) {
    const template = await templates.get(templateId);
    if (template) {
      day.windows = [...template.windows];
      day.fixed = [...template.fixed];
    }
  }
  
  await days.put(day);
  return day;
}

// Statistics helpers
export async function getTaskStats() {
  const allTasks = await tasks.getAll();
  const completed = allTasks.filter(task => task.done).length;
  const total = allTasks.length;
  const planned = allTasks.filter(task => task.planned).length;
  
  const totalMinutes = allTasks.reduce((sum, task) => sum + (task.minutes || 0), 0);
  const completedMinutes = allTasks
    .filter(task => task.done)
    .reduce((sum, task) => sum + (task.minutes || 0), 0);
  
  return {
    total,
    completed,
    planned,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    totalMinutes,
    completedMinutes,
    plannedMinutes: allTasks
      .filter(task => task.planned)
      .reduce((sum, task) => sum + (task.minutes || 0), 0)
  };
}

export async function getProjectStats() {
  const allTasks = await tasks.getAll();
  const allProjects = await projects.getAll();
  
  const projectStats = allProjects.map(project => {
    const projectTasks = allTasks.filter(task => task.projectId === project.id);
    const completed = projectTasks.filter(task => task.done).length;
    const total = projectTasks.length;
    
    return {
      ...project,
      totalTasks: total,
      completedTasks: completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      totalMinutes: projectTasks.reduce((sum, task) => sum + (task.minutes || 0), 0)
    };
  });
  
  return projectStats.sort((a, b) => b.totalTasks - a.totalTasks);
}

// Calendar helpers
export async function getCalendarStats(startDate, endDate) {
  const allTasks = await tasks.getAll();
  const stats = new Map();
  
  // Generate date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().slice(0, 10);
    const dayTasks = allTasks.filter(task => task.planned?.date === dateKey);
    const completed = dayTasks.filter(task => task.done).length;
    
    stats.set(dateKey, {
      total: dayTasks.length,
      done: completed,
      ratio: dayTasks.length > 0 ? completed / dayTasks.length : 0
    });
  }
  
  return stats;
}

// Search helpers
export async function searchTasks(query) {
  const allTasks = await tasks.getAll();
  const normalizedQuery = query.toLowerCase().trim();
  
  return allTasks.filter(task => 
    task.title.toLowerCase().includes(normalizedQuery) ||
    (task.projectId && (await projects.get(task.projectId))?.name.toLowerCase().includes(normalizedQuery))
  );
}

export async function searchBaseTasks(query) {
  const allBaseTasks = await baseTasks.getAll();
  const normalizedQuery = query.toLowerCase().trim();
  
  return allBaseTasks.filter(baseTask =>
    baseTask.slug.toLowerCase().includes(normalizedQuery) ||
    baseTask.sampleTitles.some(title => title.toLowerCase().includes(normalizedQuery))
  );
}

// Export all stores
export default {
  tasks,
  days,
  templates,
  projects,
  baseTasks,
  settings,
  initializeCache,
  getSetting,
  setSetting,
  getAllSettings,
  getTasksForDay,
  getUnplannedTasks,
  getTasksByProject,
  getCompletedTasks,
  getDay,
  createDay,
  getTaskStats,
  getProjectStats,
  getCalendarStats,
  searchTasks,
  searchBaseTasks
};
