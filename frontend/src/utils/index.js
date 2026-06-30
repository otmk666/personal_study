import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

export function formatDateTime(date) {
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

export function getDifficultyLabel(difficulty) {
  const map = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }
  return map[difficulty] || difficulty
}

export function getDifficultyColor(difficulty) {
  const map = {
    easy: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
    medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400',
    hard: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
  }
  return map[difficulty] || map.medium
}

export function getQuestionTypeLabel(type) {
  const map = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    short_answer: '简答题',
  }
  return map[type] || type
}

export function getFocusScoreColor(score) {
  if (score >= 90) return 'text-green-600 dark:text-green-400'
  if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export function getFocusScoreBg(score) {
  if (score >= 90) return 'bg-green-500'
  if (score >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}
