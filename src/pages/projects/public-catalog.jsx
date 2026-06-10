import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { ProjectCard } from '@/components/features/projects/project-card'
import { PublicNavbar } from '@/components/layout/public-navbar'
import { ErrorState } from '@/components/shared/error-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { Pagination } from '@/components/shared/pagination'
import { ArrowUpDown, Users, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PREPARACION', label: 'Preparación' },
  { value: 'EN_AUDITORIA', label: 'En Auditoría' },
  { value: 'FINANCIAMIENTO', label: 'Financiamiento' },
  { value: 'EJECUCION', label: 'Ejecución' },
  { value: 'FINALIZADO', label: 'Finalizado' },
]

const SORT_OPTIONS = [
  { value: 'reciente', label: 'Más reciente' },
  { value: 'monto-mayor', label: 'Mayor monto' },
  { value: 'monto-menor', label: 'Menor monto' },
]

export default function PublicCatalogPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('reciente')
  const [page, setPage] = useState(0)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-catalog', search, statusFilter, page, 6],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('page', page)
      params.set('size', 6)
      if (statusFilter) params.set('estado', statusFilter)
      if (search) params.set('search', search)
      return apiRequest(`${API_ENDPOINTS.PROJECTS_CATALOG}?${params}`)
    },
  })

  const proyectos = data?.content || []
  const totalPages = data?.totalPages || 0

  const sortedProyectos = useMemo(() => {
    const result = [...proyectos]
    // Sort: destacados first, then by selected sort
    if (sortBy === 'monto-mayor') {
      result.sort((a, b) => (b.montoRequerido || 0) - (a.montoRequerido || 0))
    } else if (sortBy === 'monto-menor') {
      result.sort((a, b) => (a.montoRequerido || 0) - (b.montoRequerido || 0))
    }
    // Destacados primero independientemente del sort
    result.sort((a, b) => {
      if (a.esDestacado && !b.esDestacado) return -1
      if (!a.esDestacado && b.esDestacado) return 1
      return 0
    })
    return result
  }, [proyectos, sortBy])

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      <PublicNavbar search={search} onSearchChange={(v) => { setSearch(v); setPage(0) }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Proyectos</h1>
            <p className="text-sm text-slate-400 mt-1">
              Explorá proyectos tokenizados en la plataforma
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
                className="appearance-none bg-white/[0.03] border border-white/5 rounded-md pl-3 pr-7 py-1.5 text-xs text-slate-400 hover:text-white outline-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#13172B]">{opt.label}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white/[0.03] border border-white/5 rounded-md pl-3 pr-7 py-1.5 text-xs text-slate-400 hover:text-white outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#13172B]">{opt.label}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : sortedProyectos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No hay proyectos</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              {search
                ? 'Ningún proyecto coincide con tu búsqueda. Probá con otros términos.'
                : 'No hay proyectos disponibles en este momento.'}
            </p>
          </div>
        ) : (
          <>
            {sortedProyectos.some((p) => p.esDestacado) && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Destacados</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sortedProyectos
                    .filter((p) => p.esDestacado)
                    .map((p) => (
                      <ProjectCard key={p.id} project={p} showActions={false} />
                    ))}
                </div>
              </div>
            )}

            <div>
              {sortedProyectos.some((p) => p.esDestacado) && (
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Todos los proyectos
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedProyectos
                  .filter((p) => !p.esDestacado)
                  .map((p) => (
                    <ProjectCard key={p.id} project={p} showActions={false} />
                  ))}
              </div>
            </div>

            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
