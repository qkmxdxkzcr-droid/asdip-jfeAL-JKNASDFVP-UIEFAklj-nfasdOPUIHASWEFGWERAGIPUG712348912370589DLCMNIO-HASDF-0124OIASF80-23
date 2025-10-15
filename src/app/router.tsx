import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Layout } from './layout'

// Import pages
import Timeline from '../pages/Timeline/Timeline'
import Projects from '../pages/Projects/Projects'
import Calendar from '../pages/Calendar/Calendar'
import Templates from '../pages/Templates/Templates'
import Import from '../pages/Import/Import'
import Statistics from '../pages/Stats/Stats'

const queryClient = new QueryClient()

export function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Timeline />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/curves" element={<Timeline />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/import" element={<Import />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  )
}
