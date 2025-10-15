// Auto-scheduler - algorithm for placing tasks in day windows
import { buildCurves, integral, weightedIntegral, getTaskTypeScore } from './curves.js';
import { baseTasks, settings } from './store.js';

/**
 * Enrich task from base tasks database
 * @param {Object} task - Task to enrich
 * @param {Array} baseList - List of base tasks
 * @param {Object} settings - User settings
 * @returns {Object} Enriched task
 */
export function enrichTaskFromBase(task, baseList, settings) {
  const normalizedTitle = normalizeTitle(task.title);
  const hits = matchBase(normalizedTitle, baseList);
  
  if (hits.length === 0) return task;
  
  const aggregated = aggregateHits(hits);
  
  return {
    ...task,
    minutes: settings.autoMinutes && task.minutes == null ? aggregated.defaultMinutes : task.minutes,
    priority: settings.autoPriority && task.priority == null ? aggregated.defaultPriority : task.priority,
    projectId: settings.autoProject && task.projectId == null ? aggregated.defaultProjectId : task.projectId,
    type: task.type ?? aggregated.defaultType,
    coeff: task.coeff ?? aggregated.coeff
  };
}

/**
 * Normalize title for matching
 * @param {string} title - Original title
 * @returns {string} Normalized title
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match title against base tasks
 * @param {string} normalizedTitle - Normalized title
 * @param {Array} baseList - List of base tasks
 * @returns {Array} Array of matches with scores
 */
