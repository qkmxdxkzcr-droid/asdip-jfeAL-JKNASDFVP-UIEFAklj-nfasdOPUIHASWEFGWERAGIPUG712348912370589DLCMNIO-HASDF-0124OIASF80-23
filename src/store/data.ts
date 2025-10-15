import { create } from 'zustand'

export interface Task {
  id: string
  title: string
  startTime?: string
  endTime?: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  completed: boolean
  projectId?: string
}

export interface Project {
  id: string
  name: string
  shortName: string
  color: string
  duration: number
  canMove: boolean
  canSplit: boolean
  progress: number
}

export interface DayTemplate {
  id: string
  name: string
  blocks: Array<{
    type: 'fixed' | 'window' | 'day'
    name: string
    startTime: string
    endTime: string
    color: string
  }>
}

interface DataState {
  tasks: Task[]
  projects: Project[]
  dayTemplates: DayTemplate[]
  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addProject: (project: Omit<Project, 'id'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
}

export const useDataStore = create<DataState>((set) => ({
  tasks: [
    {
      id: '1',
      title: 'Проверить почту',
      startTime: '09:00',
      endTime: '09:15',
      priority: 'P1',
      completed: true,
    },
    {
      id: '2',
      title: 'Планирование дня',
      startTime: '09:15',
      endTime: '09:30',
      priority: 'P1',
      completed: true,
    },
    {
      id: '3',
      title: 'Работа над проектом',
      startTime: '09:30',
      endTime: '11:00',
      priority: 'P2',
      completed: false,
    },
  ],
  projects: [
    {
      id: '1',
      name: 'Веб-приложение',
      shortName: 'WEB',
      color: '#7C4DFF',
      duration: 120,
      canMove: true,
      canSplit: true,
      progress: 65,
    },
    {
      id: '2',
      name: 'Мобильное приложение',
      shortName: 'MOB',
      color: '#22C55E',
      duration: 90,
      canMove: false,
      canSplit: false,
      progress: 30,
    },
  ],
  dayTemplates: [],
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: Date.now().toString() }]
  })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    )
  })),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),
  addProject: (project) => set((state) => ({
    projects: [...state.projects, { ...project, id: Date.now().toString() }]
  })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(project => 
      project.id === id ? { ...project, ...updates } : project
    )
  })),
}))
