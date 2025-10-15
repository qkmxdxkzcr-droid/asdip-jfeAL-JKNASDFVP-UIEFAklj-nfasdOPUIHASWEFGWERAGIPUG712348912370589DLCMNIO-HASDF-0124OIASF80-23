// curves.js - Единый источник "кривых дня"
// Используется для графика Chart.js и скоринга в автоплане

export function buildCurves({ dayStartMin = 8*60, durationMin = 16*60, meals = [], mods = {} }) {
  const step = 5;
  const points = [];
  
  for (let t = 0; t <= durationMin; t += step) {
    const cort = cortBaseline(t) + mealCort(meals, t, mods);
    const dopa = dopaBaseline(t) + exercisePulse(t, mods) - fatiguePenalty(t, mods);
    const sero = seroBaseline(t) + carbResponse(meals, t, mods) - proteinBlock(meals, t, mods);
    const sleep = sleepPressure(t) + postPrandialDip(meals, t, mods);
    
    points.push({
      t,
      cort: clamp01(cort),
      dopa: clamp01(dopa),
      sero: clamp01(sero),
      sleep: clamp01(sleep)
    });
  }
  
  return points;
}

export function integral(points, startMin, endMin, key) {
  // Простая трапеция по 5-мин шагу
  let sum = 0;
  let prev = null;
  
  for (const p of points) {
    if (p.t < startMin || p.t > endMin) continue;
    if (prev) {
      sum += (p[key] + prev[key]) * (p.t - prev.t) / 2;
    }
    prev = p;
  }
  
  return sum / Math.max(1, endMin - startMin);
}

// Базовые кривые (биологически обоснованные)
function cortBaseline(t) {
  // Кортизол: пик утром, спад к вечеру
  const hour = t / 60;
  if (hour < 6) return 0.3; // Ночной минимум
  if (hour < 9) return 0.9; // Утренний пик
  if (hour < 12) return 0.7; // Спад
  if (hour < 15) return 0.5; // Послеобеденный минимум
  if (hour < 18) return 0.4; // Вечерний спад
  return 0.2; // Ночной минимум
}

function dopaBaseline(t) {
  // Дофамин: умеренный уровень, пик после активности
  const hour = t / 60;
  if (hour < 6) return 0.2;
  if (hour < 9) return 0.6; // Утренний подъем
  if (hour < 12) return 0.7; // Пик активности
  if (hour < 15) return 0.5; // Послеобеденный спад
  if (hour < 18) return 0.6; // Вечерний подъем
  return 0.3; // Ночной спад
}

function seroBaseline(t) {
  // Серотонин: стабильный уровень, легкий спад к вечеру
  const hour = t / 60;
  if (hour < 6) return 0.3;
  if (hour < 9) return 0.7;
  if (hour < 12) return 0.8; // Пик
  if (hour < 15) return 0.6; // Послеобеденный спад
  if (hour < 18) return 0.5;
  return 0.4; // Вечерний спад
}

function sleepPressure(t) {
  // Давление сна: растет в течение дня
  const hour = t / 60;
  if (hour < 6) return 0.9; // Ночной максимум
  if (hour < 9) return 0.1; // Утренний минимум
  if (hour < 12) return 0.2;
  if (hour < 15) return 0.3;
  if (hour < 18) return 0.5;
  return 0.7; // Вечерний рост
}

// Влияние еды на кривые
function mealCort(meals, t, mods) {
  if (!mods.foodAffectsCurves) return 0;
  
  let effect = 0;
  for (const meal of meals) {
    const timeSinceMeal = t - meal.time;
    if (timeSinceMeal >= 0 && timeSinceMeal <= 120) { // 2 часа после еды
      const intensity = Math.exp(-timeSinceMeal / 60) * 0.3; // Экспоненциальный спад
      effect += intensity;
    }
  }
  return Math.min(effect, 0.5);
}

function carbResponse(meals, t, mods) {
  if (!mods.foodAffectsCurves) return 0;
  
  let effect = 0;
  for (const meal of meals) {
    const timeSinceMeal = t - meal.time;
    if (timeSinceMeal >= 0 && timeSinceMeal <= 90) {
      const intensity = Math.exp(-timeSinceMeal / 45) * 0.2;
      effect += intensity;
    }
  }
  return Math.min(effect, 0.3);
}

