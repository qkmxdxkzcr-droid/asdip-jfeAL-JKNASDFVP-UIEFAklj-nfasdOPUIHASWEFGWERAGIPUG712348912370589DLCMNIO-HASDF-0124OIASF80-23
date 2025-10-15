import React from 'react'
import { Plus, Clock, Calendar, GripVertical } from 'lucide-react'

export default function Templates() {
  const templates = [
    {
      id: '1',
      name: 'Рабочий день',
      blocks: [
        { type: 'fixed', name: 'Утренний ритуал', time: '07:00-08:00', color: '#7C4DFF' },
        { type: 'window', name: 'Работа', time: '09:00-18:00', color: '#22C55E' },
        { type: 'day', name: 'Вечерний отдых', time: '19:00-22:00', color: '#0EA5E9' },
      ]
    },
    {
      id: '2',
      name: 'Выходной',
      blocks: [
        { type: 'fixed', name: 'Сон', time: '23:00-09:00', color: '#7C4DFF' },
        { type: 'day', name: 'Свободное время', time: '10:00-22:00', color: '#F59E0B' },
      ]
    }
  ]

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'fixed': return <Clock size={12} />
      case 'window': return <Calendar size={12} />
      case 'day': return <GripVertical size={12} />
      default: return <Clock size={12} />
    }
  }

  const getBlockColor = (color: string) => ({
    backgroundColor: color + '20',
    borderLeftColor: color,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Шаблоны</h1>
        <button className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700 transition-colors">
          Создать шаблон
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
            {/* Заголовок шаблона */}
            <div 
              className="p-4 text-white font-semibold"
              style={{ 
                background: 'linear-gradient(135deg, #7C4DFF 0%, #8D79FF 100%)' 
              }}
            >
              {template.name}
            </div>

            {/* Блоки шаблона */}
            <div className="p-4 space-y-3">
              {template.blocks.map((block, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-md border-l-4"
                  style={getBlockColor(block.color)}
                >
                  <div className="text-text-muted">
                    {getBlockIcon(block.type)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text">{block.name}</div>
                    <div className="text-xs text-text-weak">{block.time}</div>
                  </div>
                  <div className="text-xs text-text-muted bg-white px-2 py-1 rounded">
                    {block.type === 'fixed' ? 'Фикс' : block.type === 'window' ? 'Окно' : 'День'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
