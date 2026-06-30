import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import QuestionList from '@/pages/QuestionList'
import Practice from '@/pages/Practice'
import WrongBook from '@/pages/WrongBook'
import Favorites from '@/pages/Favorites'
import Categories from '@/pages/Categories'
import Statistics from '@/pages/Statistics'
import Settings from '@/pages/Settings'
import AiSolver from '@/pages/AiSolver'
import FloatingCamera from '@/components/FloatingCamera'
import MonitorWindow from '@/components/MonitorWindow'

export default function App() {
  const [showMonitor, setShowMonitor] = useState(false)

  // 监听全局打开/切换监督窗口事件
  useEffect(() => {
    const handleOpenMonitor = () => setShowMonitor(true)
    const handleToggleMonitor = () => setShowMonitor(prev => !prev)
    window.addEventListener('openMonitorWindow', handleOpenMonitor)
    window.addEventListener('toggleMonitorWindow', handleToggleMonitor)
    return () => {
      window.removeEventListener('openMonitorWindow', handleOpenMonitor)
      window.removeEventListener('toggleMonitorWindow', handleToggleMonitor)
    }
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ai-solver" element={<AiSolver />} />
          <Route path="questions" element={<QuestionList />} />
          <Route path="practice" element={<Practice />} />
          <Route path="wrong" element={<WrongBook />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="categories" element={<Categories />} />
          <Route path="stats" element={<Statistics />} />
          <Route path="settings" element={<Settings onOpenMonitor={() => setShowMonitor(true)} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingCamera />
      {showMonitor && (
        <MonitorWindow onClose={() => setShowMonitor(false)} />
      )}
    </>
  )
}
