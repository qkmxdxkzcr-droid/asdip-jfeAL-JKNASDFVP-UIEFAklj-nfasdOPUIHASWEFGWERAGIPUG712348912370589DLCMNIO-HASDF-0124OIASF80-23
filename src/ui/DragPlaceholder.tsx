import React from 'react'

interface DragPlaceholderProps {
  height?: number
}

export function DragPlaceholder({ height = 60 }: DragPlaceholderProps) {
  return (
    <div 
      className="border-2 border-dashed border-accent-600 bg-accent-25 rounded-xl"
      style={{ height }}
    />
  )
}