function proteinBlock(meals, t, mods) {
  if (!mods.foodAffectsCurves) return 0;
  
  let effect = 0;
  for (const meal of meals) {
    const timeSinceMeal = t - meal.time;
    if (timeSinceMeal >= 0 && timeSinceMeal <= 180) {
      const intensity = Math.exp(-timeSinceMeal / 90) * 0.15;
      effect += intensity;
    }
  }
  return Math.min(effect, 0.2);
}

function postPrandialDip(meals, t, mods) {
  if (!mods.foodAffectsCurves) return 0;
  
  let effect = 0;
  for (const meal of meals) {
    const timeSinceMeal = t - meal.time;
    if (timeSinceMeal >= 15 && timeSinceMeal <= 60) { // 15-60 мин после еды
      const intensity = Math.exp(-(timeSinceMeal - 15) / 30) * 0.4;
      effect += intensity;
    }
  }
  return Math.min(effect, 0.6);
}

// Влияние упражнений
function exercisePulse(t, mods) {
  if (!mods.exerciseAffectsCurves) return 0;
  
  // Имитируем эффект упражнений в определенное время
  const hour = t / 60;
  if (hour >= 7 && hour <= 8) return 0.3; // Утренняя зарядка
  if (hour >= 18 && hour <= 19) return 0.2; // Вечерняя тренировка
  return 0;
}

function fatiguePenalty(t, mods) {
  if (!mods.exerciseAffectsCurves) return 0;
  
  // Усталость накапливается в течение дня
  const hour = t / 60;
  if (hour < 6) return 0.1;
  if (hour < 12) return 0.05;
  if (hour < 18) return 0.1;
  return 0.2; // Вечерняя усталость
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

// Матрица соответствия типов задач и времени дня
export function getTypeFitScore(taskType, hour) {
  const matrix = {
    'U': { // Умственные задачи
      6: 0.3, 7: 0.6, 8: 0.8, 9: 0.9, 10: 0.9, 11: 0.8,
      12: 0.6, 13: 0.4, 14: 0.7, 15: 0.8, 16: 0.7, 17: 0.5,
      18: 0.3, 19: 0.2, 20: 0.1, 21: 0.1, 22: 0.1
    },
    'M': { // Монотонные задачи
      6: 0.2, 7: 0.4, 8: 0.6, 9: 0.7, 10: 0.8, 11: 0.7,
      12: 0.5, 13: 0.3, 14: 0.6, 15: 0.7, 16: 0.8, 17: 0.6,
      18: 0.4, 19: 0.3, 20: 0.2, 21: 0.1, 22: 0.1
    },
    'F': { // Физические задачи
      6: 0.3, 7: 0.7, 8: 0.8, 9: 0.6, 10: 0.5, 11: 0.4,
      12: 0.3, 13: 0.2, 14: 0.4, 15: 0.6, 16: 0.7, 17: 0.8,
      18: 0.6, 19: 0.4, 20: 0.2, 21: 0.1, 22: 0.1
    },
    'S': { // Смешанные задачи
      6: 0.4, 7: 0.6, 8: 0.7, 9: 0.8, 10: 0.7, 11: 0.6,
      12: 0.5, 13: 0.4, 14: 0.6, 15: 0.7, 16: 0.6, 17: 0.5,
      18: 0.4, 19: 0.3, 20: 0.2, 21: 0.1, 22: 0.1
    },
    'RA': { // Активный отдых
      6: 0.2, 7: 0.4, 8: 0.3, 9: 0.2, 10: 0.1, 11: 0.1,
      12: 0.2, 13: 0.3, 14: 0.4, 15: 0.5, 16: 0.6, 17: 0.7,
      18: 0.8, 19: 0.6, 20: 0.4, 21: 0.2, 22: 0.1
    },
    'RP': { // Пассивный отдых
      6: 0.1, 7: 0.2, 8: 0.1, 9: 0.1, 10: 0.1, 11: 0.1,
      12: 0.3, 13: 0.5, 14: 0.3, 15: 0.2, 16: 0.1, 17: 0.1,
      18: 0.2, 19: 0.4, 20: 0.6, 21: 0.7, 22: 0.8
    }
  };
  
  const hourMap = matrix[taskType] || matrix['U'];
  const roundedHour = Math.round(hour);
  return hourMap[roundedHour] || 0.5;
}