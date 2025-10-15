// scheduler.js - Реальная логика автопланировщика с кривыми дня и скорингом
import { buildCurves, integral, getTypeFitScore } from './curves.js';

export function autoSchedule(day, tasks, meals = [], weights = getDefaultWeights(), eps = 3) {
  const dayStartMin = getDayStart(day);
  const durationMin = getDayDuration(day);
  
  // Строим кривые дня
  const points = buildCurves({ 
    dayStartMin, 
    durationMin, 
    meals, 
    mods: weights.mods || {} 
  });
  
  // Подготавливаем окна с информацией о вместимости
  const windows = day.windows.map(w => ({
    ...w,
    cap: w.endMin - w.startMin,
    used: 0,
    placed: []
  }));
  
  // Сортируем задачи по важности
  const pool = tasks.slice().sort((a, b) => rankTask(b) - rankTask(a));
  
  // Раскладываем задачи
  for (const task of pool) {
    const duration = task.minutes || 0;
    if (duration <= 0) continue;
    
    // Скорим все доступные окна
    const scored = windows
      .map(w => ({
        w,
        s: scoreTaskWindow(task, w, points, weights),
        room: w.cap - w.used
      }))
      .filter(x => x.room >= duration - eps) // Проверяем вместимость с допуском
      .sort((a, b) => b.s - a.s); // Сортируем по убыванию скора
    
    const best = scored[0];
    if (!best) continue; // Задача остается в "Незапланированных"
    
    // Размещаем задачу в лучшее окно
    const startMin = nextFreeSlot(best.w);
    const endMin = startMin + duration;
    
    best.w.placed.push({
      windowId: best.w.id,
      taskId: task.id,
      startMin,
      endMin
    });
    
    best.w.used += duration;
    task.planned = {
      date: day.date,
      windowId: best.w.id,
      startMin,
      endMin
    };
  }
  
  // Обновляем размещенные задачи в дне
  day.placed = windows.flatMap(w => w.placed);
  
  return { day, tasks };
}

function scoreTaskWindow(task, window, points, weights) {
  const { wP, wT, wC, wL, wS, alpha = 0.4, beta = 0.3, gamma = 0.3 } = weights;
  
  // Приоритет (P1=1, P2=0.7, P3=0.5, P4=0.25)
  const priorityScore = getPriorityScore(task.priority || 'P2');
  
  // Соответствие типа задачи времени окна
  const windowHour = window.startMin / 60;
  const typeFit = getTypeFitScore(task.type || 'U', windowHour);
  
  // Интеграл кривых по окну
  const cortIntegral = integral(points, window.startMin, window.endMin, 'cort');
  const dopaIntegral = integral(points, window.startMin, window.endMin, 'dopa');
  const seroIntegral = integral(points, window.startMin, window.endMin, 'sero');
  
  const curvesScore = alpha * cortIntegral + beta * dopaIntegral + gamma * seroIntegral;
  
  // Штраф за плотность (переполнение)
  const density = (window.used + (task.minutes || 0)) / Math.max(1, window.cap);
  const densityPenalty = Math.max(0, density - 0.85) * 2; // Усиленный штраф за переполнение
  
  // Штраф за стресс при низком серотонине
  const stressPenalty = (task.coeff?.P || 0) * (1 - seroIntegral) * 0.5;
  
  // Итоговый скор
  return wP * priorityScore + 
         wT * typeFit + 
         wC * curvesScore - 
         wL * densityPenalty - 
         wS * stressPenalty;
}

function rankTask(task) {
  // Ранжирование: приоритет -> время -> интенсивность
  const priorityRank = getPriorityScore(task.priority || 'P2');
  const timeRank = (task.minutes || 0) / 60; // В часах
  const intensityRank = (task.coeff?.I || 5) / 10; // Нормализуем к 0-1
  
  return priorityRank * 100 + timeRank * 10 + intensityRank;
}

function getPriorityScore(priority) {
  const scores = { 'P1': 1, 'P2': 0.7, 'P3': 0.5, 'P4': 0.25 };
  return scores[priority] || 0.5;
}

function nextFreeSlot(window) {
  // Находим первое свободное место в окне
  const placed = window.placed.sort((a, b) => a.startMin - b.startMin);
  
  let current = window.startMin;
  for (const p of placed) {
    if (current + (window.used || 0) <= p.startMin) {
      return current;
    }
    current = p.endMin;
  }
  
  return current;
}

function getDayStart(day) {
  if (day.windows.length === 0) return 8 * 60; // 8:00 по умолчанию
  return Math.min(...day.windows.map(w => w.startMin));
}

