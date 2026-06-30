import { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, Target, Eye, PieChart,
  Calendar, Clock, Zap
} from 'lucide-react'
import { statsApi } from '@/api'
import Card from '@/components/Card'
import {
  LineChart, Line, BarChart as ReBarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart,
  Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Statistics() {
  const [dailyData, setDailyData] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [focusStats, setFocusStats] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [days])

  const loadData = async () => {
    try {
      setLoading(true)
      const [dailyRes, catRes, focusRes, dashRes] = await Promise.all([
        statsApi.daily(days),
        statsApi.categories(),
        statsApi.focus(days),
        statsApi.dashboard(),
      ])
      setDailyData(dailyRes.data || [])
      setCategoryStats(catRes.data || [])
      setFocusStats(focusRes.data)
      setDashboard(dashRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const categoryPieData = categoryStats.map(c => ({
    name: c.category_name,
    value: c.total,
  }))

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">数据统计</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">查看你的学习数据和进步轨迹</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {[7, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                days === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              近 {d} 天
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">总题量</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {dashboard?.total_questions || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">累计刷题</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {dashboard?.total_answered || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">正确率</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {dashboard?.correct_rate || 0}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">累计专注时长</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {focusStats?.total_focus_minutes || 0} <span className="text-base font-normal">分钟</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            刷题趋势
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={dailyData}>
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
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-purple-500" />
            正确率趋势
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`${value}%`, '正确率']}
                />
                <Line
                  type="monotone"
                  dataKey="correct_rate"
                  name="正确率"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-teal-500" />
            分类题量分布
          </h2>
          <div className="h-64">
            {categoryPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                暂无数据
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-amber-500" />
            分类掌握度
          </h2>
          <div className="space-y-4">
            {categoryStats.length > 0 ? categoryStats.map((cat, index) => (
              <div key={cat.category_id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{cat.category_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {cat.total} 题
                    </span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {cat.correct_rate}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.correct_rate}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cat.mastery_level}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400">暂无数据</div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-green-500" />
          专注度趋势
        </h2>
        <div className="h-64">
          {focusStats?.daily_focus?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={focusStats.daily_focus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="focus_minutes"
                  name="专注时长(分钟)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avg_focus_score"
                  name="平均专注度"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              暂无专注度数据
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
