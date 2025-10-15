import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buildCalendarStats, getRatioColor } from '../../core/calendarStats'
import { useDataStore } from '../../store/data'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { tasks } = useDataStore()
  const calendarStats = buildCalendarStats(tasks)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const getStatsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return calendarStats.get(dateStr) || { done: 0, total: 0, ratio: 0 }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Календарь</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 text-text-muted hover:text-text transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-text min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: ru })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 text-text-muted hover:text-text transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Календарная сетка */}
      <div className="bg-panel rounded-xl border border-border shadow-soft overflow-hidden">
        {/* Заголовки дней недели */}
        <div className="grid grid-cols-7 bg-track">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-text-weak">
              {day}
            </div>
          ))}
        </div>

        {/* Дни месяца */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const stats = getStatsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border-r border-b border-border last:border-r-0 ${
                  isCurrentMonth ? 'bg-card' : 'bg-panel'
                } ${isCurrentDay ? 'ring-2 ring-accent-600' : ''}`}
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className={`text-xs sm:text-sm font-medium ${
                    isCurrentMonth ? 'text-text' : 'text-text-muted'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {isCurrentDay && (
                    <span className="text-xs text-accent-600 font-medium hidden sm:inline">Сегодня</span>
                  )}
                </div>
                
                {/* Статистика задач */}
                {stats.total > 0 && (
                  <div className="mt-auto">
                    <div className="text-xs text-text-muted">
                      <span 
                        className="font-semibold"
                        style={{ color: getRatioColor(stats.ratio) }}
                      >
                        {stats.done}
                      </span>
                      <span className="text-text-muted">/{stats.total}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
        <span className="text-text-weak">Выполнение:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--ok)' }}></div>
          <span className="text-text-weak">100%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent-600)' }}></div>
          <span className="text-text-weak">80%+</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--info)' }}></div>
          <span className="text-text-weak">60%+</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--warn)' }}></div>
          <span className="text-text-weak">40%+</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--danger)' }}></div>
          <span className="text-text-weak">&lt;40%</span>
        </div>
      </div>
    </div>
  )
}
