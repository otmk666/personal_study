import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    // blob 类型响应直接返回（文件下载）
    if (response.config.responseType === 'blob') {
      return response.data
    }
    const res = response.data
    if (res.code !== 200) {
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res
  },
  (error) => {
    console.error('API Error:', error.message)
    return Promise.reject(error)
  }
)

export const questionApi = {
  list: (params) => api.get('/questions', { params }),
  get: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  batchDelete: (ids) => api.post('/questions/batch-delete', ids),
  copy: (id) => api.post(`/questions/${id}/copy`),
  importJson: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/questions/import/json', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  importXlsx: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/questions/import/xlsx', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  exportJson: (params) => api.get('/questions/export/json', { params, responseType: 'blob' }),
  exportMarkdown: (params) => api.get('/questions/export/markdown', { params }),
  exportXlsx: (params) => api.get('/questions/export/xlsx', { params, responseType: 'blob' }),
  downloadTemplate: () => api.get('/questions/template/xlsx', { responseType: 'blob' }),
}

export const categoryApi = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

export const tagApi = {
  list: () => api.get('/tags'),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`),
}

export const practiceApi = {
  createSession: (data) => api.post('/practice/session', data),
  submitAnswer: (data) => api.post('/practice/answer', data),
  getSession: (id) => api.get(`/practice/session/${id}`),
  updateSession: (id, data) => api.put(`/practice/session/${id}`, data),
}

export const wrongApi = {
  list: (params) => api.get('/wrong', { params }),
  markMastered: (id) => api.post(`/wrong/${id}/mastered`),
  batchMastered: (ids) => api.post('/wrong/batch-mastered', { ids }),
  todayCount: () => api.get('/wrong/today-count'),
}

export const favoriteApi = {
  listFolders: () => api.get('/favorites/folders'),
  createFolder: (data) => api.post('/favorites/folders', data),
  updateFolder: (id, data) => api.put(`/favorites/folders/${id}`, data),
  deleteFolder: (id) => api.delete(`/favorites/folders/${id}`),
  list: (params) => api.get('/favorites', { params }),
  check: (id) => api.get(`/favorites/check/${id}`),
  add: (id, folderId) => api.post(`/favorites/${id}`, null, { params: { folder_id: folderId } }),
  remove: (id) => api.delete(`/favorites/${id}`),
}

export const statsApi = {
  dashboard: () => api.get('/stats/dashboard'),
  daily: (days) => api.get('/stats/daily', { params: { days } }),
  categories: () => api.get('/stats/categories'),
  focus: (days) => api.get('/stats/focus', { params: { days } }),
}

export const focusApi = {
  addRecord: (data) => api.post('/focus/record', data),
  records: (params) => api.get('/focus/records', { params }),
}

export const aiApi = {
  status: () => api.get('/ai/status'),
  detect: (sessionId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/ai/detect', formData, {
      params: { session_id: sessionId },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  detectBase64: (data) => api.post('/ai/detect-base64', data),
  toggle: (enabled) => api.post('/ai/toggle', null, { params: { enabled } }),
}

export const aiSolverApi = {
  getConfig: () => api.get('/ai-solver/config'),
  saveConfig: (data) => api.post('/ai-solver/config', data),
  chat: (messages) => api.post('/ai-solver/chat', { messages, stream: false }),
  chatStream: (messages, onMessage, onDone, onError) => {
    const eventSource = null
    // 使用 fetch + ReadableStream 实现 SSE
    fetch('/api/ai-solver/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, stream: true }),
    }).then(response => {
      if (!response.ok) {
        throw new Error('请求失败')
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            onDone && onDone()
            return
          }
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                onDone && onDone()
                return
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.error) {
                  onError && onError(parsed.error)
                  return
                }
                if (parsed.content) {
                  onMessage && onMessage(parsed.content)
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
          read()
        }).catch(err => {
          onError && onError(err.message)
        })
      }
      read()
    }).catch(err => {
      onError && onError(err.message)
    })
  },
}

export default api
