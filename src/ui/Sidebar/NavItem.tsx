import React from 'react'
import { LucideIcon } from 'lucide-react'

interface NavItemProps {
  icon: LucideIcon
  label: string
  path: string
  isActive: boolean
  onClick: () => void
}

export function NavItem({ icon: Icon, label, path, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors ${
        isActive
          ? 'relative bg-[color-mix(in_oklab,var(--accent-25)_80%,var(--panel))] text-accent-600'
          : 'text-text-muted hover:bg-accent-25 hover:text-text'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-accent-600" />
      )}
      <Icon size={18} className="currentColor" />
      <span>{label}</span>
    </button>
  )
}
