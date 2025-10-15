import React from 'react'
import { FolderOpen, Clock, Move, Scissors } from 'lucide-react'
import { MiniProgress } from '../../ui/MiniProgress'
import { Unplanned } from '../../ui/Unplanned/Unplanned'
import { useDataStore } from '../../store/data'

export default function Projects() {
  const { projects, tasks } = useDataStore()
  const unplannedTasks = tasks.filter(task => !task.startTime)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Проекты и планы</h1>
        <button className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700 transition-colors">
          Создать проект
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Сетка проектов */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="rounded-xl border border-border bg-card shadow-soft p-s4">
                {/* Заголовок проекта */}
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.shortName}
                  </div>
                  <h3 className="text-lg font-semibold text-text">{project.name}</h3>
                </div>

                {/* Характеристики проекта */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-weak">Длительность</span>
                    <span className="text-text">{project.duration} мин</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-weak">Перенос</span>
                    <span className="text-text">{project.canMove ? 'Да' : 'Нет'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-weak">Можно разбивать</span>
                    <span className="text-text">{project.canSplit ? 'Да' : 'Нет'}</span>
                  </div>
                </div>

                {/* Прогресс */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-weak">Прогресс</span>
                    <span className="text-text">{project.progress}%</span>
                  </div>
                  <MiniProgress used={project.progress} total={100} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Правая колонка - Незапланированные */}
        <div className="lg:col-span-1">
          <Unplanned 
            tasks={unplannedTasks}
          />
        </div>
      </div>
    </div>
  )
}
