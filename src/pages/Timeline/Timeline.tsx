import React, { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core'
import { Bracket } from '../../ui/Bracket/Bracket'
import { Unplanned } from '../../ui/Unplanned/Unplanned'
import { DayCurves } from '../../ui/DayCurves/DayCurves'
import { TaskCard } from '../../ui/TaskCard/TaskCard'
import { DragPlaceholder } from '../../ui/DragPlaceholder'
import { useDataStore } from '../../store/data'
import { Task } from '../../store/data'

export default function Timeline() {
  const { tasks, deleteTask, updateTask } = useDataStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Фильтруем задачи по времени (для демо)
  const morningTasks = tasks.filter((_, index) => index < 2)
  const afternoonTasks = tasks.filter((_, index) => index >= 2)
  const unplannedTasks = tasks.filter(task => !task.startTime)

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const targetId = over.id as string

    // Простая логика перемещения между блоками
    if (targetId === 'morning-bracket') {
      updateTask(taskId, { startTime: '09:00', endTime: '11:30' })
    } else if (targetId === 'afternoon-bracket') {
      updateTask(taskId, { startTime: '13:00', endTime: '16:15' })
    } else if (targetId === 'unplanned') {
      updateTask(taskId, { startTime: undefined, endTime: undefined })
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Заголовок дня */}
        <div className="rounded-xl border border-border bg-panel shadow-soft p-s4">
          <h1 className="text-lg font-semibold text-text mb-2">Сегодня, 15 января</h1>
          <p className="text-sm text-text-muted">Фиксированный блок</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основной контент */}
          <div className="lg:col-span-2 space-y-4">
            {/* Утренние задачи */}
            <Bracket
              id="morning-bracket"
              title="Пауза (2:28) 1"
              startTime="09:00"
              endTime="11:30"
              usedMinutes={105}
              totalMinutes={148}
              tasks={morningTasks}
              onDeleteTask={deleteTask}
            />

            {/* Дневные задачи */}
            <Bracket
              id="afternoon-bracket"
              title="Работа (3:15) 2"
              startTime="13:00"
              endTime="16:15"
              usedMinutes={180}
              totalMinutes={195}
              tasks={afternoonTasks}
              onDeleteTask={deleteTask}
            />

            {/* Кривые дня */}
            <DayCurves />
          </div>

          {/* Правая колонка - Незапланированные */}
          <div className="lg:col-span-1" id="unplanned">
            <Unplanned 
              tasks={unplannedTasks}
              onDeleteTask={deleteTask}
            />
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard 
              task={activeTask} 
              isDragOverlay={true}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
