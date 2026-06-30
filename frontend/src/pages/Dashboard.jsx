import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, FileQuestion, CheckCircle, AlertCircle, Star,
  Clock, TrendingUp, Target, Zap, ChevronRight
} from 'lucide-react'
import { statsApi, wrongApi } from '@/api'
import Card from '@/components/Card'
import Button from '@/components/Button'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

const statCards = [
  { key: 'total_questions', label: '总题量', icon: FileQuestion, color: 'from-blue-500 to-blue-600' },
  { key: 'total_answered', label: '累计刷题', icon: BookOpen, color: 'from-teal-500 to-teal-600' },
  { key: 'correct_rate', label: '正确率', icon: CheckCircle, color: 'from-green-500 to-green-600', suffix: '%' },
  { key: 'total_wrong', label: '错题数', icon: AlertCircle, color: 'from-red-500 to-red-600' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [dailyData, setDailyData] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [todayReview, setTodayReview] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsRes, dailyRes, catRes, reviewRes] = await Promise.all([
        statsApi.dashboard(),
        statsApi.daily(7),
        statsApi.categories(),
        wrongApi.todayCount(),
      ])
      setStats(statsRes.data)
      setDailyData(dailyRes.data || [])
      setCategoryStats(catRes.data || [])
      setTodayReview(reviewRes.data?.count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">首页概览</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">欢迎回来，继续你的学习之旅</p>
        </div>
        <Button onClick={() => navigate('/practice')}>
          <Zap className="w-4 h-4" />
          开始刷题
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = stats?.[card.key] ?? 0
          return (
            <Card key={card.key} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 2) : value}
                    {card.suffix || ''}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {todayReview > 0 && (
        <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">今日待复习</h3>
                <p className="text-slate-600 dark:text-slate-300">你有 <span className="font-bold text-amber-600 dark:text-amber-400">{todayReview}</span> 道题目需要复习</p>
              </div>
            </div>
            <Button variant="primary" onClick={() => navigate('/wrong')}>
              去复习
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              刷题趋势（近 7 天）
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="total" name="刷题数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-teal-500" />
            分类掌握度
          </h2>
          <div className="space-y-4">
            {categoryStats.slice(0, 5).map((cat) => (
              <div key={cat.category_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{cat.category_name}</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{cat.correct_rate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-500"
                    style={{ width: `${cat.correct_rate}%` }}
                  />
                </div>
              </div>
            ))}
            {categoryStats.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">暂无数据</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
