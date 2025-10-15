import React from 'react'
import { MiniProgress } from '../MiniProgress'

interface BracketHeaderProps {
  title: string
  startTime: string
  endTime: string
  usedMinutes: number
  totalMinutes: number
}

export function BracketHeader({ 
  title, 
  startTime, 
  endTime, 
  usedMinutes, 
  totalMinutes 
}: BracketHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[14px] font-semibold text-text">{title}</h3>
          <span className="text-[12px] text-text-muted">
            {startTime}—{endTime}
          </span>
        </div>
        <div className="text-[12px] text-text-muted">
          {usedMinutes}/{totalMinutes} мин
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <MiniProgress used={usedMinutes} total={totalMinutes} />
      </div>
    </div>
  )
}
