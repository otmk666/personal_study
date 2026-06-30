import { useState, useEffect } from 'react'
import {
  Settings, Database, Palette, Camera, Download, Upload,
  Trash2, Info, Shield, Monitor, Sparkles, Save
} from 'lucide-react'
import { useAppStore, useThemeStore } from '@/store'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { questionApi, aiSolverApi } from '@/api'

export default function SettingsPage({ onOpenMonitor }) {
  const { theme, setTheme } = useThemeStore()
  const { showToast } = useAppStore()
  const [floatBallVisible, setFloatBallVisible] = useState(true)
  const [aiConfig, setAiConfig] = useState({
    api_key: '',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    system_prompt: '',
  })

  // 加载 AI 配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await aiSolverApi.getConfig()
        if (res.data) {
          setAiConfig(res.data)
        }
      } catch (err) {
        console.error('加载AI配置失败:', err)
      }
    }
    loadConfig()
  }, [])

  const saveAiConfig = async () => {
    try {
      const res = await aiSolverApi.saveConfig(aiConfig)
      if (res.data) {
        setAiConfig(res.data)
      }
      showToast('配置保存成功', 'success')
    } catch (err) {
      showToast(err.message || '保存失败', 'error')
    }
  }

  // 检查悬浮球配置
  useEffect(() => {
    const saved = localStorage.getItem('cameraFloatConfig')
    if (saved) {
      const config = JSON.parse(saved)
      setFloatBallVisible(config.visible !== false)
    }
  }, [])

  const toggleFloatBall = (visible) => {
    setFloatBallVisible(visible)
    const saved = localStorage.getItem('cameraFloatConfig')
    const config = saved ? JSON.parse(saved) : {}
    config.visible = visible
    localStorage.setItem('cameraFloatConfig', JSON.stringify(config))
    window.dispatchEvent(new Event('cameraFloatConfigChanged'))
    showToast(visible ? '悬浮球已显示' : '悬浮球已隐藏', 'success')
  }

  const handleExportAll = async () => {
    try {
      showToast('正在导出数据...', 'info')
      const res = await questionApi.exportJson()
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `question-bank-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('导出成功', 'success')
    } catch (err) {
      showToast(err.message || '导出失败', 'error')
    }
  }

  const handleImportAll = () => {
    document.getElementById('backup-import').click()
  }

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('导入会合并到现有题库中，确定继续？')) {
      e.target.value = ''
      return
    }

    try {
      await questionApi.importJson(file)
      showToast('导入成功', 'success')
    } catch (err) {
      showToast(err.message || '导入失败', 'error')
    }
    e.target.value = ''
  }

  const handleClearFocusData = () => {
    if (!confirm('确定清空所有专注度历史记录？此操作不可恢复。')) return
    showToast('已清空专注度数据', 'success')
  }

  const handleDownloadTemplate = async () => {
    try {
      showToast('正在下载模板...', 'info')
      const res = await questionApi.downloadTemplate()
      const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'questions_template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      showToast('模板下载成功', 'success')
    } catch (err) {
      showToast(err.message || '模板下载失败', 'error')
    }
  }

  const handleExportXlsx = async () => {
    try {
      showToast('正在导出 Excel...', 'info')
      const res = await questionApi.exportXlsx()
      const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `questions-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      showToast('导出成功', 'success')
    } catch (err) {
      showToast(err.message || '导出失败', 'error')
    }
  }

  const handleImportXlsx = () => {
    document.getElementById('xlsx-import').click()
  }

  const handleFileXlsxImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('导入会合并到现有题库中，确定继续？')) {
      e.target.value = ''
      return
    }

    try {
      await questionApi.importXlsx(file)
      showToast('导入成功', 'success')
    } catch (err) {
      showToast(err.message || '导入失败', 'error')
    }
    e.target.value = ''
  }

  return (
    <div className="max-w-3xl space-y-6 mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">系统设置</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">管理应用偏好和数据</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">主题设置</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">选择你喜欢的界面主题</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: '浅色模式' },
            { value: 'dark', label: '深色模式' },
            { value: 'system', label: '跟随系统' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                theme === t.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <Camera className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">AI 学习监督</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              基于摄像头的专注度检测，识别分心行为
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={floatBallVisible}
              onChange={(e) => toggleFloatBall(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
          </label>
        </div>

        {/* 实时监督窗口 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 mb-3">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">实时监督窗口</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">打开可移动的摄像头监督窗口，实时查看 YOLO 识别效果和专注度评分</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (onOpenMonitor) {
                onOpenMonitor()
                showToast('实时监督窗口已打开', 'success')
              }
            }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Monitor className="w-4 h-4" />
            打开窗口
          </Button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
          <Shield className="w-4 h-4 inline mr-1 -mt-0.5" />
          所有摄像头画面仅在本地处理，不会上传或存储任何影像数据。点击悬浮球可快速开启/关闭监督窗口，右键可自定义样式。
        </div>
      </Card>

      {/* AI 解题设置 */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">AI 解题设置</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">配置 AI 模型 API（兼容 OpenAI 格式）</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key</label>
            <input
              type="password"
              value={aiConfig.api_key || ''}
              onChange={(e) => setAiConfig({ ...aiConfig, api_key: e.target.value })}
              placeholder="sk-..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API 地址</label>
            <input
              type="text"
              value={aiConfig.base_url || ''}
              onChange={(e) => setAiConfig({ ...aiConfig, base_url: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">兼容 OpenAI 格式的 API，如 DeepSeek、Moonshot、智谱AI 等</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">模型名称</label>
              <input
                type="text"
                value={aiConfig.model || ''}
                onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                placeholder="gpt-3.5-turbo"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">温度</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={aiConfig.temperature || 0.7}
                onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">系统提示词</label>
            <textarea
              value={aiConfig.system_prompt || ''}
              onChange={(e) => setAiConfig({ ...aiConfig, system_prompt: e.target.value })}
              placeholder="你是一个专业的解题助手..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          <Button
            onClick={saveAiConfig}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Save className="w-4 h-4" />
            保存配置
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">数据管理</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">备份和恢复你的数据</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">导出全部数据</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">包含题库、答题记录、专注度数据</p>
            </div>
            <Button size="sm" onClick={handleExportAll}>
              <Download className="w-4 h-4" />
              导出
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">从备份文件导入</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">导入 JSON 格式的备份数据</p>
            </div>
            <input
              id="backup-import"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileImport}
            />
            <Button size="sm" variant="outline" onClick={handleImportAll}>
              <Upload className="w-4 h-4" />
              导入
            </Button>
          </div>

          {/* Excel 导入导出 */}
          <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Excel 批量导入/导出</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">使用 xlsx 格式批量管理题库</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate}>
                <Download className="w-4 h-4" />
                下载模板
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportXlsx}>
                <Download className="w-4 h-4" />
                导出 Excel
              </Button>
              <Button size="sm" variant="outline" onClick={handleImportXlsx}>
                <Upload className="w-4 h-4" />
                导入 Excel
              </Button>
              <input
                id="xlsx-import"
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileXlsxImport}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">清空专注度数据</p>
              <p className="text-xs text-red-500 dark:text-red-400/70">删除所有专注度历史记录</p>
            </div>
            <Button size="sm" variant="danger" onClick={handleClearFocusData}>
              <Trash2 className="w-4 h-4" />
              清空
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
            <Info className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">关于</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">个人题库系统 v3.0.2</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          一款面向个人备考、知识巩固的本地化题库工具。支持自主录入题目、多模式刷题练习、智能错题复习、学习数据可视化，以及基于 AI 的学习监督能力。
        </p>
        <p> </p>
        <p className="text-sm text-slate-700 dark:text-slate-500 text-center italic"> Created by HGM on 2026. </p>
        <p className="text-sm text-slate-500 dark:text-slate-500 text-center leading-relaxed"> Thanks for your visit! </p>
      </Card>
    </div>
  )
}
