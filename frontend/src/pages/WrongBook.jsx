import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
  BookOpen, Trash2, RefreshCw, CheckSquare, Square
} from 'lucide-react'
import { wrongApi } from '@/api'
import { useAppStore } from '@/store'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Select from '@/components/Select'
import Badge from '@/components/Badge'
import { getDifficultyLabel, getDifficultyColor, getQuestionTypeLabel } from '@/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function WrongBook() {
  const navigate = useNavigate()
  const { showToast } = useAppStore()

  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [mastered, setMastered] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState([])
  const [batchLoading, setBatchLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [page, mastered])

  const loadData = async () => {
    try {
      setLoading(true)
      const [res, todayRes] = await Promise.all([
        wrongApi.list({ page, page_size: pageSize, mastered }),
        wrongApi.todayCount(),
      ])
      setRecords(res.data?.items || [])
      setTotal(res.data?.total || 0)
      setTodayCount(todayRes.data?.count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMastered = async (id) => {
    try {
      await wrongApi.markMastered(id)
      showToast('已标记为掌握', 'success')
      loadData()
    } catch (err) {
      showToast(err.message || '操作失败', 'error')
    }
  }

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(records.map(r => r.id))
    }
  }

  const handleBatchMastered = async () => {
    if (selectedIds.length === 0) return
    try {
      setBatchLoading(true)
      await wrongApi.batchMastered(selectedIds)
      showToast(`已将 ${selectedIds.length} 道题标记为掌握`, 'success')
      setSelectedIds([])
      loadData()
    } catch (err) {
      showToast(err.message || '操作失败', 'error')
    } finally {
      setBatchLoading(false)
    }
  }

  useEffect(() => {
    setSelectedIds([])
  }, [page, mastered])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">错题本</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            共 {total} 道错题，今日待复习 {todayCount} 道
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/practice')}>
            <BookOpen className="w-4 h-4" />
            错题专项练习
          </Button>
        </div>
      </div>

      {todayCount > 0 && (
        <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">艾宾浩斯复习提醒</h3>
              <p className="text-slate-600 dark:text-slate-300">
                根据遗忘曲线，今天有 <span className="font-bold text-amber-600 dark:text-amber-400">{todayCount}</span> 道题目需要复习
              </p>
            </div>
            <Button onClick={() => navigate('/practice')}>
              开始复习
            </Button>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => { setMastered(false); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              !mastered
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            待复习
          </button>
          <button
            onClick={() => { setMastered(true); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mastered
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            已掌握
          </button>
        </div>
      </div>

      {!mastered && records.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {selectedIds.length === records.length && records.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="text-sm">全选</span>
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              已选 {selectedIds.length} / {records.length} 项
            </span>
          </div>
          <Button
            size="sm"
            disabled={selectedIds.length === 0 || batchLoading}
            onClick={handleBatchMastered}
          >
            <CheckCircle className="w-4 h-4" />
            批量标记已掌握
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <Card className="p-12 text-center text-slate-400">加载中...</Card>
        ) : records.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              {mastered ? '暂无已掌握的题目' : '暂无错题，继续保持！'}
            </p>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.id} className={`p-5 transition-colors ${
              !mastered && selectedIds.includes(record.id)
                ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                : ''
            }`}>
              <div className="flex items-start justify-between gap-4">
                {!mastered && (
                  <button
                    onClick={() => toggleSelect(record.id)}
                    className="flex-shrink-0 mt-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {selectedIds.includes(record.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary">{getQuestionTypeLabel(record.question.question_type)}</Badge>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getDifficultyColor(record.question.difficulty)}`}>
                      {getDifficultyLabel(record.question.difficulty)}
                    </span>
                    <Badge variant="danger">错误 {record.wrong_count} 次</Badge>
                    {record.question.category?.name && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {record.question.category.name}
                      </span>
                    )}
                  </div>
                  <div className="markdown-content text-slate-800 dark:text-slate-200 line-clamp-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {record.question.title}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>最近错误：{new Date(record.last_wrong_at).toLocaleDateString()}</span>
                    {record.next_review_at && (
                      <span>下次复习：{new Date(record.next_review_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!mastered && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMastered(record.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      已掌握
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            第 {page} / {totalPages} 页，共 {total} 条
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
