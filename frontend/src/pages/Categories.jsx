import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Layers, Tag } from 'lucide-react'
import { categoryApi, tagApi } from '@/api'
import { useAppStore } from '@/store'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Modal from '@/components/Modal'

export default function Categories() {
  const { showToast } = useAppStore()

  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [activeTab, setActiveTab] = useState('category')

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', sort_order: 0 })

  const [showTagModal, setShowTagModal] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [tagForm, setTagForm] = useState({ name: '', color: '#3b82f6' })

  useEffect(() => {
    loadCategories()
    loadTags()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await categoryApi.list()
      setCategories(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const loadTags = async () => {
    try {
      const res = await tagApi.list()
      setTags(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const openAddCategory = () => {
    setEditingCategory(null)
    setCategoryForm({ name: '', description: '', sort_order: 0 })
    setShowCategoryModal(true)
  }

  const openEditCategory = (cat) => {
    setEditingCategory(cat)
    setCategoryForm({ name: cat.name, description: cat.description || '', sort_order: cat.sort_order })
    setShowCategoryModal(true)
  }

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      showToast('请输入分类名称', 'warning')
      return
    }
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory.id, categoryForm)
        showToast('更新成功', 'success')
      } else {
        await categoryApi.create(categoryForm)
        showToast('创建成功', 'success')
      }
      setShowCategoryModal(false)
      loadCategories()
    } catch (err) {
      showToast(err.message || '操作失败', 'error')
    }
  }

  const deleteCategory = async (id) => {
    if (!confirm('确定删除该分类？')) return
    try {
      await categoryApi.delete(id)
      showToast('删除成功', 'success')
      loadCategories()
    } catch (err) {
      showToast(err.message || '删除失败', 'error')
    }
  }

  const openAddTag = () => {
    setEditingTag(null)
    setTagForm({ name: '', color: '#3b82f6' })
    setShowTagModal(true)
  }

  const openEditTag = (tag) => {
    setEditingTag(tag)
    setTagForm({ name: tag.name, color: tag.color })
    setShowTagModal(true)
  }

  const saveTag = async () => {
    if (!tagForm.name.trim()) {
      showToast('请输入标签名称', 'warning')
      return
    }
    try {
      if (editingTag) {
        await tagApi.update(editingTag.id, tagForm)
        showToast('更新成功', 'success')
      } else {
        await tagApi.create(tagForm)
        showToast('创建成功', 'success')
      }
      setShowTagModal(false)
      loadTags()
    } catch (err) {
      showToast(err.message || '操作失败', 'error')
    }
  }

  const deleteTag = async (id) => {
    if (!confirm('确定删除该标签？')) return
    try {
      await tagApi.delete(id)
      showToast('删除成功', 'success')
      loadTags()
    } catch (err) {
      showToast(err.message || '删除失败', 'error')
    }
  }

  const presetColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">分类与标签</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">管理题目分类和标签</p>
        </div>
      </div>

      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 w-fit overflow-hidden">
        <button
          onClick={() => setActiveTab('category')}
          className={`px-6 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'category'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          分类管理
        </button>
        <button
          onClick={() => setActiveTab('tag')}
          className={`px-6 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'tag'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4" />
          标签管理
        </button>
      </div>

      {activeTab === 'category' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={openAddCategory}>
              <Plus className="w-4 h-4" />
              新增分类
            </Button>
          </div>
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">排序</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">描述</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{cat.sort_order}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{cat.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{cat.description || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditCategory(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">暂无分类</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === 'tag' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={openAddTag}>
              <Plus className="w-4 h-4" />
              新增标签
            </Button>
          </div>
          <Card className="p-5">
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">{tag.name}</span>
                  <button
                    onClick={() => openEditTag(tag)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-500 transition-opacity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {tags.length === 0 && (
                <p className="w-full text-center text-slate-400 py-8">暂无标签</p>
              )}
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? '编辑分类' : '新增分类'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>取消</Button>
            <Button onClick={saveCategory}>{editingCategory ? '保存' : '创建'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="分类名称"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="请输入分类名称"
          />
          <Input
            label="描述"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            placeholder="请输入描述（可选）"
          />
          <Input
            label="排序"
            type="number"
            value={categoryForm.sort_order}
            onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) || 0 })}
          />
        </div>
      </Modal>

      <Modal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
        title={editingTag ? '编辑标签' : '新增标签'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowTagModal(false)}>取消</Button>
            <Button onClick={saveTag}>{editingTag ? '保存' : '创建'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="标签名称"
            value={tagForm.name}
            onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
            placeholder="请输入标签名称"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              标签颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setTagForm({ ...tagForm, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    tagForm.color === color ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
