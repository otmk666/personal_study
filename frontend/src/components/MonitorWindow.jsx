import { useState, useEffect, useRef } from 'react'
import { X, Camera, CameraOff, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react'
import { aiApi } from '@/api'

export default function MonitorWindow({ onClose }) {
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraStarting, setCameraStarting] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [focusScore, setFocusScore] = useState(100)
  const [behavior, setBehavior] = useState('等待检测...')
  const [detections, setDetections] = useState([])
  const [error, setError] = useState('')
  const [showScoreRules, setShowScoreRules] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const canvasDrawRef = useRef(null)
  const detectIntervalRef = useRef(null)
  const windowRef = useRef(null)

  // 启动摄像头
  const startCamera = async () => {
    try {
      setCameraStarting(true)
      setError('')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false,
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // 等待视频元数据加载
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(() => {
              setCameraOn(true)
              setCameraStarting(false)
              startDetection()
              resolve()
            }).catch(err => {
              console.error('Play error:', err)
              setCameraOn(true)
              setCameraStarting(false)
              startDetection()
              resolve()
            })
          }
          // 如果已经加载过了
          if (videoRef.current.readyState >= 1) {
            videoRef.current.onloadedmetadata?.()
          }
        })
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraStarting(false)
      setError('无法访问摄像头，请检查权限设置或摄像头是否被其他应用占用')
    }
  }

  // 停止摄像头
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
    }
    setCameraOn(false)
    stopDetection()
  }

  // 开始检测
  const startDetection = () => {
    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return

      const ctx = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth || 640
      canvasRef.current.height = videoRef.current.videoHeight || 480
      ctx.drawImage(videoRef.current, 0, 0)

      try {
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.7)
        const base64 = imageData.split(',')[1]

        const res = await aiApi.detectBase64({
          session_id: 'monitor-' + Date.now(),
          image: base64,
        })

        if (res.data) {
          setFocusScore(res.data.focus_score || 100)
          
          // 行为类型映射
          const behaviorMap = {
            'focused': '✅ 专注学习',
            'using_phone': '📱 玩手机',
            'sleeping': '😴 趴桌睡觉',
            'away': '🚶 离开座位',
            'eating': '🍔 吃东西',
            'eyes_closed': '😵 眼睛闭上',
            'chin_on_hand': '🤦 撑脸',
            'unknown': '❓ 未检测到',
          }
          setBehavior(behaviorMap[res.data.behavior] || res.data.behavior)
          setDetections(res.data.detections || [])

          // 在画布上绘制检测结果
          drawDetections(res.data)
        }
      } catch (err) {
        console.error('Detection error:', err)
      }
    }, 100) // 10 FPS
  }

  // 绘制姿态关键点
  const drawPoseKeypoints = (ctx, keypoints, behavior) => {
    if (!keypoints || keypoints.length < 17) return

    // COCO 关键点定义
    const keypointNames = [
      'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
      'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
      'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
      'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
    ]

    // 关键点连接（骨架）
    const connections = [
      [0, 1], [0, 2], [1, 3], [2, 4], // 头
      [5, 6], // 肩膀
      [5, 7], [7, 9], // 左臂
      [6, 8], [8, 10], // 右臂
      [5, 11], [6, 12], // 躯干
      [11, 12], // 髋
      [11, 13], [13, 15], // 左腿
      [12, 14], [14, 16], // 右腿
    ]

    // 关键点颜色
    const keypointColors = {
      head: '#fbbf24',   // 头 - 黄色
      body: '#10b981',  // 身体 - 绿色
      hands: '#ef4444', // 手 - 红色
    }

    // 绘制骨架连接
    ctx.lineWidth = 3
    connections.forEach(([i, j]) => {
      const kp1 = keypoints[i]
      const kp2 = keypoints[j]
      
      if (kp1 && kp2) {
        // 判断连接类型
        let color = keypointColors.body
        if (i === 0 || j === 0 || i <= 4 || j <= 4) color = keypointColors.head
        if (i >= 7 && i <= 10 || j >= 7 && j <= 10) color = keypointColors.hands
        
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(kp1[0], kp1[1])
        ctx.lineTo(kp2[0], kp2[1])
        ctx.stroke()
      }
    })

    // 绘制关键点
    keypoints.forEach((kp, idx) => {
      if (!kp) return
      
      let color = keypointColors.body
      let radius = 5
      
      // 头部关键点
      if (idx <= 4) {
        color = keypointColors.head
        radius = 6
      }
      // 手腕关键点
      else if (idx === 9 || idx === 10) {
        color = keypointColors.hands
        radius = 7
      }
      
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(kp[0], kp[1], radius, 0, 2 * Math.PI)
      ctx.fill()
      
      // 绘制关键点名称
      ctx.fillStyle = 'white'
      ctx.font = 'bold 10px Arial'
      ctx.fillText(keypointNames[idx], kp[0] + 8, kp[1] + 4)
    })

    // 根据行为绘制警告框
    const warningBehaviors = ['sleeping', 'eyes_closed', 'chin_on_hand', 'eating']
    if (warningBehaviors.includes(behavior)) {
      const warningTexts = {
        'sleeping': '😴 趴桌检测',
        'eyes_closed': '😵 闭眼检测',
        'chin_on_hand': '🤦 撑脸检测',
        'eating': '🍔 吃东西',
      }
      
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'
      ctx.fillRect(canvas.width / 2 - 80, 30, 160, 35)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(warningTexts[behavior] || behavior, canvas.width / 2, 55)
      ctx.textAlign = 'left'
    }
  }

  // 停止检测
  const stopDetection = () => {
    clearInterval(detectIntervalRef.current)
  }

  // 绘制检测结果
  const drawDetections = (data) => {
    if (!canvasDrawRef.current || !videoRef.current) return

    const canvas = canvasDrawRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480

    // 绘制原始帧
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    // 绘制姿态关键点
    if (data.pose_keypoints && data.pose_keypoints.length > 0) {
      drawPoseKeypoints(ctx, data.pose_keypoints, data.behavior)
    }

    // 绘制物品检测框
    if (data.detections && data.detections.length > 0) {
      data.detections.forEach(det => {
        if (det.bbox && det.label) {
          const [x1, y1, x2, y2] = det.bbox
          
          // 颜色映射
          const colorMap = {
            'person': '#10b981',
            'cell phone': '#ef4444',
            'laptop': '#3b82f6',
            'banana': '#fbbf24',
            'apple': '#ef4444',
            'pizza': '#f97316',
            'cake': '#ec4899',
            'sandwich': '#a855f7',
          }
          const color = colorMap[det.label] || '#f59e0b'
          
          // 绘制框
          ctx.strokeStyle = color
          ctx.lineWidth = 3
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
          
          // 绘制标签背景
          ctx.fillStyle = color
          const label = `${det.label} ${Math.round(det.confidence * 100)}%`
          ctx.font = 'bold 14px Arial'
          const textWidth = ctx.measureText(label).width
          ctx.fillRect(x1, y1 - 25, textWidth + 10, 25)
          
          // 绘制标签文字
          ctx.fillStyle = 'white'
          ctx.fillText(label, x1 + 5, y1 - 7)
        }
      })
    }

    // 显示检测信息
    if (data.person_count !== undefined) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(10, 10, 200, 80)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`人员数量: ${data.person_count}`, 20, 35)
      ctx.fillText(`手机检测: ${data.phone_detected ? '是 ⚠️' : '否 ✅'}`, 20, 60)
      ctx.fillText(`置信度: ${Math.round((data.confidence || 0) * 100)}%`, 20, 85)
    }
  }

  // 拖拽功能
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const newX = Math.max(0, Math.min(window.innerWidth - 680, e.clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 460, e.clientY - dragOffset.y))
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // 组件挂载时自动启动摄像头
  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  // 摄像头状态变化时通知外部
  useEffect(() => {
    const event = new CustomEvent('cameraStateChanged', {
      detail: { cameraOn }
    })
    window.dispatchEvent(event)
  }, [cameraOn])

  const getScoreColor = () => {
    if (focusScore >= 90) return 'text-green-500'
    if (focusScore >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10001,
        width: minimized ? 'auto' : '660px',
        userSelect: 'none',
      }}
    >
      {/* 窗口标题栏 */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between cursor-move shadow-lg"
      >
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5" />
          <span className="font-semibold">实时监督窗口</span>
          {cameraOn && (
            <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              直播中
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 窗口内容 */}
      {!minimized && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* 视频 + 信息面板 */}
          <div className="flex">
            {/* 视频区域 */}
            <div className="relative bg-black" style={{ width: '480px', height: '360px' }}>
              {/* 视频元素始终渲染，但在未开启时显示黑屏 */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraOn ? '' : 'opacity-0'}`}
              />
              
              {/* 覆盖层：用于绘制检测结果 */}
              <canvas
                ref={canvasDrawRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* 未开启摄像头时的占位符 */}
              {!cameraOn && !cameraStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-black/80">
                  <Camera className="w-16 h-16 mb-4" />
                  <p className="text-sm">{error || '点击下方按钮开启摄像头'}</p>
                </div>
              )}
              
              {/* 摄像头启动中 */}
              {cameraStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm">正在启动摄像头...</p>
                </div>
              )}
            </div>

            {/* 信息面板 */}
            <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 space-y-4">
              {/* 专注度分数 */}
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor()}`}>
                  {Math.round(focusScore)}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  专注度评分
                </div>
              </div>

              {/* 当前状态 */}
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center">
                <div className="text-lg font-medium">{behavior}</div>
              </div>

              {/* 检测信息 */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  检测详情
                </div>
                <div className="bg-white dark:bg-slate-700 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">检测物体:</span>
                    <span className="font-medium text-xs">
                      {detections.length > 0
                        ? detections.map(d => d.label).join(', ')
                        : '无'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">姿态估计:</span>
                    <span className="font-medium text-xs">已启用 ✅</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">帧率:</span>
                    <span className="font-medium">10 FPS</span>
                  </div>
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="space-y-2">
                {cameraOn ? (
                  <button
                    onClick={stopCamera}
                    className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <CameraOff className="w-5 h-5" />
                    关闭摄像头
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    开启摄像头
                  </button>
                )}
              </div>

              {/* 说明 */}
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>• 绿色：人物骨架 | 黄色：头部关键点</p>
                <p>• 红色：手部关键点 | 检测到分心时显示警告</p>
              </div>
            </div>
          </div>

          {/* 评分规则（可折叠） */}
          <div className="border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowScoreRules(!showScoreRules)}
              className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">📋 评分规则</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  （初始100分，最低0分）
                </span>
              </div>
              {showScoreRules ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showScoreRules && (
              <div className="px-4 py-3 bg-white dark:bg-slate-900 grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span>📱</span>
                  <span className="text-slate-600 dark:text-slate-300">玩手机 5秒 -1分</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>🍔</span>
                  <span className="text-slate-600 dark:text-slate-300">吃东西 5秒 -1分</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>😴</span>
                  <span className="text-slate-600 dark:text-slate-300">趴桌睡觉 5秒 -1分</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>😵</span>
                  <span className="text-slate-600 dark:text-slate-300">眼睛闭上 5秒 -1分</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>🤦</span>
                  <span className="text-slate-600 dark:text-slate-300">撑脸 5秒 -1分</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>🚶</span>
                  <span className="text-slate-600 dark:text-slate-300">离开座位 5秒 -1分</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
