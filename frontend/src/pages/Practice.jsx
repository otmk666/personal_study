import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle,
  Star, Eye, EyeOff, Flag, Shuffle, BookOpen, AlertCircle, Zap
} from 'lucide-react'
import { practiceApi, categoryApi, tagApi, favoriteApi } from '@/api'
import { useAppStore } from '@/store'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Select from '@/components/Select'
import Input from '@/components/Input'
import Badge from '@/components/Badge'
import {
  formatTime, getDifficultyLabel, getDifficultyColor,
  getQuestionTypeLabel, getFocusScoreColor, getFocusScoreBg
} from '@/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import FocusPanel from '@/components/FocusPanel'

export default function Practice() {
  const navigate = useNavigate()
  const { showToast } = useAppStore()

  const [stage, setStage] = useState('setup')
  const [config, setConfig] = useState({
    mode: 'practice',
    question_count: 10,
    category_id: '',
    difficulty: '',
    tag_ids: [],
    source: 'all',
    shuffle: true,
  })

  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [submitted, setSubmitted] = useState({})
  const [showAnalysis, setShowAnalysis] = useState({})
  const [favorites, setFavorites] = useState({})

  const [timeSpent, setTimeSpent] = useState(0)
  const [questionTime, setQuestionTime] = useState(0)
  const timerRef = useRef(null)
  const questionTimerRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)

  const [focusEnabled, setFocusEnabled] = useState(false)
  const [showFocusPanel, setShowFocusPanel] = useState(true)
  const [focusScore, setFocusScore] = useState(100)
  const [focusMinutes, setFocusMinutes] = useState(0)

  useEffect(() => {
    loadCategoriesAndTags()
    return () => {
      clearInterval(timerRef.current)
      clearInterval(questionTimerRef.current)
    }
  }, [])

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

  const startPractice = async () => {
    try {
      setLoading(true)
      const res = await practiceApi.createSession(config)
      setSessionId(res.data.session_id)
      setQuestions(res.data.questions || [])
      setCurrentIndex(0)
      setUserAnswers({})
      setSubmitted({})
      setShowAnalysis({})
      setTimeSpent(0)
      setQuestionTime(0)
      setStage('practice')

      timerRef.current = setInterval(() => {
        setTimeSpent(t => t + 1)
      }, 1000)
      questionTimerRef.current = setInterval(() => {
        setQuestionTime(t => t + 1)
      }, 1000)

      if (res.data.questions?.length === 0) {
        showToast('没有符合条件的题目', 'warning')
      }
    } catch (err) {
      showToast(err.message || '创建练习失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentIndex]

  const selectAnswer = (value) => {
    if (submitted[currentIndex]) return

    let newAnswer
    if (currentQuestion.question_type === 'single' || currentQuestion.question_type === 'judge') {
      newAnswer = [value]
    } else {
      const current = userAnswers[currentIndex] || []
      if (current.includes(value)) {
        newAnswer = current.filter(a => a !== value)
      } else {
        newAnswer = [...current, value]
      }
    }
    setUserAnswers({ ...userAnswers, [currentIndex]: newAnswer })
  }

  const submitAnswer = async () => {
    const answer = userAnswers[currentIndex] || []
    if (answer.length === 0) {
      showToast('请选择答案', 'warning')
      return
    }

    const correct = checkAnswer(answer, currentQuestion.answer)

    try {
      await practiceApi.submitAnswer({
        question_id: currentQuestion.id,
        session_id: sessionId,
        is_correct: correct,
        user_answer: answer,
        time_spent: questionTime,
        mode: config.mode,
      })
    } catch (err) {
      console.error(err)
    }

    setSubmitted({ ...submitted, [currentIndex]: true })
    setShowAnalysis({ ...showAnalysis, [currentIndex]: true })

    if (config.mode === 'practice') {
      if (correct) {
        showToast('回答正确！', 'success')
      } else {
        showToast('回答错误', 'error')
      }
    }
  }

  const checkAnswer = (userAns, correctAns) => {
    if (!userAns || !correctAns) return false
    if (userAns.length !== correctAns.length) return false
    const sortedUser = [...userAns].sort()
    const sortedCorrect = [...correctAns].sort()
    return sortedUser.every((v, i) => v === sortedCorrect[i])
  }

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setQuestionTime(0)
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const finishExam = () => {
    clearInterval(timerRef.current)
    clearInterval(questionTimerRef.current)
    setStage('result')

    practiceApi.updateSession(sessionId, {
      status: 'finished',
      total_time: timeSpent,
    }).catch(console.error)
  }

  const toggleFavorite = async () => {
    if (!currentQuestion) return
    const isFav = favorites[currentQuestion.id]
    try {
      if (isFav) {
        await favoriteApi.remove(currentQuestion.id)
        setFavorites({ ...favorites, [currentQuestion.id]: false })
        showToast('已取消收藏', 'success')
      } else {
        await favoriteApi.add(currentQuestion.id)
        setFavorites({ ...favorites, [currentQuestion.id]: true })
        showToast('收藏成功', 'success')
      }
    } catch (err) {
      showToast(err.message || '操作失败', 'error')
    }
  }

  const correctCount = questions.filter((q, i) => {
    if (!submitted[i]) return false
    return checkAnswer(userAnswers[i] || [], q.answer)
  }).length

  const answeredCount = Object.keys(submitted).length

  if (stage === 'setup') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">开始刷题</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">自定义你的练习范围和模式</p>
        </div>

        <Card className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              练习模式
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setConfig({ ...config, mode: 'practice' })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  config.mode === 'practice'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">练习模式</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  答完单题立即展示答案与解析，适合边学边练
                </p>
              </button>
              <button
                onClick={() => setConfig({ ...config, mode: 'exam' })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  config.mode === 'exam'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                    <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">考试模式</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  批量作答后统一判分，模拟真实考试场景
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="题目数量"
              type="number"
              min={1}
              max={200}
              value={config.question_count}
              onChange={(e) => setConfig({ ...config, question_count: Number(e.target.value) || 10 })}
            />
            <Select
              label="题目来源"
              value={config.source}
              onChange={(e) => setConfig({ ...config, source: e.target.value })}
              options={[
                { value: 'all', label: '全部题目' },
                { value: 'wrong', label: '错题本' },
                { value: 'favorite', label: '收藏夹' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="分类筛选"
              value={config.category_id}
              onChange={(e) => setConfig({ ...config, category_id: e.target.value })}
              options={[
                { value: '', label: '全部分类' },
                ...categories.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              label="难度筛选"
              value={config.difficulty}
              onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
              options={[
                { value: '', label: '全部难度' },
                { value: 'easy', label: '简单' },
                { value: 'medium', label: '中等' },
                { value: 'hard', label: '困难' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              标签筛选
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const selected = config.tag_ids.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      const tagIds = selected
                        ? config.tag_ids.filter(id => id !== tag.id)
                        : [...config.tag_ids, tag.id]
                      setConfig({ ...config, tag_ids: tagIds })
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? 'border-transparent text-white'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                    style={selected ? { backgroundColor: tag.color } : {}}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shuffle"
              checked={config.shuffle}
              onChange={(e) => setConfig({ ...config, shuffle: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="shuffle" className="text-sm text-slate-600 dark:text-slate-300">
              随机打乱题目顺序
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="focusMode"
              checked={focusEnabled}
              onChange={(e) => setFocusEnabled(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="focusMode" className="text-sm text-slate-600 dark:text-slate-300">
              开启学习监督（摄像头专注度检测）
            </label>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={startPractice}
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Play className="w-5 h-5" />
                开始练习
              </>
            )}
          </Button>
        </Card>
      </div>
    )
  }

  if (stage === 'result') {
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{score}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">练习完成！</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            共 {questions.length} 题，答对 {correctCount} 题
          </p>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">正确率</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{score}%</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">用时</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatTime(timeSpent)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">错题数</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{questions.length - correctCount}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
              完成
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setStage('setup')}>
              返回设置
            </Button>
            <Button className="flex-1" onClick={startPractice}>
              <Shuffle className="w-4 h-4" />
              再来一组
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">答题详情</h3>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const isCorrect = checkAnswer(userAnswers[i] || [], q.answer)
              return (
                <div
                  key={q.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => {
                    setCurrentIndex(i)
                    setStage('practice')
                    setShowAnalysis({ ...showAnalysis, [i]: true })
                    setSubmitted({ ...submitted, [i]: true })
                  }}
                >
                  <span className="text-sm text-slate-400 w-6">{i + 1}.</span>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">
                    {q.title}
                  </span>
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-20 text-slate-500">
        没有题目
        <Button className="mt-4" onClick={() => setStage('setup')}>返回设置</Button>
      </div>
    )
  }

  const isSubmitted = submitted[currentIndex]
  const currentAnswer = userAnswers[currentIndex] || []
  const isCorrect = isSubmitted && checkAnswer(currentAnswer, currentQuestion.answer)

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="primary">{getQuestionTypeLabel(currentQuestion.question_type)}</Badge>
            <span className={`text-xs font-medium px-2 py-1 rounded ${getDifficultyColor(currentQuestion.difficulty)}`}>
              {getDifficultyLabel(currentQuestion.difficulty)}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {currentQuestion.category?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(timeSpent)}</span>
            </div>
            <button
              onClick={toggleFavorite}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Star className={`w-5 h-5 ${favorites[currentQuestion.id] ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>第 {currentIndex + 1} / {questions.length} 题</span>
          <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-6">
          <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
            <div className="markdown-content text-slate-900 dark:text-slate-100 text-lg leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentQuestion.title}
              </ReactMarkdown>
            </div>
          </div>

          {(currentQuestion.question_type === 'single' || currentQuestion.question_type === 'multiple') && (
            <div className="space-y-3">
              {currentQuestion.options?.map((opt, index) => {
                const letter = String.fromCharCode(65 + index)
                const isSelected = currentAnswer.includes(letter)
                const isCorrectOption = currentQuestion.answer.includes(letter)
                const showResult = isSubmitted

                let optionClass = 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                if (showResult) {
                  if (isCorrectOption) {
                    optionClass = 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  } else if (isSelected && !isCorrectOption) {
                    optionClass = 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  }
                } else if (isSelected) {
                  optionClass = 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }

                return (
                  <button
                    key={index}
                    onClick={() => selectAnswer(letter)}
                    disabled={isSubmitted && config.mode === 'practice'}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${optionClass}`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      showResult && isCorrectOption
                        ? 'bg-green-500 text-white'
                        : showResult && isSelected && !isCorrectOption
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {letter}
                    </span>
                    <span className="flex-1 text-slate-700 dark:text-slate-200 pt-0.5">
                      {opt}
                    </span>
                    {showResult && isCorrectOption && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {currentQuestion.question_type === 'judge' && (
            <div className="flex gap-4">
              {['正确', '错误'].map((val) => (
                <button
                  key={val}
                  onClick={() => selectAnswer(val)}
                  disabled={isSubmitted && config.mode === 'practice'}
                  className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                    isSubmitted && currentQuestion.answer[0] === val
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : isSubmitted && currentAnswer[0] === val && currentQuestion.answer[0] !== val
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : currentAnswer[0] === val
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  <span className="text-lg font-medium text-slate-800 dark:text-slate-200">{val}</span>
                </button>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'short_answer' && (
            <div>
              <textarea
                value={currentAnswer[0] || ''}
                onChange={(e) => setUserAnswers({
                  ...userAnswers,
                  [currentIndex]: [e.target.value]
                })}
                disabled={isSubmitted}
                placeholder="请输入你的答案..."
                className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          )}

          {(showAnalysis[currentIndex] || (config.mode === 'practice' && isSubmitted)) && currentQuestion.analysis && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-blue-500 rounded-full" />
                <h4 className="font-semibold text-slate-900 dark:text-white">答案解析</h4>
              </div>
              <div className="markdown-content text-slate-600 dark:text-slate-300 text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentQuestion.analysis}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            上一题
          </Button>

          <div className="flex gap-2">
            {!isSubmitted ? (
              <Button onClick={submitAnswer}>
                <CheckCircle className="w-4 h-4" />
                提交答案
              </Button>
            ) : config.mode === 'exam' ? (
              <Button variant="outline" onClick={() => setShowAnalysis({
                ...showAnalysis,
                [currentIndex]: !showAnalysis[currentIndex]
              })}>
                {showAnalysis[currentIndex] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAnalysis[currentIndex] ? '隐藏解析' : '查看解析'}
              </Button>
            ) : null}
          </div>

          <div className="flex gap-2">
            {config.mode === 'exam' && currentIndex === questions.length - 1 && answeredCount === questions.length && (
              <Button variant="success" onClick={finishExam}>
                <Flag className="w-4 h-4" />
                交卷
              </Button>
            )}
            {config.mode === 'practice' && currentIndex === questions.length - 1 && isSubmitted && (
              <Button variant="success" onClick={finishExam}>
                <CheckCircle className="w-4 h-4" />
                完成练习
              </Button>
            )}
            <Button
              onClick={nextQuestion}
              disabled={currentIndex === questions.length - 1}
            >
              下一题
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          {questions.map((q, i) => {
            const s = submitted[i]
            const c = s && checkAnswer(userAnswers[i] || [], q.answer)
            let bg = 'bg-slate-200 dark:bg-slate-700'
            if (s) {
              bg = c ? 'bg-green-500' : 'bg-red-500'
            }
            if (i === currentIndex) {
              bg = 'bg-blue-500'
            }
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium text-white transition-all ${bg}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {focusEnabled && showFocusPanel && (
        <FocusPanel
          sessionId={sessionId}
          onClose={() => setShowFocusPanel(false)}
          score={focusScore}
          minutes={focusMinutes}
        />
      )}
    </div>
  )
}
