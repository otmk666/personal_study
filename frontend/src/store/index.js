import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme })
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
      initTheme: () => {
        const saved = localStorage.getItem('theme-storage')?.theme
        const theme = saved || 'light'
        set({ theme })
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark')
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)

export const useAppStore = create((set, get) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

  toast: null,
  showToast: (msg, type = 'info') => {
    set({ toast: { msg, type, id: Date.now() } })
    setTimeout(() => set({ toast: null }), 3000)
  },
  hideToast: () => set({ toast: null }),
}))
