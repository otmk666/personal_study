import { useState, useEffect, useRef } from 'react'
import { X, Camera, CameraOff, Circle } from 'lucide-react'
import { getFocusScoreColor, getFocusScoreBg, formatTime } from '@/utils'
import { aiApi, focusApi } from '@/api'

export default function FocusPanel({ sessionId, onClose, score: initialScore, minutes: initialMinutes }) {
  const [score, setScore] = useState(initialScore || 100)
  const [behavior, setBehavior] = useState('专注学习')
  const [minutes, setMinutes] = useState(initialMinutes || 0)
  const [seconds, setSeconds] = useState(0)
  const [cameraOn, setCameraOn] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const detectIntervalRef = useRef(null)
  const timeIntervalRef = useRef(null)

  const startTimer = () => {
    if (timeIntervalRef.current) return
    timeIntervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s === 59) {
          setMinutes(m => m + 1)
          return 0
        }
        return s + 1
      })
    }, 1000)
  }

  const stopTimer = () => {
    clearInterval(timeIntervalRef.current)
    timeIntervalRef.current = null
  }

  useEffect(() => {
    if (cameraOn) {
      startTimer()
    } else {
      stopTimer()
    }
  }, [cameraOn])

  useEffect(() => {
    return () => {
      stopTimer()
      stopDetection()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraOn(true)
      startDetection()
    } catch (err) {
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
    }
    setCameraOn(false)
    stopDetection()
  }

  const startDetection = () => {
    setDetecting(true)
    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return

      const ctx = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth || 320
      canvasRef.current.height = videoRef.current.videoHeight || 240
      ctx.drawImage(videoRef.current, 0, 0)

      try {
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.5)
        const base64 = imageData.split(',')[1]

        const res = await aiApi.detectBase64({
          session_id: sessionId,
          image: base64,
        })

        if (res.data) {
          setScore(res.data.focus_score || 100)
          const behaviorMap = {
            focused: '专注学习',
            using_phone: '使用手机',
            sleeping: '趴桌睡觉',
            away: '离开座位',
            distracted: '视线偏离',
          }
          setBehavior(behaviorMap[res.data.behavior] || res.data.behavior)
        }
      } catch (err) {
        setScore(prev => Math.min(100, prev + 0.2))
        setBehavior('专注学习')
      }
    }, 2000)
  }

  const stopDetection = () => {
    setDetecting(false)
    clearInterval(detectIntervalRef.current)
  }

  const totalSeconds = minutes * 60 + seconds

  return (
    <div className="w-72 flex-shrink-0">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${detecting ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">学习监督</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  strokeWidth="8"
                  fill="none"
                  className="stroke-slate-200 dark:stroke-slate-700"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  className={getFocusScoreBg(score).replace('bg-', 'stroke-')}
                  strokeDasharray={`${(score / 100) * 301.6} 301.6`}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getFocusScoreColor(score)}`}>
                  {Math.round(score)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">专注分数</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Circle className={`w-3 h-3 ${getFocusScoreBg(score)} rounded-full`} />
            <span className="text-sm text-slate-600 dark:text-slate-300">{behavior}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {formatTime(totalSeconds)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">专注时长</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {Math.round(score)}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">当前专注度</p>
            </div>
          </div>

          {showCamera && (
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={cameraOn ? stopCamera : startCamera}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                cameraOn
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200'
              }`}
            >
              {cameraOn ? (
                <><CameraOff className="w-4 h-4" /> 关闭摄像头</>
              ) : (
                <><Camera className="w-4 h-4" /> 开启摄像头</>
              )}
            </button>
            <button
              onClick={() => setShowCamera(!showCamera)}
              className="w-full py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {showCamera ? '隐藏画面' : '显示画面'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
