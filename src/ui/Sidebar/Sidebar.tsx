import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Calendar, 
  BarChart3, 
  FolderOpen, 
  CalendarDays, 
  FileText, 
  Download, 
  TrendingUp,
  GripVertical
} from 'lucide-react'
import { NavItem } from './NavItem'
import { useUIStore } from '../../store/ui'

const navigationItems = [
  { icon: GripVertical, label: 'Таймлайн', path: '/timeline' },
  { icon: BarChart3, label: 'Кривые дня', path: '/curves' },
  { icon: FolderOpen, label: 'Проекты и планы', path: '/projects' },
  { icon: CalendarDays, label: 'Календарь', path: '/calendar' },
  { icon: FileText, label: 'Шаблоны', path: '/templates' },
  { icon: Download, label: 'Импорт', path: '/import' },
  { icon: TrendingUp, label: 'Статистика', path: '/statistics' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setActiveRoute } = useUIStore()

  const handleNavClick = (path: string) => {
    setActiveRoute(path)
    navigate(path)
  }

  return (
    <div className="fixed left-0 top-0 h-full w-60 bg-panel border-r border-border">
      <div className="p-6">
        <h1 className="text-xl font-bold text-text mb-8">Планировщик</h1>
        
        <nav className="space-y-2">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            Навигация
          </div>
          {navigationItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={location.pathname === item.path}
              onClick={() => handleNavClick(item.path)}
            />
          ))}
        </nav>
      </div>
    </div>
  )
}
