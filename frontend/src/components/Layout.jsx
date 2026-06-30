import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Toast from './Toast'
import { useThemeStore } from '@/store'
import { useEffect } from 'react'

export default function Layout() {
  const { initTheme } = useThemeStore()

  useEffect(() => {
    initTheme()
  }, [])

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-theme">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  )
}
