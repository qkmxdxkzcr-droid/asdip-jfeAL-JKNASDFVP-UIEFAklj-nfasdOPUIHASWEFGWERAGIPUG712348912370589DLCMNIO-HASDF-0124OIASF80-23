import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { BracketHeader } from './BracketHeader'
import { TaskCard } from '../TaskCard/TaskCard'
import { DragPlaceholder } from '../DragPlaceholder'
import { Task } from '../../store/data'

interface BracketProps {
  id: string
  title: string
  startTime: string
  endTime: string
  usedMinutes: number
  totalMinutes: number
  tasks: Task[]
  onDeleteTask?: (id: string) => void
  isDragging?: boolean
}

export function Bracket({ 
  id,
  title, 
  startTime, 
  endTime, 
  usedMinutes, 
  totalMinutes, 
  tasks, 
  onDeleteTask,
  isDragging = false 
}: BracketProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`rounded-xl border border-border bg-card shadow-soft p-s4 mb-s4 transition-colors ${
        isOver ? 'border-accent-600 bg-accent-25' : ''
      }`}
    >
      <BracketHeader
        title={title}
        startTime={startTime}
        endTime={endTime}
        usedMinutes={usedMinutes}
        totalMinutes={totalMinutes}
      />
      
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDeleteTask}
            isDragging={isDragging}
          />
        ))}
        {isOver && tasks.length === 0 && (
          <DragPlaceholder />
        )}
      </div>
    </div>
  )
}
