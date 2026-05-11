import { cn } from '@/lib/utils'

export function PageHeader({ title, description, children, className }) {
  return (
    <div className={cn('flex flex-wrap justify-between items-start gap-4 mb-8', className)}>
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3">{children}</div>
      )}
    </div>
  )
}
