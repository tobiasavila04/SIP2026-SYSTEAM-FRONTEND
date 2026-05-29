import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const maxVisible = 5
  let start = Math.max(0, page - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages, start + maxVisible)
  if (end - start < maxVisible) {
    start = Math.max(0, end - maxVisible)
  }

  for (let i = start; i < end; i++) {
    pages.push(i)
  }

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 0}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          page <= 0
            ? 'text-slate-600 cursor-not-allowed'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        )}
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {start > 0 && (
        <>
          <button
            onClick={() => onPageChange(0)}
            className="px-2.5 py-1 text-xs rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            1
          </button>
          {start > 1 && <span className="px-1 text-slate-600 text-xs">...</span>}
        </>
      )}

      {pages.map((i) => (
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={cn(
            'px-2.5 py-1 text-xs rounded-md transition-colors',
            i === page
              ? 'bg-violet-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          )}
        >
          {i + 1}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-slate-600 text-xs">...</span>}
          <button
            onClick={() => onPageChange(totalPages - 1)}
            className="px-2.5 py-1 text-xs rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          page >= totalPages - 1
            ? 'text-slate-600 cursor-not-allowed'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        )}
        aria-label="Página siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}
