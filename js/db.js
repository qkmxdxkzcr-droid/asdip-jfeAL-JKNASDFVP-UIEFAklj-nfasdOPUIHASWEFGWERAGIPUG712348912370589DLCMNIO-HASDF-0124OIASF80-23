// db.js - IndexedDB слой с транзакциями
// Использует idb для промисов и упрощения работы с IndexedDB

let db = null;

export async function initDB() {
  if (db) return db;
  
  // Загружаем idb из CDN если не загружен
  if (typeof idb === 'undefined') {
    await loadScript('https://cdn.jsdelivr.net/npm/idb@8/dist/umd.min.js');
  }
  
  db = await idb.openDB('scheduler.v1', 1, {
    upgrade(db) {
      // Создаем object stores
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('days')) {
        db.createObjectStore('days', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('baseTasks')) {
        db.createObjectStore('baseTasks', { keyPath: 'slug' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    }
  });
  
  return db;
}

// Базовые операции CRUD
export async function put(storeName, value) {
  const database = await initDB();
  const tx = database.transaction(storeName, 'readwrite');
  await tx.store.put(value);
  await tx.done;
}

export async function get(storeName, key) {
  const database = await initDB();
  const tx = database.transaction(storeName, 'readonly');
  return await tx.store.get(key);
}

export async function getAll(storeName) {
  const database = await initDB();
  const tx = database.transaction(storeName, 'readonly');
  const results = [];
  for await (const cursor of tx.store) {
    results.push(cursor);
  }
  await tx.done;
  return results;
}

export async function deleteItem(storeName, key) {
  const database = await initDB();
  const tx = database.transaction(storeName, 'readwrite');
  await tx.store.delete(key);
  await tx.done;
}

// Батчевые операции
export async function putMany(storeName, values) {
  const database = await initDB();
  const tx = database.transaction(storeName, 'readwrite');
  
  for (const value of values) {
    await tx.store.put(value);
  }
  
  await tx.done;
}

export async function clear(storeName) {
  const database = await initDB();
  const tx = database.transaction(storeName, 'readwrite');
  await tx.store.clear();
  await tx.done;
}

// Транзакции для связанных операций
export async function transaction(operations) {
  const database = await initDB();
  const stores = [...new Set(operations.map(op => op.store))];
  const tx = database.transaction(stores, 'readwrite');
  
  try {
    const results = [];
    
    for (const op of operations) {
      let result;
      switch (op.type) {
        case 'put':
          result = await tx.store(op.store).put(op.value);
          break;
        case 'get':
          result = await tx.store(op.store).get(op.key);
          break;
        case 'delete':
          result = await tx.store(op.store).delete(op.key);
          break;
        case 'clear':
          result = await tx.store(op.store).clear();
          break;
        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }
      results.push(result);
    }
    
    await tx.done;
    return results;
  } catch (error) {
    // Транзакция автоматически откатится
    throw error;
  }
}

// Специализированные операции для планировщика
export async function saveDayWithTasks(day, tasks) {
  const operations = [
    { type: 'put', store: 'days', value: day },
    ...tasks.map(task => ({ type: 'put', store: 'tasks', value: task }))
  ];
  
  return await transaction(operations);
}

export async function getDayWithTasks(date) {
  const database = await initDB();
  const tx = database.transaction(['days', 'tasks'], 'readonly');
  
  const day = await tx.store('days').get(date);
  if (!day) return { day: null, tasks: [] };
  
  // Получаем все задачи для этого дня
  const tasks = [];
  for await (const cursor of tx.store('tasks')) {
    if (cursor.planned && cursor.planned.date === date) {
      tasks.push(cursor);
    }
  }
  
  await tx.done;
  return { day, tasks };
}

export async function exportData() {
  const database = await initDB();
  const tx = database.transaction([
    'tasks', 'days', 'templates', 'projects', 'baseTasks', 'settings'
  ], 'readonly');
  
  const data = {};
  
  for (const storeName of ['tasks', 'days', 'templates', 'projects', 'baseTasks', 'settings']) {
    data[storeName] = [];
    for await (const cursor of tx.store(storeName)) {
      data[storeName].push(cursor);
    }
  }
  
  await tx.done;
  return data;
}

export async function importData(data) {
  const operations = [];
  
  for (const [storeName, items] of Object.entries(data)) {
    // Сначала очищаем store
    operations.push({ type: 'clear', store: storeName });
    
    // Затем добавляем новые данные
    for (const item of items) {
      operations.push({ type: 'put', store: storeName, value: item });
    }
  }
  
  return await transaction(operations);
}

// Утилиты
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Инициализация при загрузке
if (typeof window !== 'undefined') {
  initDB().catch(console.error);
}