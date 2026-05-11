import { cn } from '@/lib/utils'

const variantStyles = {
  default: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  error: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export function StatusBadge({ status, variant, children }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
      variantStyles[variant || 'default']
    )}>
      {children || status}
    </span>
  )
}
