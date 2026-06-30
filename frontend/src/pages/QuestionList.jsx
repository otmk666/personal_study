import { useState, useEffect } from 'react'
import {
  Plus, Search, Filter, Edit2, Trash2, Copy, Download, Upload,
  ChevronLeft, ChevronRight, X, Check
} from 'lucide-react'
import { questionApi, categoryApi, tagApi } from '@/api'
import { useAppStore } from '@/store'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import {
  getDifficultyLabel, getDifficultyColor, getQuestionTypeLabel
} from '@/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function QuestionList() {
  const { showToast } = useAppStore()
  const [questions, setQuestions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    keyword: '',
    question_type: '',
    category_id: '',
    difficulty: '',
  })
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [formData, setFormData] = useState({
    question_type: 'single',
    title: '',
    options: ['', '', '', ''],
    answer: [],
    analysis: '',
    difficulty: 'medium',
    category_id: null,
    tag_ids: [],
  })

  const [selectedIds, setSelectedIds] = useState([])
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    loadCategoriesAndTags()
    loadQuestions()
  }, [page])

  const loadCategoriesAndTags = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        categoryApi.list(),
        tagApi.list(),
      ])
      setCategories(catRes.data || [])
      setTags(tagRes.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      }
      Object.keys(params).forEach(k => {
        if (!params[k] && params[k] !== 0) delete params[k]
      })
      const res = await questionApi.list(params)
      setQuestions(res.data?.items || [])
      setTotal(res.data?.total || 0)
    } catch (err) {
      showToast(err.message || '加载失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadQuestions()
  }

  const handleReset = () => {
    setFilters({
      keyword: '',
      question_type: '',
      category_id: '',
      difficulty: '',
    })
    setPage(1)
    setTimeout(loadQuestions, 0)
  }

  const openAddModal = () => {
    setEditingQuestion(null)
    setFormData({
      question_type: 'single',
      title: '',
      options: ['', '', '', ''],
      answer: [],
      analysis: '',
      difficulty: 'medium',
      category_id: null,
      tag_ids: [],
    })
    setShowModal(true)
  }

  const openEditModal = (q) => {
    setEditingQuestion(q)
    setFormData({
      question_type: q.question_type,
      title: q.title,
      options: q.options?.length ? [...q.options] : ['', '', '', ''],
      answer: Array.isArray(q.answer) ? [...q.answer] : [q.answer],
      analysis: q.analysis || '',
      difficulty: q.difficulty,
      category_id: q.category_id,
      tag_ids: q.tags?.map(t => t.id) || [],
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToast('请输入题干', 'warning')
      return
    }
    if (formData.answer.length === 0) {
      showToast('请设置正确答案', 'warning')
      return
    }

    try {
      const submitData = { ...formData }
      if (submitData.question_type === 'judge') {
        submitData.options = []
      }
      if (submitData.question_type === 'short_answer') {
        submitData.options = []
      }

      if (editingQuestion) {
        await questionApi.update(editingQuestion.id, submitData)
        showToast('更新成功', 'success')
      } else {
        await questionApi.create(submitData)
        showToast('创建成功', 'success')
      }
      setShowModal(false)
      loadQuestions()
    } catch (err) {
      showToast(err.message || '操作失败', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这道题目吗？')) return
    try {
      await questionApi.delete(id)
      showToast('删除成功', 'success')
      loadQuestions()
    } catch (err) {
      showToast(err.message || '删除失败', 'error')
    }
  }

  const handleCopy = async (id) => {
    try {
      await questionApi.copy(id)
      showToast('复制成功', 'success')
      loadQuestions()
    } catch (err) {
      showToast(err.message || '复制失败', 'error')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 道题目吗？`)) return
    try {
      await questionApi.batchDelete(selectedIds)
      showToast('批量删除成功', 'success')
      setSelectedIds([])
      loadQuestions()
    } catch (err) {
      showToast(err.message || '删除失败', 'error')
    }
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const toggleAnswer = (value) => {
    let newAnswer
    if (formData.question_type === 'single' || formData.question_type === 'judge') {
      newAnswer = [value]
    } else {
      if (formData.answer.includes(value)) {
        newAnswer = formData.answer.filter(a => a !== value)
      } else {
        newAnswer = [...formData.answer, value]
      }
    }
    setFormData({ ...formData, answer: newAnswer })
  }

  const toggleTag = (tagId) => {
    const tagIds = formData.tag_ids.includes(tagId)
      ? formData.tag_ids.filter(id => id !== tagId)
      : [...formData.tag_ids, tagId]
    setFormData({ ...formData, tag_ids: tagIds })
  }

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] })
  }

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index)
    setFormData({ ...formData, options: newOptions })
  }

  const totalPages = Math.ceil(total / pageSize)

  const typeOptions = [
    { value: '', label: '全部题型' },
    { value: 'single', label: '单选题' },
    { value: 'multiple', label: '多选题' },
    { value: 'judge', label: '判断题' },
    { value: 'short_answer', label: '简答题' },
  ]

  const difficultyOptions = [
    { value: '', label: '全部难度' },
    { value: 'easy', label: '简单' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困难' },
  ]

  const categoryOptions = [
    { value: '', label: '全部分类' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">题库管理</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">共 {total} 道题目</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilter(!showFilter)}>
            <Filter className="w-4 h-4" />
            筛选
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-file').click()}>
            <Upload className="w-4 h-4" />
            导入
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                await questionApi.importJson(file)
                showToast('导入成功', 'success')
                loadQuestions()
              } catch (err) {
                showToast(err.message || '导入失败', 'error')
              }
              e.target.value = ''
            }}
          />
          <Button variant="outline" onClick={async () => {
            try {
              const res = await questionApi.exportJson()
              const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'questions.json'
              a.click()
              URL.revokeObjectURL(url)
            } catch (err) {
              showToast(err.message || '导出失败', 'error')
            }
          }}>
            <Download className="w-4 h-4" />
            导出
          </Button>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            新增题目
          </Button>
        </div>
      </div>

      {showFilter && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="搜索题目关键词..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              prefix={<Search className="w-4 h-4" />}
            />
            <Select
              options={typeOptions}
              value={filters.question_type}
              onChange={(e) => setFilters({ ...filters, question_type: e.target.value })}
            />
            <Select
              options={categoryOptions}
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            />
            <Select
              options={difficultyOptions}
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleReset}>重置</Button>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </Card>
      )}

      {selectedIds.length > 0 && (
        <Card className="p-3 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            已选择 {selectedIds.length} 道题目
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              取消选择
            </Button>
            <Button variant="danger" size="sm" onClick={handleBatchDelete}>
              <Trash2 className="w-4 h-4" />
              批量删除
            </Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === questions.length && questions.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(questions.map(q => q.id))
                      } else {
                        setSelectedIds([])
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">题干</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">题型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">分类</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">难度</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">标签</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    加载中...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    暂无题目
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(q.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, q.id])
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== q.id))
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">#{q.id}</td>
                    <td className="px-4 py-3 max-w-md">
                      <div className="text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                        {q.title}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="primary">{getQuestionTypeLabel(q.question_type)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {q.category?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getDifficultyColor(q.difficulty)}`}>
                        {getDifficultyLabel(q.difficulty)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {q.tags?.slice(0, 3).map(tag => (
                          <span
                            key={tag.id}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {q.tags?.length > 3 && (
                          <span className="text-xs text-slate-400">+{q.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCopy(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              第 {page} / {totalPages} 页，共 {total} 条
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingQuestion ? '编辑题目' : '新增题目'}
        width="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingQuestion ? '保存' : '创建'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="题目类型"
            value={formData.question_type}
            onChange={(e) => {
              const type = e.target.value
              setFormData({
                ...formData,
                question_type: type,
                answer: [],
                options: type === 'single' || type === 'multiple'
                  ? (formData.options.length > 0 ? formData.options : ['', '', '', ''])
                  : [],
              })
            }}
            options={[
              { value: 'single', label: '单选题' },
              { value: 'multiple', label: '多选题' },
              { value: 'judge', label: '判断题' },
              { value: 'short_answer', label: '简答题' },
            ]}
          />

          <Textarea
            label="题目内容（支持 Markdown）"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="请输入题目内容..."
            className="min-h-[100px]"
          />

          {(formData.question_type === 'single' || formData.question_type === 'multiple') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                选项设置
              </label>
              {formData.options.map((opt, index) => {
                const letter = String.fromCharCode(65 + index)
                return (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAnswer(letter)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                        formData.answer.includes(letter)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {letter}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`选项 ${letter}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus className="w-4 h-4" />
                添加选项
              </Button>
            </div>
          )}

          {formData.question_type === 'judge' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                正确答案
              </label>
              <div className="flex gap-4">
                {['正确', '错误'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setFormData({ ...formData, answer: [val] })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      formData.answer[0] === val
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {formData.answer[0] === val && <Check className="w-4 h-4" />}
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.question_type === 'short_answer' && (
            <Textarea
              label="参考答案"
              value={formData.answer[0] || ''}
              onChange={(e) => setFormData({ ...formData, answer: [e.target.value] })}
              placeholder="请输入参考答案..."
              className="min-h-[100px]"
            />
          )}

          <Textarea
            label="答案解析（支持 Markdown，可选）"
            value={formData.analysis}
            onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
            placeholder="请输入答案解析..."
            className="min-h-[80px]"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="难度等级"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              options={[
                { value: 'easy', label: '简单' },
                { value: 'medium', label: '中等' },
                { value: 'hard', label: '困难' },
              ]}
            />
            <Select
              label="所属分类"
              value={formData.category_id || ''}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : null })}
              options={[
                { value: '', label: '未分类' },
                ...categories.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              标签
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    formData.tag_ids.includes(tag.id)
                      ? 'border-transparent text-white'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                  }`}
                  style={formData.tag_ids.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
