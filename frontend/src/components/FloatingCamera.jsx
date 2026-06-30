import { useState, useEffect, useRef } from 'react'
import { Camera, CameraOff, Monitor, X } from 'lucide-react'

export default function FloatingCamera() {
  const [visible, setVisible] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showMenu, setShowMenu] = useState(false)
  const [style, setStyle] = useState('circle') // circle, pill, minimal
  const [showTip, setShowTip] = useState(false)
  const menuRef = useRef(null)
  const tipTimerRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0, moved: false })

  // 从 localStorage 加载设置
  useEffect(() => {
    const loadConfig = () => {
      const saved = localStorage.getItem('cameraFloatConfig')
      if (saved) {
        const config = JSON.parse(saved)
        if (config.visible !== false) {
          setVisible(true)
          setPosition(config.position || { x: 20, y: 100 })
          setStyle(config.style || 'circle')
        } else {
          setVisible(false)
        }
      } else {
        setVisible(true)
      }
    }

    loadConfig()

    // 监听配置变化事件
    window.addEventListener('cameraFloatConfigChanged', loadConfig)
    return () => window.removeEventListener('cameraFloatConfigChanged', loadConfig)
  }, [])

  // 监听摄像头状态变化（来自 MonitorWindow）
  useEffect(() => {
    const handleCameraState = (e) => {
      setCameraOn(e.detail?.cameraOn || false)
    }
    window.addEventListener('cameraStateChanged', handleCameraState)
    return () => window.removeEventListener('cameraStateChanged', handleCameraState)
  }, [])

  // 保存设置到 localStorage
  const saveConfig = (newConfig) => {
    const config = {
      visible,
      position,
      style,
      ...newConfig
    }
    localStorage.setItem('cameraFloatConfig', JSON.stringify(config))
  }

  // 显示状态提示（3秒后自动消失）
  const showStatusTip = () => {
    setShowTip(true)
    if (tipTimerRef.current) {
      clearTimeout(tipTimerRef.current)
    }
    tipTimerRef.current = setTimeout(() => {
      setShowTip(false)
    }, 3000)
  }

  // 点击小球 - 切换监督窗口
  const handleClick = () => {
    if (dragStartRef.current.moved) return // 拖拽过就不触发点击
    
    const event = new CustomEvent('toggleMonitorWindow')
    window.dispatchEvent(event)
    showStatusTip()
  }

  // 打开实时监督窗口
  const openMonitorWindow = () => {
    setShowMenu(false)
    const event = new CustomEvent('openMonitorWindow')
    window.dispatchEvent(event)
  }

  // 拖拽相关
  const handleMouseDown = (e) => {
    if (e.button === 2) {
      // 右键 - 打开菜单
      setShowMenu(true)
      return
    }
    
    if (e.button === 0) {
      // 左键 - 开始拖拽
      e.preventDefault()
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX, y: e.clientY, moved: false }
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const dx = Math.abs(e.clientX - dragStartRef.current.x)
    const dy = Math.abs(e.clientY - dragStartRef.current.y)
    if (dx > 5 || dy > 5) {
      dragStartRef.current.moved = true
    }
    
    const newX = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y))
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      if (dragStartRef.current.moved) {
        saveConfig({ position })
      } else {
        // 没有移动，算点击
        handleClick()
      }
    }
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

  // 点击外部关闭菜单
  useEffect(() => {
    if (showMenu) {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setShowMenu(false)
        }
      }
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  // 隐藏悬浮球
  const hideFloatBall = () => {
    setVisible(false)
    saveConfig({ visible: false })
    setShowMenu(false)
  }

  // 更改样式
  const changeStyle = (newStyle) => {
    setStyle(newStyle)
    saveConfig({ style: newStyle })
    setShowMenu(false)
  }

  if (!visible) return null

  // 不同样式的样式
  const getBallStyles = () => {
    const baseStyle = {
      position: 'fixed',
      left: position.x,
      top: position.y,
      zIndex: 9999,
      cursor: isDragging ? 'grabbing' : 'grab',
      transition: isDragging ? 'none' : 'all 0.2s ease',
      userSelect: 'none',
    }

    switch (style) {
      case 'pill':
        return {
          ...baseStyle,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '24px',
          background: cameraOn
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #6b7280, #4b5563)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }
      case 'minimal':
        return {
          ...baseStyle,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: cameraOn ? '#10b981' : '#6b7280',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }
      default: // circle
        return {
          ...baseStyle,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: cameraOn
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #6b7280, #4b5563)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }
    }
  }

  const getIconColor = () => 'white'
  const iconSize = style === 'minimal' ? 20 : style === 'pill' ? 18 : 24

  return (
    <>
      <div
        style={getBallStyles()}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
        className="hover:scale-110 select-none"
        title="点击开启/关闭监督 | 右键打开设置 | 拖拽移动"
      >
        {style === 'pill' ? (
          <>
            {cameraOn ? <Camera size={iconSize} color={getIconColor()} /> : <CameraOff size={iconSize} color={getIconColor()} />}
            <span className="text-white text-sm font-medium whitespace-nowrap">
              {cameraOn ? '监督中' : '点击开启'}
            </span>
          </>
        ) : (
          cameraOn ? <Camera size={iconSize} color={getIconColor()} /> : <CameraOff size={iconSize} color={getIconColor()} />
        )}
      </div>

      {/* 右键菜单 */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: position.x + 70,
            top: position.y,
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: '8px 0',
            minWidth: '160px',
            zIndex: 10000,
          }}
          className="dark:bg-gray-800"
        >
          <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b dark:text-white dark:border-gray-700">
            摄像头设置
          </div>

          {/* 打开监督窗口 */}
          <button
            onClick={openMonitorWindow}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
          >
            <Monitor size={16} />
            实时监督窗口
          </button>

          <div className="border-t my-2 dark:border-gray-700"></div>

          {/* 样式选项 */}
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
            样式
          </div>
          <button
            onClick={() => changeStyle('circle')}
            className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
              style === 'circle' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            圆形
          </button>
          <button
            onClick={() => changeStyle('pill')}
            className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
              style === 'pill' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="w-8 h-4 rounded-full bg-gray-400"></div>
            药丸
          </button>
          <button
            onClick={() => changeStyle('minimal')}
            className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
              style === 'minimal' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            极简
          </button>

          <div className="border-t my-2 dark:border-gray-700"></div>

          <button
            onClick={hideFloatBall}
            className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <X size={16} />
            隐藏悬浮球
          </button>
        </div>
      )}

      {/* 状态提示 - 3秒后自动消失 */}
      {showTip && (
        <div
          style={{
            position: 'fixed',
            left: position.x + 70,
            top: position.y + (style === 'pill' ? 0 : 10),
            background: cameraOn ? '#10b981' : '#6b7280',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            animation: 'fadeIn 0.2s ease',
            zIndex: 10001,
            whiteSpace: 'nowrap',
          }}
        >
          {cameraOn ? (
            <>
              <Camera size={12} className="inline mr-1" />
              监督已开启
            </>
          ) : (
            <>
              <CameraOff size={12} className="inline mr-1" />
              监督已关闭
            </>
          )}
        </div>
      )}
    </>
  )
}
