import React, { useEffect, useState } from 'react'
import { Sidebar } from '../ui/Sidebar/Sidebar'
import { Topbar } from '../ui/Topbar/Topbar'
import { useUIStore } from '../store/ui'
import { Menu, X } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { theme } = useUIStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Применяем тему к document.documentElement
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:ml-60">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
