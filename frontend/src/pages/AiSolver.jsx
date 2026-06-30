import { useState, useRef, useEffect } from 'react'
import {
  Send, Bot, User, Trash2, Sparkles, BookOpen,
  X, ChevronRight, Loader2, Lightbulb, CheckCircle
} from 'lucide-react'
import { useAppStore } from '@/store'
import { aiSolverApi, questionApi, categoryApi } from '@/api'

export default function AiSolver() {
  const { showToast } = useAppStore()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '你好！我是你的AI解题助手。你可以向我提问任何题目，我会帮你详细解答。\n\n**支持的功能：**\n- 📚 解答各科题目\n- 💻 编程题代码实现\n- 📝 提供解题思路和步骤\n- 🔍 知识点讲解\n- 📋 从题库导入题目\n\n快把你的题目发给我吧！',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiConfigured, setApiConfigured] = useState(false)
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const [questions, setQuestions] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [pickerLoading, setPickerLoading] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // 检查 API 配置状态
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await aiSolverApi.getConfig()
        if (res.data && res.data.api_key && !res.data.api_key.includes('****')) {
          setApiConfigured(true)
        } else {
          setApiConfigured(false)
        }
      } catch (e) {
        setApiConfigured(false)
      }
    }
    checkConfig()
  }, [])

  // 加载分类
  const loadCategories = async () => {
    try {
      const res = await categoryApi.list()
      if (res.data) {
        setCategories(res.data)
      }
    } catch (e) {
      console.error('加载分类失败:', e)
    }
  }

  // 加载题目
  const loadQuestions = async (categoryId = '') => {
    setPickerLoading(true)
    try {
      const res = await questionApi.list({
        category_id: categoryId || undefined,
        page_size: 50,
        page: 1,
      })
      if (res.data) {
        setQuestions(res.data.items || res.data || [])
      }
    } catch (e) {
      console.error('加载题目失败:', e)
    }
    setPickerLoading(false)
  }

  // 打开选题弹窗
  const openQuestionPicker = async () => {
    setShowQuestionPicker(true)
    await loadCategories()
    await loadQuestions()
  }

  // 选择题目导入
  const selectQuestion = (q) => {
    let text = q.title
    if (q.options && q.options.length > 0) {
      text += '\n\n' + q.options.join('\n')
    }
    setInput(text)
    setShowQuestionPicker(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
    showToast('题目已导入', 'success')
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 演示模式：根据题目关键词匹配不同的解答
  const getDemoAnswer = (questionText) => {
    const q = questionText.toLowerCase()

    // TCP/UDP 相关
    if (q.includes('tcp') || q.includes('udp')) {
      return [
        { delay: 800, content: '🤔 正在分析题目...\n\n' },
        { delay: 1200, content: '📌 题目分析：\n这是一道经典的计算机网络题目，主要考察 TCP 和 UDP 协议的区别。\n\n' },
        { delay: 1500, content: '💡 解题思路：\n我需要从以下几个方面进行对比分析：\n1. 连接性（面向连接 vs 无连接）\n2. 可靠性（可靠传输 vs 不可靠传输）\n3. 传输效率\n4. 适用场景\n\n' },
        { delay: 2000, content: '✅ 详细解答：\n\n**TCP (Transmission Control Protocol)**\n- **面向连接**：通信前需要通过三次握手建立连接\n- **可靠传输**：通过确认应答、重传机制保证数据可靠到达\n- **有序性**：数据按顺序到达，有编号机制\n- **流量控制**：滑动窗口机制\n- **拥塞控制**：慢启动、拥塞避免等算法\n- **适用场景**：文件传输、网页浏览、邮件等需要可靠数据的场景\n\n**UDP (User Datagram Protocol)**\n- **无连接**：发送数据前不需要建立连接\n- **不可靠传输**：不保证数据一定到达，不保证顺序\n- **开销小**：头部只有8字节，传输效率高\n- **支持广播/多播**\n- **适用场景**：视频直播、在线游戏、DNS查询等实时性要求高的场景\n\n' },
        { delay: 1500, content: '📝 总结对比表：\n\n| 特性 | TCP | UDP |\n|------|-----|-----|\n| 连接性 | 面向连接 | 无连接 |\n| 可靠性 | 可靠 | 不可靠 |\n| 顺序性 | 保证顺序 | 不保证 |\n| 头部开销 | 20-60字节 | 8字节 |\n| 速度 | 较慢 | 较快 |\n| 流量控制 | 有 | 无 |\n| 拥塞控制 | 有 | 无 |\n\n🔍 记住：TCP 像打电话（先接通再说话），UDP 像寄信（写好就发，不管收没收到）。' },
      ]
    }

    // 排序算法相关
    if (q.includes('快速排序') || q.includes('冒泡排序') || q.includes('排序')) {
      return [
        { delay: 800, content: '🤔 正在分析题目...\n\n' },
        { delay: 1200, content: '📌 题目分析：\n这是一道数据结构与算法的经典题目，考察排序算法的原理。\n\n' },
        { delay: 1500, content: '💡 解题思路：\n我将以快速排序为例，详细讲解其核心思想和实现步骤。\n\n' },
        { delay: 2000, content: '✅ 详细解答：\n\n**快速排序（Quick Sort）基本思想：**\n采用分治法（Divide and Conquer）策略：\n1. 选择一个基准元素（pivot）\n2. 将数组分成两部分：小于基准的放左边，大于基准的放右边\n3. 递归地对左右两部分进行快速排序\n\n**Python 实现：**\n```python\ndef quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]  # 选择中间元素作为基准\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\n```\n\n' },
        { delay: 1500, content: '📝 复杂度分析：\n\n| 情况 | 时间复杂度 | 空间复杂度 |\n|------|-----------|-----------|\n| 最好 | O(n log n) | O(log n) |\n| 平均 | O(n log n) | O(log n) |\n| 最差 | O(n²) | O(n) |\n\n**优点：**\n- 平均性能好，是实际应用中最快的排序算法之一\n- 原地排序，空间开销小\n- 缓存友好\n\n**缺点：**\n- 最坏情况时间复杂度高（可通过随机化基准避免）\n- 不稳定排序' },
      ]
    }

    // 死锁相关
    if (q.includes('死锁')) {
      return [
        { delay: 800, content: '🤔 正在分析题目...\n\n' },
        { delay: 1200, content: '📌 题目分析：\n这是操作系统中的重要概念，考察死锁的定义、产生条件和避免方法。\n\n' },
        { delay: 1500, content: '💡 解题思路：\n我需要从死锁的定义、产生的四个必要条件、以及预防/避免/检测/恢复四个层面来解答。\n\n' },
        { delay: 2000, content: '✅ 详细解答：\n\n**什么是死锁？**\n死锁是指两个或多个进程在执行过程中，因争夺资源而造成的一种互相等待的现象。若无外力作用，它们都将无法推进下去。\n\n**死锁产生的四个必要条件：**\n1. **互斥条件**：资源在同一时间只能被一个进程占用\n2. **请求与保持条件**：进程已持有至少一个资源，又请求其他被占用的资源\n3. **不剥夺条件**：进程已获得的资源在未使用完前不能被剥夺\n4. **循环等待条件**：存在进程资源的循环等待链\n\n**死锁的处理策略：**\n\n' },
        { delay: 1500, content: '📝 四种处理策略对比：\n\n| 策略 | 思想 | 优点 | 缺点 |\n|------|------|------|------|\n| 死锁预防 | 破坏四个必要条件之一 | 安全、简单 | 资源利用率低 |\n| 死锁避免 | 银行家算法，动态判断 | 比预防宽松 | 需要预知最大资源需求 |\n| 死锁检测 | 允许死锁发生，定期检测 | 资源利用率高 | 恢复代价大 |\n| 死锁恢复 | 检测到死锁后恢复 | 灵活 | 可能造成数据丢失 |\n\n🔍 记忆技巧：死锁四条件 = 互斥 + 请求保持 + 不剥夺 + 循环等待' },
      ]
    }

    // 二分查找相关
    if (q.includes('二分查找') || q.includes('binary') || q.includes('查找')) {
      return [
        { delay: 800, content: '🤔 正在分析题目...\n\n' },
        { delay: 1200, content: '📌 题目分析：\n这是一道经典的查找算法题，考察二分查找的实现和应用。\n\n' },
        { delay: 1500, content: '💡 解题思路：\n二分查找的核心是每次将搜索范围缩小一半，适用于**有序数组**。\n\n' },
        { delay: 2000, content: '✅ 详细解答：\n\n**二分查找（Binary Search）原理：**\n1. 初始化左右指针指向数组两端\n2. 每次取中间元素与目标值比较\n3. 如果相等，找到目标\n4. 如果中间元素 < 目标，在右半部分继续查找\n5. 如果中间元素 > 目标，在左半部分继续查找\n\n**Python 实现：**\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid  # 找到目标，返回索引\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1  # 未找到\n```\n\n' },
        { delay: 1500, content: '📝 复杂度与注意事项：\n\n**时间复杂度：** O(log n)\n**空间复杂度：** O(1)（迭代版）\n\n**前提条件：**\n- 数组必须是**有序**的\n- 支持随机访问（数组）\n\n**常见变体：**\n- 查找第一个等于 target 的位置\n- 查找最后一个等于 target 的位置\n- 查找第一个大于等于 target 的位置（左边界）\n- 查找最后一个小于等于 target 的位置（右边界）\n\n🔍 技巧：注意边界条件 left <= right 还是 left < right，避免死循环和漏查。' },
      ]
    }

    // 默认通用解答
    return [
      { delay: 800, content: '🤔 正在分析题目...\n\n' },
      { delay: 1200, content: '📌 题目分析：\n我来仔细分析一下这道题目。这是一个非常好的问题，涉及到重要的知识点。\n\n' },
      { delay: 1500, content: '💡 解题思路：\n解决这个问题，我们可以从以下几个角度来思考：\n1. 理解题目的核心要求\n2. 回忆相关的知识点和公式\n3. 分析已知条件和未知量\n4. 选择合适的方法进行推导\n\n' },
      { delay: 2000, content: '✅ 详细解答：\n\n让我一步步来解析这道题：\n\n**第一步：理解题意**\n首先仔细阅读题目，明确题目要求我们做什么。注意题目中的关键条件和限制。\n\n**第二步：知识点回顾**\n这道题主要考察的是相关基础知识的掌握程度。需要理解基本概念，并能灵活运用。\n\n**第三步：具体推导**\n根据已知条件，结合相关公式和原理，逐步推导出答案。\n\n**第四步：验证答案**\n得出答案后，要检验是否合理，是否符合题目的所有条件。\n\n' },
      { delay: 1500, content: '📝 总结与拓展：\n\n**核心要点：**\n- 理解基本概念是解题的基础\n- 掌握常见的解题方法和套路\n- 注意题目中的陷阱和细节\n\n**类似题目举一反三：**\n- 可以尝试改变条件，看看结果如何变化\n- 思考是否有其他解法\n- 总结这类题目的通用解题模板\n\n希望这个解答对你有帮助！如果还有其他问题，随时问我 😊' },
    ]
  }

  // 演示模式：模拟解题过程
  const demoSolve = async (questionText) => {
    const stages = getDemoAnswer(questionText)

    let fullContent = ''
    for (const stage of stages) {
      await new Promise(r => setTimeout(r, stage.delay))
      // 逐字输出内容，模拟打字效果
      for (let i = 0; i < stage.content.length; i++) {
        fullContent += stage.content[i]
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].content = fullContent
          return [...newMessages]
        })
        await new Promise(r => setTimeout(r, 8))
      }
    }

    setLoading(false)
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMessage = { role: 'user', content: text }
    const assistantMessage = { role: 'assistant', content: '' }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput('')
    setLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // 如果没有配置 API，使用演示模式
    if (!apiConfigured) {
      demoSolve(text)
      return
    }

    try {
      aiSolverApi.chatStream(
        [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        (chunk) => {
          setMessages((prev) => {
            const newMessages = [...prev]
            const last = newMessages[newMessages.length - 1]
            last.content += chunk
            return [...newMessages]
          })
        },
        () => {
          setLoading(false)
        },
        (err) => {
          setLoading(false)
          setMessages((prev) => {
            const newMessages = [...prev]
            const last = newMessages[newMessages.length - 1]
            last.content = `❌ 出错了：${err}`
            return [...newMessages]
          })
          showToast('请求失败', 'error')
        }
      )
    } catch (err) {
      setLoading(false)
      showToast(err.message || '发送失败', 'error')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
  }

  const clearChat = () => {
    if (!confirm('确定清空所有对话记录？')) return
    setMessages([
      {
        role: 'assistant',
        content: '对话已清空。有什么问题我可以帮你解答？',
      },
    ])
    showToast('已清空对话', 'success')
  }

  const quickQuestions = [
    'TCP和UDP有什么区别？',
    '解释一下快速排序的原理',
    '什么是死锁？怎么避免？',
    '写一个Python二分查找',
  ]

  return (
    <div className="h-full flex flex-col relative">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-slate-900 dark:text-white">AI 解题助手</h1>
              {!apiConfigured && (
                <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                  简洁模式
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {apiConfigured ? '智能解答各类题目' : '正在使用简洁模式体验功能'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openQuestionPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            从题库导入
          </button>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清空对话
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-blue-500'
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}
              >
                <div
                  className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                  }`}
                  style={{ textAlign: 'left' }}
                >
                  {msg.content || (loading && idx === messages.length - 1 ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : '')}
                </div>
              </div>
            </div>
          ))}

          {/* 快捷提问（仅在第一条消息时显示） */}
          {messages.length <= 1 && (
            <div className="ml-11 mt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {apiConfigured ? '试试这些问题：' : '简洁模式，点击体验：'}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-700 focus-within:border-purple-400 dark:focus-within:border-purple-500 transition-colors">
            <button
              onClick={openQuestionPicker}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex-shrink-0"
              title="从题库导入题目"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题，Enter 发送，Shift+Enter 换行..."
              className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 max-h-36"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className={`p-2 rounded-xl transition-all ${
                loading || !input.trim()
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-2">
            {apiConfigured
              ? 'AI 生成的内容仅供参考，请自行核实准确性'
              : '简洁模式下解题不详细？前往设置实现加强解析'}
          </p>
        </div>
      </div>

      {/* 题库选题弹窗 */}
      {showQuestionPicker && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">从题库选择题目</h3>
              <button
                onClick={() => setShowQuestionPicker(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* 分类筛选 */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex gap-2 flex-wrap">
              <button
                onClick={() => { setSelectedCategory(''); loadQuestions('') }}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  !selectedCategory
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                全部
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); loadQuestions(cat.id) }}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 题目列表 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {pickerLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                  暂无题目
                </div>
              ) : (
                questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => selectQuestion(q)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">
                          {q.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                            {q.question_type === 'single' ? '单选' : q.question_type === 'multiple' ? '多选' : q.question_type === 'judge' ? '判断' : '简答'}
                          </span>
                          {q.difficulty && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              q.difficulty === 'easy'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : q.difficulty === 'hard'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {q.difficulty === 'easy' ? '简单' : q.difficulty === 'hard' ? '困难' : '中等'}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