function getDayDuration(day) {
  if (day.windows.length === 0) return 16 * 60; // 16 часов по умолчанию
  const start = getDayStart(day);
  const end = Math.max(...day.windows.map(w => w.endMin));
  return end - start;
}

export function getDefaultWeights() {
  return {
    wP: 0.45,    // Вес приоритета
    wT: 0.25,    // Вес соответствия типа
    wC: 0.25,    // Вес кривых
    wL: 0.03,    // Вес плотности
    wS: 0.02,    // Вес стресса
    alpha: 0.4,  // Вес кортизола
    beta: 0.3,   // Вес дофамина
    gamma: 0.3,  // Вес серотонина
    mods: {
      foodAffectsCurves: true,
      exerciseAffectsCurves: false
    }
  };
}

// Валидация пересечений в шаблонах
export function validateTemplate(template) {
  const errors = [];
  
  // 1) Проверяем, что end > start для всех элементов
  for (const item of [...template.windows, ...template.fixed]) {
    if (item.endMin <= item.startMin) {
      errors.push(`${item.title}: время окончания должно быть больше времени начала`);
    }
  }
  
  // 2) Проверяем пересечения fixed блоков между собой
  for (let i = 0; i < template.fixed.length; i++) {
    for (let j = i + 1; j < template.fixed.length; j++) {
      if (overlaps(template.fixed[i], template.fixed[j])) {
        errors.push(`Пересечение фиксированных блоков: ${template.fixed[i].title} × ${template.fixed[j].title}`);
      }
    }
  }
  
  // 3) Проверяем пересечения fixed блоков с окнами
  for (const fixed of template.fixed) {
    for (const window of template.windows) {
      if (overlaps(fixed, window)) {
        errors.push(`${fixed.title} пересекает окно ${window.title}`);
      }
    }
  }
  
  return {
    ok: errors.length === 0,
    errors
  };
}

function overlaps(a, b) {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

// Обогащение задач из базы дел
export function enrichTaskFromBase(task, baseTasks, settings) {
  if (!task.title) return task;
  
  const normalizedTitle = normalizeTitle(task.title);
  const matches = findMatches(normalizedTitle, baseTasks);
  
  if (matches.length === 0) return task;
  
  const enriched = { ...task };
  
  // Агрегируем данные из совпадений
  const aggregated = aggregateMatches(matches);
  
  // Применяем обогащение согласно настройкам
  if (settings.autoMinutes && task.minutes == null) {
    enriched.minutes = aggregated.defaultMinutes;
  }
  
  if (settings.autoPriority && task.priority == null) {
    enriched.priority = aggregated.defaultPriority;
  }
  
  if (settings.autoProject && task.projectId == null) {
    enriched.projectId = aggregated.defaultProjectId;
  }
  
  if (task.type == null) {
    enriched.type = aggregated.defaultType;
  }
  
  return enriched;
}

function normalizeTitle(title) {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '') // Убираем пунктуацию
    .replace(/\s+/g, ' ')    // Нормализуем пробелы
    .trim();
}

function findMatches(normalizedTitle, baseTasks) {
  const matches = [];
  
  for (const baseTask of baseTasks) {
    let score = 0;
    const tokens = normalizedTitle.split(' ');
    
    for (const token of tokens) {
      for (const sample of baseTask.sampleTitles || []) {
        if (sample.toLowerCase().includes(token)) {
          score += 1;
        }
      }
    }
    
    if (score > 0) {
      matches.push({ baseTask, score });
    }
  }
  
  return matches.sort((a, b) => b.score - a.score);
}

function aggregateMatches(matches) {
  if (matches.length === 0) return {};
  
  // Берем медиану + 0.25 пути к максимуму
  const minutes = matches.map(m => m.baseTask.defaultMinutes || 30);
  const priorities = matches.map(m => m.baseTask.defaultPriority || 'P2');
  const types = matches.map(m => m.baseTask.defaultType || 'U');
  const projects = matches.map(m => m.baseTask.defaultProjectId);
  
  return {
    defaultMinutes: medianPlusQuarter(max, minutes),
    defaultPriority: getMostCommon(priorities),
    defaultType: getMostCommon(types),
    defaultProjectId: getMostCommon(projects.filter(p => p))
  };
}

function medianPlusQuarter(max, values) {
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const maxVal = Math.max(...values);
  const quarter = (maxVal - median) * 0.25;
  return Math.min(median + quarter, maxVal);
}

function getMostCommon(values) {
  const counts = {};
  for (const value of values) {
    counts[value] = (counts[value] || 0) + 1;
  }
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}