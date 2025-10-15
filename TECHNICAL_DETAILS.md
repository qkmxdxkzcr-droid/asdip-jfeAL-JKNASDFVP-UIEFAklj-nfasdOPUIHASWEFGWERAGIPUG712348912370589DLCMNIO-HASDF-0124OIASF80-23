# 🔧 Технические детали проекта

## 📦 Зависимости

### Основные зависимости
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "vite": "^7.1.10",
  "@vitejs/plugin-react": "^4.3.3"
}
```

### UI и стилизация
```json
{
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0"
}
```

### Функциональность
```json
{
  "zustand": "^4.4.1",
  "recharts": "^2.8.0",
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "react-router-dom": "^6.8.0",
  "@tanstack/react-query": "^4.29.0",
  "sonner": "^1.0.0"
}
```

### Иконки
```json
{
  "lucide-react": "^0.263.1"
}
```

## 🎨 CSS Архитектура

### CSS переменные (theme.css)
```css
:root {
  /* Base colors */
  --bg: #F7F8FB;
  --panel: #FFFFFF;
  --card: #FFFFFF;
  --border: #E8EAF1;
  --track: #EEF0F6;
  --text: #0F172A;
  --text-weak: #475569;
  --text-muted: #6B7280;
  
  /* Accent colors */
  --accent-25: #F4F0FF;
  --accent-200: #E6D6FF;
  --accent-600: #7C4DFF;
  
  /* Status colors */
  --ok: #22C55E;
  --warn: #F59E0B;
  --danger: #EF4444;
  --info: #0EA5E9;
  
  /* Design tokens */
  --r-md: 12px;
  --r-lg: 14px;
  --r-xl: 16px;
  --shadow: 0 6px 18px rgba(16,24,40,.06);
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 20px;
  --s-6: 24px;
}
```

### Темная тема
```css
:root.dark {
  --bg: #0F1322;
  --panel: #12172A;
  --card: #141B32;
  --border: #1E2642;
  --track: #1A2240;
  --text: #E6EAF6;
  --text-weak: #B7C0D9;
  --text-muted: #9AA4C2;
  --accent-25: #1F1840;
  --accent-200: #2A2060;
  --accent-600: #8D79FF;
  --shadow: 0 6px 18px rgba(0,0,0,.28);
}
```

### TailwindCSS конфигурация
```javascript
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        card: 'var(--card)',
        border: 'var(--border)',
        track: 'var(--track)',
        text: 'var(--text)',
        'text-weak': 'var(--text-weak)',
        'text-muted': 'var(--text-muted)',
        accent: {
          25: 'var(--accent-25)',
          200: 'var(--accent-200)',
          600: 'var(--accent-600)',
        },
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      borderRadius: {
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
      },
      boxShadow: {
        soft: 'var(--shadow)',
      },
      spacing: {
        's2': 'var(--s-2)',
        's3': 'var(--s-3)',
        's4': 'var(--s-4)',
        's5': 'var(--s-5)',
        's6': 'var(--s-6)',
      }
    }
  },
  plugins: [],
}
```

## 🏗 Архитектура компонентов

### Структура TaskCard
```typescript
interface TaskCardProps {
  task: Task
  onDelete?: (id: string) => void
  isDragging?: boolean
  isDragOverlay?: boolean
}

// Drag & Drop интеграция
const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
  id: task.id,
})
```

### Структура Bracket
```typescript
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

// Drop zone интеграция
const { isOver, setNodeRef } = useDroppable({
  id,
})
```

### Zustand Store (UI)
```typescript
interface UIStore {
  theme: 'light' | 'dark'
  activeRoute: string
  setTheme: (theme: 'light' | 'dark') => void
  setActiveRoute: (route: string) => void
}
```

### Zustand Store (Data)
```typescript
interface DataStore {
  tasks: Task[]
  dayTemplate: DayTemplate
  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
}
```

## 🔄 Drag & Drop реализация

### DndContext конфигурация
```typescript
<DndContext
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  {/* Компоненты */}
  <DragOverlay>
    {activeTask ? (
      <TaskCard task={activeTask} isDragOverlay={true} />
    ) : null}
  </DragOverlay>
</DndContext>
```

### Обработка событий
```typescript
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
  
  // Логика перемещения задач
  if (targetId === 'morning-bracket') {
    updateTask(taskId, { startTime: '09:00', endTime: '11:30' })
  }
  // ... другие случаи
}
```

## 📊 Графики и визуализация

### Recharts конфигурация
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = buildCurves() // Функция из core/curves.ts

<ResponsiveContainer width="100%" height={200}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="time" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="var(--accent-600)" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

## 📱 Responsive дизайн

### Breakpoints
- **Desktop**: ≥1280px
- **Tablet**: 1024–1279px
- **Mobile**: <768px

### Адаптивные классы
```css
/* Grid адаптация */
grid-cols-1 lg:grid-cols-3

/* Скрытие элементов на мобильных */
hidden sm:inline

/* Адаптивные отступы */
px-4 sm:px-6

/* Адаптивные размеры текста */
text-xs sm:text-sm
```

## 🚀 Vite конфигурация

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

## 🔧 Скрипты package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx,ts,tsx",
    "lint:fix": "eslint . --ext js,jsx,ts,tsx --fix"
  }
}
```

## 📁 Структура файлов

```
src/
├── app/                    # Основная конфигурация
│   ├── layout.tsx         # Главный лейаут
│   ├── router.tsx         # Роутинг
│   ├── theme.css          # CSS переменные
│   └── tailwind.css       # TailwindCSS
├── pages/                 # Страницы приложения
│   ├── Timeline/          # Главная страница
│   ├── Projects/          # Проекты
│   ├── Calendar/          # Календарь
│   ├── Templates/         # Шаблоны
│   ├── Import/            # Импорт
│   └── Stats/             # Статистика
├── ui/                    # UI компоненты
│   ├── Sidebar/           # Боковая панель
│   ├── Topbar/            # Верхняя панель
│   ├── TaskCard/          # Карточка задачи
│   ├── Bracket/           # Блок задач
│   ├── Unplanned/         # Незапланированные
│   ├── DayCurves/         # Графики
│   ├── Badges/            # Бейджи
│   └── DragPlaceholder/   # DnD плейсхолдер
├── store/                 # Состояние
│   ├── ui.ts              # UI состояние
│   └── data.ts            # Данные
└── core/                  # Бизнес-логика
    ├── curves.ts          # Графики
    └── calendarStats.ts   # Статистика
```

## ⚡ Производительность

### Оптимизации
- **Code splitting**: Автоматически через Vite
- **Tree shaking**: Удаление неиспользуемого кода
- **CSS purging**: Удаление неиспользуемых стилей Tailwind
- **Lazy loading**: Компоненты загружаются по требованию

### Bundle размер
- **Development**: ~2-3MB
- **Production**: ~500KB (gzipped)

## 🔒 Безопасность

### Зависимости
- Все зависимости проверены на уязвимости
- Регулярные обновления через `npm audit`

### Код
- TypeScript для типизации
- ESLint для проверки кода
- Строгие правила импорта

## 📈 Мониторинг

### DevTools
- React DevTools
- Redux DevTools (для Zustand)
- Vite DevTools

### Логирование
- Консольные логи в development
- Ошибки отслеживаются через Vite
- HMR для быстрой разработки
