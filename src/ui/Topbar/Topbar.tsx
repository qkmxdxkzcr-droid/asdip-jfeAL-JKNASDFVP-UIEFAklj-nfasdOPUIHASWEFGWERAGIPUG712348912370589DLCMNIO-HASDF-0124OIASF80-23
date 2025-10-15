import React from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Settings, Moon, Sun, Menu } from 'lucide-react'
import { useUIStore } from '../../store/ui'

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useUIStore()
  const today = new Date()

  return (
    <div className="flex items-center justify-between bg-panel border-b border-border px-4 sm:px-6 py-4">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-text-muted hover:text-text transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg font-semibold text-text">
            {format(today, 'd MMMM yyyy', { locale: ru })}
          </h2>
          <span className="text-sm text-text-muted">
            {format(today, 'EEEE', { locale: ru })}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <button className="hidden sm:block px-3 py-2 text-sm text-text-weak hover:text-text transition-colors">
          Изменить шаблон
        </button>
        <button className="hidden sm:block px-3 py-2 text-sm text-text-weak hover:text-text transition-colors">
          Закрыть день
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 text-text-muted hover:text-text transition-colors"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="p-2 text-text-muted hover:text-text transition-colors">
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}
