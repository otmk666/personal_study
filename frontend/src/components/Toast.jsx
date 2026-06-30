import { useAppStore } from '@/store'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/utils'

export default function Toast() {
  const { toast, hideToast } = useAppStore()

  if (!toast) return null

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-right">
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border',
        'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        'min-w-[280px] max-w-md'
      )}>
        {icons[toast.type] || icons.info}
        <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{toast.msg}</span>
        <button onClick={hideToast} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
