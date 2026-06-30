import { cn } from '@/utils'

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
