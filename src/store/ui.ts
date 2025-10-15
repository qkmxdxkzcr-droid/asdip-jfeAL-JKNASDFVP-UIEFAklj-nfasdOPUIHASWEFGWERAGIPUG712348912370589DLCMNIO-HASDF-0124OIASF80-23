import { create } from 'zustand'

interface UIState {
  activeRoute: string
  theme: 'light' | 'dark'
  setActiveRoute: (route: string) => void
  toggleTheme: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeRoute: '/timeline',
  theme: 'light',
  setActiveRoute: (route) => set({ activeRoute: route }),
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
}))
