import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Plus, ChevronLeft, ChevronRight, Trash2, FolderOpen } from 'lucide-react'
import { favoriteApi } from '@/api'
import { useAppStore } from '@/store'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import Input from '@/components/Input'
import Badge from '@/components/Badge'
import { getDifficultyLabel, getDifficultyColor, getQuestionTypeLabel } from '@/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function Favorites() {
  const navigate = useNavigate()
  const { showToast } = useAppStore()

  const [folders, setFolders] = useState([])
  const [activeFolder, setActiveFolder] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  const [showFolderModal, setShowFolderModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [folderName, setFolderName] = useState('')
  const [folderDesc, setFolderDesc] = useState('')

  useEffect(() => {
    loadFolders()
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [page, activeFolder])

  const loadFolders = async () => {
    try {
      const res = await favoriteApi.listFolders()
      setFolders(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const res = await favoriteApi.list({
        page,
        page_size: pageSize,
        folder_id: activeFolder || undefined,
      })
      setFavorites(res.data?.items || [])
      setTotal(res.data?.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openAddFolder = () => {
    setEditingFolder(null)
    setFolderName('')
    setFolderDesc('')
    setShowFolderModal(true)
  }

  const handleSaveFolder = async () => {
    if (!folderName.trim()) {
      showToast('请输入收藏夹名称', 'warning')
      return
    }
    try {
      if (editingFolder) {
        await favoriteApi.updateFolder(editingFolder.id, { name: folderName, description: folderDesc })
        showToast('更新成功', 'success')
      } else {
        await favoriteApi.createFolder({ name: folderName, description: folderDesc })
        showToast('创建成功', 'success')
      }
      setShowFolderModal(false)
      loadFolders()
    } catch (err) {
      showToast(err.message || '操作失败', 'error')
    }
  }

  const handleDeleteFolder = async (id) => {
    if (!confirm('确定删除该收藏夹？')) return
    try {
      await favoriteApi.deleteFolder(id)
      showToast('删除成功', 'success')
      if (activeFolder === id) setActiveFolder(null)
      loadFolders()
    } catch (err) {
      showToast(err.message || '删除失败', 'error')
    }
  }

  const handleRemoveFavorite = async (questionId) => {
    try {
      await favoriteApi.remove(questionId)
      showToast('已取消收藏', 'success')
      loadFavorites()
    } catch (err) {
      showToast(err.message || '操作失败', 'error')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">收藏夹</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">共收藏 {total} 道题目</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openAddFolder}>
            <Plus className="w-4 h-4" />
            新建收藏夹
          </Button>
          <Button onClick={() => navigate('/practice')}>
            开始练习
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0 space-y-2">
          <button
            onClick={() => setActiveFolder(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeFolder === null
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star className="w-4 h-4" />
            全部收藏
          </button>

          {folders.map((folder) => (
            <div key={folder.id} className="group">
              <div className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeFolder === folder.id
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
                <button
                  onClick={() => setActiveFolder(folder.id)}
                  className="flex items-center gap-3 flex-1 text-left font-medium text-slate-600 dark:text-slate-300"
                >
                  <FolderOpen className="w-4 h-4" />
                  {folder.name}
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-3">
          {loading ? (
            <Card className="p-12 text-center text-slate-400">加载中...</Card>
          ) : favorites.length === 0 ? (
            <Card className="p-12 text-center">
              <Star className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">暂无收藏的题目</p>
            </Card>
          ) : (
            favorites.map((fav) => (
              <Card key={fav.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="primary">{getQuestionTypeLabel(fav.question.question_type)}</Badge>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getDifficultyColor(fav.question.difficulty)}`}>
                        {getDifficultyLabel(fav.question.difficulty)}
                      </span>
                      {fav.question.category?.name && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {fav.question.category.name}
                        </span>
                      )}
                    </div>
                    <div className="markdown-content text-slate-800 dark:text-slate-200 line-clamp-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {fav.question.title}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(fav.question.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
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
      </div>

      <Modal
        open={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        title={editingFolder ? '编辑收藏夹' : '新建收藏夹'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowFolderModal(false)}>取消</Button>
            <Button onClick={handleSaveFolder}>{editingFolder ? '保存' : '创建'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="收藏夹名称"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="请输入收藏夹名称"
          />
          <Input
            label="描述（可选）"
            value={folderDesc}
            onChange={(e) => setFolderDesc(e.target.value)}
            placeholder="请输入描述"
          />
        </div>
      </Modal>
    </div>
  )
}
