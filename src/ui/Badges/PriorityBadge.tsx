import React from 'react'

interface PriorityBadgeProps {
  priority: 'P1' | 'P2' | 'P3' | 'P4'
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const map = {
    P1: { bg: 'color-mix(in okLab, var(--danger) 18%, white)', fg: 'var(--danger)' },
    P2: { bg: 'var(--accent-200)', fg: 'var(--accent-600)' },
    P3: { bg: '#E0F2FE', fg: '#0EA5E9' },
    P4: { bg: '#E2E8F0', fg: '#64748B' },
  } as const

  const style = map[priority]

  return (
    <span 
      className="grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold"
      style={{ background: style.bg, color: style.fg }}
    >
      {priority}
    </span>
  )
}
