import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { X, Clock, GripVertical } from 'lucide-react'
import { PriorityBadge } from '../Badges/PriorityBadge'
import { Task } from '../../store/data'

interface TaskCardProps {
  task: Task
  onDelete?: (id: string) => void
  isDragging?: boolean
  isDragOverlay?: boolean
}

export function TaskCard({ 
  task, 
  onDelete, 
  isDragging = false, 
  isDragOverlay = false 
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDndDragging } = useDraggable({
    id: task.id,
  })

  const timeDisplay = task.startTime && task.endTime 
    ? `${task.startTime}—${task.endTime}`
    : ''

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-border bg-card shadow-soft px-s4 py-s3 transition-all hover:-translate-y-px hover:border-[color:color-mix(in_oklab,var(--accent-600)_22%,var(--border))] ${
        isDndDragging || isDragging ? 'scale-[1.02] opacity-95 cursor-grabbing' : 'cursor-grab'
      } ${isDragOverlay ? 'shadow-2xl' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Drag handle */}
          <div 
            className="flex items-center text-text-muted hover:text-text transition-colors cursor-grab active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            <GripVertical size={14} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-medium text-text mb-1 truncate">
              {task.title}
            </div>
            <div className="flex items-center gap-2 text-[12px] text-text-weak">
              {timeDisplay && (
                <>
                  <Clock size={12} className="text-text-muted" />
                  <span className="hidden sm:inline">{timeDisplay}</span>
                  <span className="sm:hidden">{timeDisplay.split('—')[0]}</span>
                  <span className="text-text-muted">·</span>
                </>
              )}
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
        </div>
        
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="ml-2 p-1 text-text-muted hover:text-danger transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
