import React from 'react'

interface MiniProgressProps {
  used: number
  total: number
}

export function MiniProgress({ used, total }: MiniProgressProps) {
  const pct = Math.min(100, (used / Math.max(total, 1)) * 100)

  return (
    <div className="h-[6px] w-40 rounded-[4px] bg-track">
      <div 
        className="h-full rounded-[4px] bg-ok transition-[width] duration-300" 
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
