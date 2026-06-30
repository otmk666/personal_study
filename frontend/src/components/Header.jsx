import { Sun, Moon, Monitor, Search, Bell, BookX } from 'lucide-react'
import { useThemeStore } from '@/store'
import { cn } from '@/utils'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { wrongApi } from '@/api'

export default function Header() {
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showBellPanel, setShowBellPanel] = useState(false)
  const [wrongCount, setWrongCount] = useState(0)
  const [wrongList, setWrongList] = useState([])

  const themes = [
    { value: 'light', label: '浅色模式', icon: Sun },
    { value: 'dark', label: '深色模式', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor },
  ]

  const currentTheme = themes.find(t => t.value === theme) || themes[0]
  const CurrentIcon = currentTheme.icon

  // 加载待复习错题数
  useEffect(() => {
    const loadWrongCount = async () => {
      try {
        const res = await wrongApi.list({ mastered: false, page_size: 5, page: 1 })
        if (res.data) {
          setWrongCount(res.data.total || 0)
          setWrongList(res.data.items || res.data || [])
        }
      } catch (e) {
        console.error('加载错题失败:', e)
      }
    }
    loadWrongCount()
  }, [])

  const goToWrongBook = () => {
    setShowBellPanel(false)
    navigate('/wrong')
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 transition-theme">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索题目..."
            className="w-64 pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <CurrentIcon className="w-5 h-5" />
          </button>
          {showThemeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
              <div className={cn(
                'absolute right-0 top-full mt-2 w-40 rounded-lg border shadow-lg',
                'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                'py-1 z-50'
              )}>
                {themes.map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.value}
                      onClick={() => {
                        setTheme(t.value)
                        setShowThemeMenu(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm',
                        'hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                        theme === t.value
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-200'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* 通知铃铛 */}
        <div className="relative">
          <button
            onClick={() => setShowBellPanel(!showBellPanel)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {wrongCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wrongCount > 99 ? '99+' : wrongCount}
              </span>
            )}
          </button>

          {showBellPanel && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowBellPanel(false)} />
              <div className={cn(
                'absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-xl',
                'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                'overflow-hidden z-50'
              )}>
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookX className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">待复习错题</span>
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                      {wrongCount} 道
                    </span>
                  </div>
                  <button
                    onClick={goToWrongBook}
                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  >
                    查看全部
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {wrongList.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                      🎉 暂无待复习错题
                    </div>
                  ) : (
                    wrongList.map((item) => (
                      <button
                        key={item.id}
                        onClick={goToWrongBook}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 transition-colors"
                      >
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                          {item.question?.title || item.title || '无题目标题'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                            {item.question?.question_type === 'single' ? '单选' :
                             item.question?.question_type === 'multiple' ? '多选' :
                             item.question?.question_type === 'judge' ? '判断' : '简答'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            错误 {item.wrong_count || 1} 次
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={goToWrongBook}
                    className="w-full py-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
                  >
                    前往错题本复习 →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
            U
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">用户</span>
        </div>
      </div>
    </header>
  )
}
