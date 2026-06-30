import { cn } from '@/utils'

export default function Textarea({ label, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-3 py-2 rounded-lg border text-sm resize-y',
          'bg-white dark:bg-slate-800',
          'border-slate-300 dark:border-slate-600',
          'text-slate-900 dark:text-slate-100',
          'placeholder-slate-400 dark:placeholder-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-colors duration-200',
          'min-h-[80px]',
          className
        )}
        {...props}
      />
    </div>
  )
}
