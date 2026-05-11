import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchInput({ containerClassName, className, ...props }) {
  return (
    <div className={cn('relative', containerClassName)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input
        className={cn(
          'w-full h-9 pl-9 pr-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white',
          'placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20',
          'transition-all',
          className
        )}
        {...props}
      />
    </div>
  )
}
