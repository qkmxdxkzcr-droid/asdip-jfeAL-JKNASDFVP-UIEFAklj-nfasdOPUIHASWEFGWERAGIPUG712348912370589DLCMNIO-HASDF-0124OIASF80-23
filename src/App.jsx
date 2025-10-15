import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import Layout from '../Layout.js'

// Import pages
import Timeline from '../Pages/timeline.js'
import Projects from '../Pages/projects.js'
import Templates from '../Pages/templates.js'
import Import from '../Pages/import.js'
import Statistics from '../Pages/statistics.js'
import ProjectDetail from '../Pages/projectdetail.js'
import ProjectsAndTasks from '../Pages/projectandtasks.js'
import Calendar from '../Pages/calendar.js'
import Settings from '../Pages/settings.js'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Timeline />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/import" element={<Import />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/project-detail" element={<ProjectDetail />} />
            <Route path="/projects-and-tasks" element={<ProjectsAndTasks />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  )
}

export default App
