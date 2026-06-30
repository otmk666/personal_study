import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, BookOpen, FileQuestion, Layers, BarChart3,
  Star, AlertCircle, Settings, ChevronLeft, ChevronRight,
  Sparkles
} from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/utils'

const menuItems = [
  { path: '/', icon: Home, label: '首页概览' },
  { path: '/ai-solver', icon: Sparkles, label: 'AI解题', highlight: true },
  { path: '/questions', icon: FileQuestion, label: '题库管理' },
  { path: '/practice', icon: BookOpen, label: '刷题练习' },
  { path: '/wrong', icon: AlertCircle, label: '错题本' },
  { path: '/favorites', icon: Star, label: '收藏夹' },
  { path: '/categories', icon: Layers, label: '分类标签' },
  { path: '/stats', icon: BarChart3, label: '数据统计' },
  { path: '/settings', icon: Settings, label: '系统设置' },
]

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const location = useLocation()

  return (
    <aside className={cn(
      'h-screen flex flex-col border-r border-slate-200 dark:border-slate-700',
      'bg-white dark:bg-slate-900 transition-all duration-300 transition-theme',
      sidebarCollapsed ? 'w-16' : 'w-60'
    )}>
      <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-700 px-4">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white text-lg">个人题库</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    'transition-colors duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
            'transition-colors duration-200',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!sidebarCollapsed && <span>收起侧边栏</span>}
        </button>
      </div>
    </aside>
  )
}
