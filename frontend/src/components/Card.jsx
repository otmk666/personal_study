import { cn } from '@/utils'

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700',
        'shadow-sm transition-theme',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
