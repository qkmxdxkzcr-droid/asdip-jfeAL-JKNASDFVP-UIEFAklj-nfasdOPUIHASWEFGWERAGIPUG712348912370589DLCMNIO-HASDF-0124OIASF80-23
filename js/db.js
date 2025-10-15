// IndexedDB layer using idb wrapper
import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/dist/umd.min.js';

const DB_NAME = 'scheduler.v1';
const DB_VERSION = 1;

// Database schema
const stores = {
  tasks: { keyPath: 'id' },
  days: { keyPath: 'date' },
  templates: { keyPath: 'id' },
  projects: { keyPath: 'id' },
  baseTasks: { keyPath: 'slug' },
  settings: { keyPath: 'key' }
};

// Open database
export const db = await openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Create object stores
    Object.entries(stores).forEach(([name, options]) => {
      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, options);
      }
    });
  }
});

// Generic CRUD operations
export class Store {
  constructor(storeName) {
    this.storeName = storeName;
  }

  async getAll() {
    return await db.getAll(this.storeName);
  }

  async get(key) {
    return await db.get(this.storeName, key);
  }

  async add(item) {
    return await db.add(this.storeName, item);
  }

  async put(item) {
    return await db.put(this.storeName, item);
  }

  async delete(key) {
    return await db.delete(this.storeName, key);
  }

  async clear() {
    return await db.clear(this.storeName);
  }

  async count() {
    return await db.count(this.storeName);
  }
}

// Specific stores
export const tasksStore = new Store('tasks');
export const daysStore = new Store('days');
export const templatesStore = new Store('templates');
export const projectsStore = new Store('projects');
export const baseTasksStore = new Store('baseTasks');
export const settingsStore = new Store('settings');

// Batch operations
export async function batchPut(storeName, items) {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  for (const item of items) {
    await store.put(item);
  }
  
  await tx.done;
}

export async function batchDelete(storeName, keys) {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  for (const key of keys) {
    await store.delete(key);
  }
  
  await tx.done;
}

// Transaction helpers
export async function withTransaction(stores, mode, callback) {
  const tx = db.transaction(stores, mode);
  const result = await callback(tx);
  await tx.done;
  return result;
}

// Data validation helpers
export function validateTask(task) {
  const required = ['id', 'title', 'createdAt'];
  const missing = required.filter(field => !task[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (task.minutes && (task.minutes < 1 || task.minutes > 1440)) {
    throw new Error('Minutes must be between 1 and 1440');
  }
  
  if (task.priority && !['P1', 'P2', 'P3', 'P4'].includes(task.priority)) {
    throw new Error('Priority must be P1, P2, P3, or P4');
  }
  
  if (task.type && !['U', 'M', 'F', 'S', 'RA', 'RP'].includes(task.type)) {
    throw new Error('Type must be U, M, F, S, RA, or RP');
  }
  
  return true;
}

export function validateDay(day) {
  const required = ['date'];
  const missing = required.filter(field => !day[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }
  
  return true;
}

export function validateTemplate(template) {
  const required = ['id', 'title', 'dayStart', 'durationMin'];
  const missing = required.filter(field => !template[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (template.durationMin < 60 || template.durationMin > 1440) {
    throw new Error('Duration must be between 60 and 1440 minutes');
  }
  
  return true;
}

export function validateProject(project) {
  const required = ['id', 'name'];
  const missing = required.filter(field => !project[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
}

export function validateBaseTask(baseTask) {
  const required = ['slug', 'sampleTitles', 'defaultMinutes', 'defaultPriority', 'defaultType'];
  const missing = required.filter(field => !baseTask[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (!Array.isArray(baseTask.sampleTitles) || baseTask.sampleTitles.length === 0) {
    throw new Error('sampleTitles must be a non-empty array');
  }
  
  if (baseTask.defaultMinutes < 1 || baseTask.defaultMinutes > 1440) {
    throw new Error('defaultMinutes must be between 1 and 1440');
  }
  
  if (!['P1', 'P2', 'P3', 'P4'].includes(baseTask.defaultPriority)) {
    throw new Error('defaultPriority must be P1, P2, P3, or P4');
  }
  
  if (!['U', 'M', 'F', 'S', 'RA', 'RP'].includes(baseTask.defaultType)) {
    throw new Error('defaultType must be U, M, F, S, RA, or RP');
  }
  
  return true;
}

// Error handling
export class DatabaseError extends Error {
  constructor(message, operation, storeName) {
    super(message);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.storeName = storeName;
  }
}

// Wrapper functions with error handling
export async function safeGet(store, key) {
  try {
    return await store.get(key);
  } catch (error) {
    throw new DatabaseError(`Failed to get item: ${error.message}`, 'get', store.storeName);
  }
}

export async function safePut(store, item) {
  try {
    return await store.put(item);
  } catch (error) {
    throw new DatabaseError(`Failed to save item: ${error.message}`, 'put', store.storeName);
  }
}

export async function safeDelete(store, key) {
  try {
    return await store.delete(key);
  } catch (error) {
    throw new DatabaseError(`Failed to delete item: ${error.message}`, 'delete', store.storeName);
  }
}

// Export database instance for direct access if needed
export { db as default };