function matchBase(normalizedTitle, baseList) {
  const matches = [];
  
  baseList.forEach(baseTask => {
    let score = 0;
    let matches = 0;
    
    baseTask.sampleTitles.forEach(sample => {
      const normalizedSample = normalizeTitle(sample);
      if (normalizedTitle.includes(normalizedSample)) {
        score += normalizedSample.length / normalizedTitle.length;
        matches++;
      }
    });
    
    if (matches > 0) {
      matches.push({
        base: baseTask,
        score: score / matches // Average score
      });
    }
  });
  
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Aggregate multiple matches using median + 0.25 to max
 * @param {Array} hits - Array of matches
 * @returns {Object} Aggregated values
 */
function aggregateHits(hits) {
  if (hits.length === 1) {
    return {
      defaultMinutes: hits[0].base.defaultMinutes,
      defaultPriority: hits[0].base.defaultPriority,
      defaultType: hits[0].base.defaultType,
      defaultProjectId: hits[0].base.defaultProjectId,
      coeff: hits[0].base.weights || {}
    };
  }
  
  // Sort by score and take top matches
  const topHits = hits.slice(0, Math.min(5, hits.length));
  
  // Extract values
  const minutes = topHits.map(h => h.base.defaultMinutes).sort((a, b) => a - b);
  const priorities = topHits.map(h => h.base.defaultPriority);
  const types = topHits.map(h => h.base.defaultType);
  const projects = topHits.map(h => h.base.defaultProjectId).filter(Boolean);
  const weights = topHits.map(h => h.base.weights || {});
  
  // Calculate median + 0.25 to max for numeric values
  const medianMinutes = getMedian(minutes);
  const maxMinutes = Math.max(...minutes);
  const finalMinutes = Math.min(medianMinutes + (maxMinutes - medianMinutes) * 0.25, maxMinutes);
  
  // Most common for categorical values
  const finalPriority = getMostCommon(priorities);
  const finalType = getMostCommon(types);
  const finalProject = getMostCommon(projects);
  
  // Average weights
  const finalWeights = aggregateWeights(weights);
  
  return {
    defaultMinutes: Math.round(finalMinutes),
    defaultPriority: finalPriority,
    defaultType: finalType,
    defaultProjectId: finalProject,
    coeff: finalWeights
  };
}

/**
 * Get median value from sorted array
 * @param {Array} arr - Sorted array
 * @returns {number} Median value
 */
function getMedian(arr) {
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

/**
 * Get most common value in array
 * @param {Array} arr - Array of values
 * @returns {*} Most common value
 */
function getMostCommon(arr) {
  const counts = {};
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

/**
 * Aggregate weights from multiple base tasks
 * @param {Array} weights - Array of weight objects
 * @returns {Object} Aggregated weights
 */
function aggregateWeights(weights) {
  const result = {};
  const keys = ['focus', 'physical', 'monotony', 'restore'];
  
  keys.forEach(key => {
    const values = weights.map(w => w[key]).filter(v => v != null);
    if (values.length > 0) {
      result[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
    }
  });
  
  return result;
}

/**
 * Calculate task priority score
 * @param {string} priority - Task priority (P1-P4)
 * @returns {number} Priority score (1-0.25)
 */
function getPriorityScore(priority) {
  const scores = { P1: 1, P2: 0.75, P3: 0.5, P4: 0.25 };
  return scores[priority] || 0.5;
}

/**
 * Calculate task type fit score
 * @param {string} taskType - Task type
 * @param {Object} window - Window object
 * @param {number} startMin - Start time in minutes
 * @returns {number} Type fit score (0-1)
 */
function getTypeFitScore(taskType, window, startMin) {
  const hour = startMin / 60;
  
  // Type preferences by time of day
  const preferences = {
    U: { morning: 0.9, afternoon: 0.7, evening: 0.3 }, // Умственная - утром
    M: { morning: 0.6, afternoon: 0.9, evening: 0.7 }, // Монотонная - днем
    F: { morning: 0.8, afternoon: 0.8, evening: 0.4 }, // Физическая - утром/днем
    S: { morning: 0.8, afternoon: 0.8, evening: 0.5 }, // Смешанная - утром/днем
    RA: { morning: 0.4, afternoon: 0.8, evening: 0.9 }, // Активный отдых - днем/вечером
    RP: { morning: 0.2, afternoon: 0.6, evening: 0.9 }  // Пассивный отдых - вечером
  };
  
  const pref = preferences[taskType] || preferences.S;
  
  if (hour < 12) return pref.morning;
  if (hour < 18) return pref.afternoon;
  return pref.evening;
}

/**
 * Calculate capacity penalty
 * @param {number} used - Used minutes
 * @param {number} total - Total minutes
 * @returns {number} Penalty score (0-1)
 */
function getCapacityPenalty(used, total) {
  const ratio = used / total;
  if (ratio <= 0.7) return 0;
  if (ratio <= 0.9) return (ratio - 0.7) / 0.2;
  return 1;
}

/**
 * Calculate stress penalty
 * @param {Object} task - Task object
 * @param {number} sero - Serotonin level
 * @returns {number} Stress penalty (0-1)
 */
function getStressPenalty(task, sero) {
  if (!task.coeff?.P) return 0;
  const stressLevel = task.coeff.P / 10; // Normalize to 0-1
  const seroLevel = sero;
  
  // Higher stress penalty when serotonin is low
  return stressLevel * (1 - seroLevel);
}

/**
 * Calculate task score for a window
 * @param {Object} task - Task object
 * @param {Object} window - Window object
 * @param {Array} curves - Day curves
 * @param {Object} weights - Scoring weights
 * @param {number} startMin - Start time in minutes
 * @returns {number} Task score
 */
function calculateTaskScore(task, window, curves, weights, startMin) {
  const endMin = startMin + (task.minutes || 0);
  
  // Priority score
  const priorityScore = getPriorityScore(task.priority) * weights.wP;
  
  // Type fit score
  const typeScore = getTypeFitScore(task.type, window, startMin) * weights.wT;
  
  // Curves score
  const curvesScore = weightedIntegral(curves, startMin, endMin, {
    cort: 0.25,
    dopa: 0.25,
    sero: 0.25,
    sleep: 0.25
  }) * weights.wC;
  
  // Capacity penalty
  const capacityPenalty = getCapacityPenalty(window.used, window.cap) * weights.wL;
  
  // Stress penalty
  const sero = integral(curves, startMin, endMin, 'sero');
  const stressPenalty = getStressPenalty(task, sero) * weights.wS;
  
  return priorityScore + typeScore + curvesScore - capacityPenalty - stressPenalty;
}

/**
 * Find next free slot in window
 * @param {Object} window - Window object
 * @param {number} duration - Duration in minutes
 * @returns {number} Start time in minutes
 */
function findNextFreeSlot(window, duration) {
  const placed = window.placed || [];
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
  
  return null; // No free slot found
}

/**
 * Rank task importance
 * @param {Object} task - Task object
 * @returns {number} Rank score
 */
function rankTask(task) {
  const priorityScore = getPriorityScore(task.priority);
  const minutesScore = (task.minutes || 0) / 120; // Normalize to 0-1
  const intensityScore = (task.coeff?.I || 5) / 10; // Normalize to 0-1
  
  return priorityScore * 0.5 + minutesScore * 0.3 + intensityScore * 0.2;
}

/**
 * Auto-schedule tasks for a day
 * @param {Object} day - Day object
 * @param {Array} tasks - Array of tasks to schedule
 * @param {Object} settings - User settings
 * @returns {Object} Result with updated day and tasks
 */
export async function autoSchedule(day, tasks, settings) {
  // Get base tasks and settings
  const baseList = await baseTasks.getAll();
  const allSettings = await settings.getAll();
  const settingsMap = {};
  allSettings.forEach(s => settingsMap[s.key] = s.value);
  
  // Build curves for the day
  const curves = buildCurves({
    dayStartMin: 8 * 60, // 8:00 AM
    durationMin: 16 * 60, // 16 hours
    meals: day.fixed?.filter(f => f.kind === 'meal').map(f => f.startMin) || []
  });
  
  // Prepare windows
  const windows = day.windows.map(w => ({
    ...w,
    cap: w.endMin - w.startMin,
    used: 0,
    placed: []
  }));
  
  // Enrich tasks from base
  const enrichedTasks = tasks.map(task => 
    enrichTaskFromBase(task, baseList, settingsMap)
  );
  
  // Sort by importance
  enrichedTasks.sort((a, b) => rankTask(b) - rankTask(a));
  
  // Schedule tasks
  const scheduledTasks = [];
  const unscheduledTasks = [];
  
  for (const task of enrichedTasks) {
    if (!task.minutes || task.minutes <= 0) {
      unscheduledTasks.push(task);
      continue;
    }
    
    let bestWindow = null;
    let bestScore = -Infinity;
    let bestStart = null;
    
    // Find best window for this task
    for (const window of windows) {
      const remaining = window.cap - window.used;
      const required = task.minutes - 3; // Allow 3-minute tolerance
      
      if (remaining < required) continue;
      
      const startMin = findNextFreeSlot(window, task.minutes);
      if (!startMin) continue;
      
      const score = calculateTaskScore(task, window, curves, settingsMap.weights, startMin);
      
      if (score > bestScore) {
        bestScore = score;
        bestWindow = window;
        bestStart = startMin;
      }
    }
    
    if (bestWindow && bestStart !== null) {
      const endMin = bestStart + task.minutes;
      
      // Place task
      bestWindow.placed.push({
        windowId: bestWindow.id,
        taskId: task.id,
        startMin: bestStart,
        endMin: endMin
      });
      
      bestWindow.used += task.minutes;
      
      // Update task
      task.planned = {
        date: day.date,
        windowId: bestWindow.id,
        startMin: bestStart,
        endMin: endMin
      };
      
      scheduledTasks.push(task);
    } else {
      unscheduledTasks.push(task);
    }
  }
  
  // Update day with placed tasks
  day.placed = windows.flatMap(w => w.placed);
  
  return {
    day,
    tasks: [...scheduledTasks, ...unscheduledTasks],
    scheduled: scheduledTasks.length,
    unscheduled: unscheduledTasks.length,
    windows: windows.map(w => ({
      id: w.id,
      title: w.title,
      used: w.used,
      cap: w.cap,
      utilization: w.cap > 0 ? (w.used / w.cap) * 100 : 0
    }))
  };
}

/**
 * Validate task placement
 * @param {Object} task - Task object
 * @param {Object} window - Window object
 * @param {number} startMin - Start time
 * @returns {Object} Validation result
 */
export function validatePlacement(task, window, startMin) {
  const endMin = startMin + (task.minutes || 0);
  const tolerance = 3; // 3-minute tolerance
  
  // Check if task fits in window
  if (endMin > window.endMin) {
    return {
      valid: false,
      reason: 'Task exceeds window end time'
    };
  }
  
  // Check capacity
  const used = window.placed?.reduce((sum, p) => sum + (p.endMin - p.startMin), 0) || 0;
  const remaining = (window.endMin - window.startMin) - used;
  const required = task.minutes - tolerance;
  
  if (remaining < required) {
    return {
      valid: false,
      reason: `Insufficient capacity: ${remaining}min available, ${required}min required`
    };
  }
  
  // Check for overlaps
  const overlaps = window.placed?.some(placement => 
    (startMin < placement.endMin && endMin > placement.startMin)
  ) || false;
  
  if (overlaps) {
    return {
      valid: false,
      reason: 'Task overlaps with existing placement'
    };
  }
  
  return { valid: true };
}

// Export default function
export default autoSchedule;
