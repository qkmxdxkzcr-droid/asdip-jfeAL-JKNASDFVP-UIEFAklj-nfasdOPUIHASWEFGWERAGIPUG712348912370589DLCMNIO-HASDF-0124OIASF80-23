import { Task } from '../store/data'

export interface CalendarStats {
  done: number
  total: number
  ratio: number
}

export function buildCalendarStats(tasks: Task[]): Map<string, CalendarStats> {
  const stats = new Map<string, CalendarStats>()
  
  // Группируем задачи по датам (для примера используем сегодняшнюю дату)
  const today = new Date().toISOString().split('T')[0]
  
  const todayTasks = tasks.filter(task => {
    // В реальном приложении здесь была бы проверка даты задачи
    return true // Для демо показываем все задачи как сегодняшние
  })
  
  const done = todayTasks.filter(task => task.completed).length
  const total = todayTasks.length
  const ratio = total > 0 ? done / total : 0
  
  stats.set(today, { done, total, ratio })
  
  return stats
}

export function getRatioColor(ratio: number): string {
  if (ratio >= 1.0) return 'var(--ok)'
  if (ratio >= 0.8) return 'var(--accent-600)'
  if (ratio >= 0.6) return 'var(--info)'
  if (ratio >= 0.4) return 'var(--warn)'
  return 'var(--danger)'
}
