import React from 'react'
import { CheckSquare, Target, Calendar, TrendingUp, Circle } from 'lucide-react'
import { useDataStore } from '../../store/data'

export default function Statistics() {
  const { tasks, projects } = useDataStore()
  
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.completed).length
  const plannedTasks = tasks.filter(task => task.startTime).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const stats = [
    {
      icon: CheckSquare,
      label: 'Всего задач',
      value: totalTasks,
      color: 'var(--accent-600)',
      bgColor: 'var(--accent-25)'
    },
    {
      icon: Target,
      label: 'Выполнение',
      value: `${completionRate}%`,
      color: 'var(--ok)',
      bgColor: '#E0F2FE'
    },
    {
      icon: Calendar,
      label: 'Запланировано',
      value: plannedTasks,
      color: 'var(--info)',
      bgColor: '#E0F2FE'
    },
    {
      icon: TrendingUp,
      label: 'Выполнено',
      value: completedTasks,
      color: 'var(--warn)',
      bgColor: '#FEF3C7'
    }
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Статистика</h1>

      {/* Карточки метрик */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-panel rounded-xl border border-border shadow-soft p-s4">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: stat.bgColor }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">{stat.value}</div>
                <div className="text-sm text-text-weak">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Статистика по проектам */}
      <div className="bg-panel rounded-xl border border-border shadow-soft p-s4">
        <h3 className="text-lg font-semibold text-text mb-6">Статистика по проектам</h3>
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Circle 
                  size={12} 
                  style={{ color: project.color, fill: project.color }} 
                />
                <span className="text-sm font-medium text-text truncate">
                  {project.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-track rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${project.progress}%`,
                      backgroundColor: project.color 
                    }}
                  />
                </div>
                <span className="text-sm text-text-weak w-12 text-right">
                  {project.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
