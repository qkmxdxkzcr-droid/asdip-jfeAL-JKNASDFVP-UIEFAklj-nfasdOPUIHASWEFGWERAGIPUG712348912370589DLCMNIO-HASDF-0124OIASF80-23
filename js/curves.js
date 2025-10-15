// Day curves calculation - single source of truth
// Used both for Chart.js rendering and auto-scheduling scoring

// Curve parameters
const CURVE_PARAMS = {
  cort: {
    morning: { peak: 8.5, intensity: 0.8, width: 2.5 },
    afternoon: { peak: 14, intensity: 0.3, width: 1.5 },
    evening: { peak: 18, intensity: 0.1, width: 1 }
  },
  dopa: {
    morning: { peak: 9, intensity: 0.7, width: 3 },
    afternoon: { peak: 15, intensity: 0.4, width: 2 },
    evening: { peak: 19, intensity: 0.2, width: 1.5 }
  },
  sero: {
    morning: { peak: 10, intensity: 0.6, width: 2.5 },
    afternoon: { peak: 16, intensity: 0.8, width: 3 },
    evening: { peak: 20, intensity: 0.3, width: 2 }
  },
  sleep: {
    morning: { peak: 7, intensity: 0.9, width: 2 },
    afternoon: { peak: 13, intensity: 0.4, width: 1.5 },
    evening: { peak: 22, intensity: 0.8, width: 3 }
  }
};

// Meal effects on curves
const MEAL_EFFECTS = {
  breakfast: { time: 8, duration: 1, cort: 0.2, dopa: 0.1, sero: 0.3, sleep: -0.1 },
  lunch: { time: 13, duration: 1.5, cort: 0.1, dopa: 0.2, sero: 0.4, sleep: -0.3 },
  dinner: { time: 19, duration: 1, cort: 0.05, dopa: 0.1, sero: 0.2, sleep: 0.1 }
};

/**
 * Build curves for a day
 * @param {Object} params - Day parameters
 * @param {number} params.dayStartMin - Day start in minutes (e.g., 8*60 = 8:00 AM)
 * @param {number} params.durationMin - Day duration in minutes
 * @param {Array} params.meals - Array of meal times in minutes
 * @param {Object} params.mods - Modifiers for curves
 * @returns {Array} Array of curve points every 5 minutes
 */
export function buildCurves({ dayStartMin = 8 * 60, durationMin = 16 * 60, meals = [], mods = {} }) {
  const points = [];
  const interval = 5; // 5-minute intervals
  const endMin = dayStartMin + durationMin;
  
  for (let t = dayStartMin; t < endMin; t += interval) {
    const hour = t / 60;
    
    const point = {
      t: hour,
      cort: calculateCurve('cort', hour, meals, mods),
      dopa: calculateCurve('dopa', hour, meals, mods),
      sero: calculateCurve('sero', hour, meals, mods),
      sleep: calculateCurve('sleep', hour, meals, mods)
    };
    
    points.push(point);
  }
  
  return points;
}

/**
 * Calculate a single curve value at given time
 * @param {string} curveType - Type of curve (cort, dopa, sero, sleep)
 * @param {number} hour - Time in hours
 * @param {Array} meals - Meal times
 * @param {Object} mods - Modifiers
 * @returns {number} Curve value (0-1)
 */
function calculateCurve(curveType, hour, meals, mods) {
  const params = CURVE_PARAMS[curveType];
  let value = 0;
  
  // Base circadian rhythm (multiple gaussian peaks)
  Object.values(params).forEach(peak => {
    const gaussian = Math.exp(-Math.pow((hour - peak.peak) / peak.width, 2) / 2);
    value += peak.intensity * gaussian;
  });
  
  // Apply meal effects
  meals.forEach(mealTime => {
    const mealHour = mealTime / 60;
    const timeDiff = Math.abs(hour - mealHour);
    const mealEffect = MEAL_EFFECTS[getMealType(mealHour)];
    
    if (mealEffect && timeDiff < mealEffect.duration) {
      const intensity = Math.exp(-timeDiff / (mealEffect.duration / 2));
      value += mealEffect[curveType] * intensity;
    }
  });
  
  // Apply modifiers
  if (mods[curveType]) {
    value *= mods[curveType];
  }
  
  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, value));
}

/**
 * Get meal type based on time
 * @param {number} hour - Time in hours
 * @returns {string} Meal type
 */
function getMealType(hour) {
  if (hour >= 7 && hour <= 9) return 'breakfast';
  if (hour >= 12 && hour <= 14) return 'lunch';
  if (hour >= 18 && hour <= 20) return 'dinner';
  return null;
}

/**
 * Calculate integral of curve over time interval
 * @param {Array} curve - Curve points
 * @param {number} startMin - Start time in minutes
 * @param {number} endMin - End time in minutes
 * @param {string} key - Curve key (cort, dopa, sero, sleep)
 * @returns {number} Integral value
 */
export function integral(curve, startMin, endMin, key) {
  const startHour = startMin / 60;
  const endHour = endMin / 60;
  
  let sum = 0;
  let count = 0;
  
  curve.forEach(point => {
    if (point.t >= startHour && point.t <= endHour) {
      sum += point[key] || 0;
      count++;
    }
  });
  
  return count > 0 ? sum / count : 0;
}

/**
 * Calculate weighted integral for scoring
 * @param {Array} curve - Curve points
 * @param {number} startMin - Start time in minutes
 * @param {number} endMin - End time in minutes
 * @param {Object} weights - Weights for each curve
 * @returns {number} Weighted score
 */
