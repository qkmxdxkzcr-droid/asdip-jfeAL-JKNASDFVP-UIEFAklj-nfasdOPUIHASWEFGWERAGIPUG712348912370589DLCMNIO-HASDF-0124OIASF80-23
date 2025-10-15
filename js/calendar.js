// Calendar functionality with done/total counters
import { getCalendarStats } from './store.js';

/**
 * Get color by completion ratio
 * @param {number} ratio - Completion ratio (0-1)
 * @returns {string} CSS color
 */
export function colorByRatio(ratio) {
  if (ratio >= 1) return 'var(--ok)';
  if (ratio >= 0.8) return '#10B981';
  if (ratio >= 0.6) return 'var(--warn)';
  if (ratio >= 0.4) return '#F97316';
  return 'var(--danger)';
}

/**
 * Get month name
 * @param {number} month - Month index (0-11)
 * @returns {string} Month name
 */
function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}

/**
 * Get day names
 * @returns {Array} Array of day names
 */
function getDayNames() {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}

/**
 * Generate calendar grid for a month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Array} Array of calendar cells
 */
function generateCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  
  // Adjust to Monday start
  const dayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  const cells = [];
  
  // Generate 42 cells (6 weeks × 7 days)
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + i);
    
    const isCurrentMonth = cellDate.getMonth() === month;
    const isToday = cellDate.toDateString() === new Date().toDateString();
    
    cells.push({
      date: cellDate,
      day: cellDate.getDate(),
      isCurrentMonth,
      isToday,
      key: cellDate.toISOString().slice(0, 10)
    });
  }
  
  return cells;
}

/**
 * Render calendar month
 * @param {HTMLElement} container - Container element
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @param {Map} statsMap - Statistics map
 */
export async function renderMonth(container, year, month, statsMap = new Map()) {
  const cells = generateCalendarGrid(year, month);
  const dayNames = getDayNames();
  
  // Clear container
  container.innerHTML = '';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'calendar-header';
  header.innerHTML = `
    <h2 class="calendar-title">${getMonthName(month)} ${year}</h2>
    <div class="calendar-nav">
      <button class="btn btn-sm" data-action="prev-month">‹</button>
      <button class="btn btn-sm" data-action="next-month">›</button>
    </div>
  `;
  container.appendChild(header);
  
  // Create day names header
  const dayHeader = document.createElement('div');
  dayHeader.className = 'calendar-day-header';
  dayNames.forEach(dayName => {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day-name';
    dayEl.textContent = dayName;
    dayHeader.appendChild(dayEl);
  });
  container.appendChild(dayHeader);
  
  // Create grid
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';
  
  cells.forEach(cell => {
    const cellEl = document.createElement('div');
    cellEl.className = 'cal-cell';
    cellEl.dataset.date = cell.key;
    
    if (!cell.isCurrentMonth) {
      cellEl.classList.add('other-month');
    }
    
    if (cell.isToday) {
      cellEl.classList.add('today');
    }
    
    const stats = statsMap.get(cell.key) || { done: 0, total: 0 };
    const ratio = stats.total > 0 ? stats.done / stats.total : 0;
    
    cellEl.innerHTML = `
      <div class="cal-day ${cell.isToday ? 'today' : ''}">${cell.day}</div>
      <div class="cal-counter">
        <span class="done" style="color: ${colorByRatio(ratio)}">${stats.done}</span>
        <span class="total" style="color: var(--text-muted)">/${stats.total}</span>
      </div>
    `;
    
    // Add click handler
    cellEl.addEventListener('click', () => {
      selectDate(cell.key);
    });
    
    grid.appendChild(cellEl);
  });
  
  container.appendChild(grid);
  
  // Add navigation handlers
  container.querySelector('[data-action="prev-month"]').addEventListener('click', () => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    renderMonth(container, newYear, newMonth, statsMap);
  });
  
  container.querySelector('[data-action="next-month"]').addEventListener('click', () => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    renderMonth(container, newYear, newMonth, statsMap);
  });
}

/**
 * Render calendar with current month
 * @param {HTMLElement} container - Container element
 */
export async function renderCurrentMonth(container) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  // Get calendar stats for the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const statsMap = await getCalendarStats(
    firstDay.toISOString().slice(0, 10),
    lastDay.toISOString().slice(0, 10)
  );
  
  await renderMonth(container, year, month, statsMap);
}

/**
 * Select date (placeholder for future functionality)
 * @param {string} dateKey - Date in YYYY-MM-DD format
 */
function selectDate(dateKey) {
  console.log('Selected date:', dateKey);
  // TODO: Implement date selection functionality
  // This could navigate to timeline view for that date
  // or show a modal with day details
}

/**
 * Get date range for month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Object} Date range
 */
export function getMonthRange(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  return {
    start: firstDay.toISOString().slice(0, 10),
    end: lastDay.toISOString().slice(0, 10)
  };
}

/**
 * Get week range for a date
 * @param {Date} date - Date
 * @returns {Object} Week range
 */
export function getWeekRange(date) {
  const startOfWeek = new Date(date);
  const dayOfWeek = (date.getDay() + 6) % 7; // Convert to Monday start
  startOfWeek.setDate(date.getDate() - dayOfWeek);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return {
    start: startOfWeek.toISOString().slice(0, 10),
    end: endOfWeek.toISOString().slice(0, 10)
  };
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date for input
 * @param {Date} date - Date object
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Parse date from string
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @returns {Date} Date object
 */
export function parseDate(dateString) {
  return new Date(dateString + 'T00:00:00');
}

/**
 * Check if date is today
 * @param {Date} date - Date object
 * @returns {boolean} True if today
 */
export function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if date is in current month
 * @param {Date} date - Date object
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {boolean} True if in current month
 */
export function isInMonth(date, year, month) {
  return date.getFullYear() === year && date.getMonth() === month;
}

/**
 * Get days between two dates
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Array} Array of dates
 */
export function getDaysBetween(start, end) {
  const days = [];
  const current = new Date(start);
  
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

/**
 * Get week number for a date
 * @param {Date} date - Date object
 * @returns {number} Week number
 */
export function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Export default function
export default {
  renderMonth,
  renderCurrentMonth,
  colorByRatio,
  getMonthRange,
  getWeekRange,
  formatDate,
  formatDateInput,
  parseDate,
  isToday,
  isInMonth,
  getDaysBetween,
  getWeekNumber
};
