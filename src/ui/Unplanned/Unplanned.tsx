import React, { useState } from 'react'
import { Plus, Clock } from 'lucide-react'
import { TaskCard } from '../TaskCard/TaskCard'
import { PriorityBadge } from '../Badges/PriorityBadge'
import { Task } from '../../store/data'
import { useDataStore } from '../../store/data'

interface UnplannedProps {
  tasks: Task[]
  onDeleteTask?: (id: string) => void
}

export function Unplanned({ tasks, onDeleteTask }: UnplannedProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskMinutes, setNewTaskMinutes] = useState(30)
  const [newTaskPriority, setNewTaskPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P2')
  const { addTask } = useDataStore()

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return

    addTask({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      completed: false,
    })

    setNewTaskTitle('')
  }

  return (
    <div className="bg-panel rounded-xl border border-border p-s4">
      <h3 className="text-[14px] font-semibold text-text mb-4">Незапланированные</h3>
      
      {/* Форма добавления задачи */}
      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Название задачи"
            className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-card text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-600 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <select
            value={newTaskMinutes}
            onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
            className="w-16 px-2 py-2 text-sm border border-border rounded-md bg-card text-text focus:outline-none focus:ring-2 focus:ring-accent-600"
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={45}>45</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
            <option value={120}>120</option>
          </select>
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as any)}
            className="px-2 py-2 text-sm border border-border rounded-md bg-card text-text focus:outline-none focus:ring-2 focus:ring-accent-600"
          >
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
            <option value="P4">P4</option>
          </select>
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-md hover:bg-accent-700 transition-colors"
          >
            Добавить
          </button>
        </div>
      </div>

      {/* Список задач */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    </div>
  )
}