export function weightedIntegral(curve, startMin, endMin, weights = {}) {
  const cort = integral(curve, startMin, endMin, 'cort');
  const dopa = integral(curve, startMin, endMin, 'dopa');
  const sero = integral(curve, startMin, endMin, 'sero');
  const sleep = integral(curve, startMin, endMin, 'sleep');
  
  return (weights.cort || 0.25) * cort +
         (weights.dopa || 0.25) * dopa +
         (weights.sero || 0.25) * sero +
         (weights.sleep || 0.25) * sleep;
}

/**
 * Get optimal time windows for task type
 * @param {Array} curve - Curve points
 * @param {string} taskType - Task type (U, M, F, S, RA, RP)
 * @param {number} durationMin - Task duration in minutes
 * @returns {Array} Array of optimal windows with scores
 */
export function getOptimalWindows(curve, taskType, durationMin = 60) {
  const windows = [];
  const step = 30; // 30-minute steps
  
  for (let start = 0; start < curve.length - durationMin / 5; start += step / 5) {
    const end = start + durationMin / 5;
    const startMin = start * 5;
    const endMin = end * 5;
    
    const score = getTaskTypeScore(curve, startMin, endMin, taskType);
    
    windows.push({
      startMin,
      endMin,
      score,
      startHour: startMin / 60,
      endHour: endMin / 60
    });
  }
  
  return windows.sort((a, b) => b.score - a.score);
}

/**
 * Calculate task type score based on curves
 * @param {Array} curve - Curve points
 * @param {number} startMin - Start time in minutes
 * @param {number} endMin - End time in minutes
 * @param {string} taskType - Task type
 * @returns {number} Score (0-1)
 */
function getTaskTypeScore(curve, startMin, endMin, taskType) {
  const cort = integral(curve, startMin, endMin, 'cort');
  const dopa = integral(curve, startMin, endMin, 'dopa');
  const sero = integral(curve, startMin, endMin, 'sero');
  const sleep = integral(curve, startMin, endMin, 'sleep');
  
  // Task type preferences
  const preferences = {
    U: { cort: 0.8, dopa: 0.9, sero: 0.6, sleep: 0.2 }, // Умственная - утром
    M: { cort: 0.4, dopa: 0.5, sero: 0.7, sleep: 0.6 }, // Монотонная - днем
    F: { cort: 0.6, dopa: 0.8, sero: 0.8, sleep: 0.3 }, // Физическая - утром/днем
    S: { cort: 0.6, dopa: 0.7, sero: 0.7, sleep: 0.4 }, // Смешанная - утром/днем
    RA: { cort: 0.3, dopa: 0.6, sero: 0.8, sleep: 0.7 }, // Активный отдых - днем/вечером
    RP: { cort: 0.2, dopa: 0.3, sero: 0.6, sleep: 0.8 }  // Пассивный отдых - вечером
  };
  
  const pref = preferences[taskType] || preferences.S;
  
  // Calculate weighted score
  const score = (pref.cort * cort + pref.dopa * dopa + pref.sero * sero + pref.sleep * sleep) / 4;
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Get curve statistics for a time window
 * @param {Array} curve - Curve points
 * @param {number} startMin - Start time in minutes
 * @param {number} endMin - End time in minutes
 * @returns {Object} Statistics
 */
export function getCurveStats(curve, startMin, endMin) {
  const startHour = startMin / 60;
  const endHour = endMin / 60;
  
  const windowPoints = curve.filter(point => 
    point.t >= startHour && point.t <= endHour
  );
  
  if (windowPoints.length === 0) {
    return { cort: 0, dopa: 0, sero: 0, sleep: 0, avg: 0 };
  }
  
  const stats = {
    cort: windowPoints.reduce((sum, p) => sum + p.cort, 0) / windowPoints.length,
    dopa: windowPoints.reduce((sum, p) => sum + p.dopa, 0) / windowPoints.length,
    sero: windowPoints.reduce((sum, p) => sum + p.sero, 0) / windowPoints.length,
    sleep: windowPoints.reduce((sum, p) => sum + p.sleep, 0) / windowPoints.length
  };
  
  stats.avg = (stats.cort + stats.dopa + stats.sero + stats.sleep) / 4;
  
  return stats;
}

/**
 * Generate curve data for Chart.js
 * @param {Array} curve - Curve points
 * @returns {Object} Chart.js data format
 */
export function getChartData(curve) {
  return {
    labels: curve.map(p => `${Math.floor(p.t)}:${String(Math.round((p.t % 1) * 60)).padStart(2, '0')}`),
    datasets: [
      {
        label: 'Cortisol',
        data: curve.map(p => p.cort),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        pointRadius: 0,
        tension: 0.35
      },
      {
        label: 'Dopamine',
        data: curve.map(p => p.dopa),
        borderColor: '#7C4DFF',
        backgroundColor: 'rgba(124, 77, 255, 0.1)',
        pointRadius: 0,
        tension: 0.35
      },
      {
        label: 'Serotonin',
        data: curve.map(p => p.sero),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        pointRadius: 0,
        tension: 0.35
      },
      {
        label: 'Sleep Drive',
        data: curve.map(p => p.sleep),
        borderColor: '#0EA5E9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        pointRadius: 0,
        tension: 0.35
      }
    ]
  };
}

/**
 * Get Chart.js options
 * @returns {Object} Chart.js options
 */
export function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        display: true,
        min: 0,
        max: 1,
        title: {
          display: true,
          text: 'Level'
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${(context.parsed.y * 100).toFixed(1)}%`;
          }
        }
      }
    }
  };
}

// Export default function for easy use
export default buildCurves;
