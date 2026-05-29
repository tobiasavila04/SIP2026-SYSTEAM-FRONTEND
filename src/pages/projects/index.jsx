import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '@/hooks/use-projects'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissions } from '@/stores/auth-store'
import { ProjectCard } from '@/components/features/projects/project-card'
import { SearchInput } from '@/components/shared/search-input'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/shared/pagination'
import { cn } from '@/lib/utils'
import {
  FolderKanban,
  CircleDollarSign,
  Layers,
  Plus,
  ArrowUpDown,
  Users,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PREPARACION', label: 'Preparación' },
  { value: 'FINANCIAMIENTO', label: 'Financiamiento' },
  { value: 'EJECUCION', label: 'Ejecución' },
  { value: 'FINALIZADO', label: 'Finalizado' },
]

const SORT_OPTIONS = [
  { value: 'reciente', label: 'Más reciente' },
  { value: 'antiguo', label: 'Más antiguo' },
  { value: 'monto-mayor', label: 'Mayor monto' },
  { value: 'monto-menor', label: 'Menor monto' },
]

const MONTO_OPTIONS = [
  { value: '', label: 'Monto: Cualquiera' },
  { value: '0-99999', label: 'Menos de $100K' },
  { value: '100000-499999', label: '$100K – $500K' },
  { value: '500000-999999', label: '$500K – $1M' },
  { value: '1000000-4999999', label: '$1M – $5M' },
  { value: '5000000-', label: 'Más de $5M' },
]

function FilterSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none bg-white/[0.03] border border-white/5 rounded-md pl-3 pr-7 py-1.5 text-xs text-slate-400 hover:text-white outline-none cursor-pointer"
      >
        {children}
      </select>
      <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
    </div>
  )
}

const PAGE_SIZE = 6

export default function ProjectCatalogPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [vista, setVista] = useState('todos')
  const [montoRange, setMontoRange] = useState('')
  const [gobernanzaOnly, setGobernanzaOnly] = useState(false)
  const [sortBy, setSortBy] = useState('reciente')
  const [page, setPage] = useState(0)
  const usuarioId = useAuthStore((s) => s.user?.id)
  const { isCreator, isAdmin } = usePermissions()
  const puedeCrear = isCreator || isAdmin

  const { data, isLoading, isError, refetch } = useProjects({
    search,
    estado: statusFilter || undefined,
    page: 0,
    size: 500,
  })

  const proyectos = data?.content || []

  const proyectosFiltrados = useMemo(() => {
    let result = proyectos

    if (vista === 'mis-proyectos' && usuarioId) {
      result = result.filter((p) => p.creadorId === usuarioId)
    }

    if (montoRange) {
      const [min, max] = montoRange.split('-')
      if (min) result = result.filter((p) => (p.montoRequerido ?? 0) >= Number(min))
      if (max) result = result.filter((p) => (p.montoRequerido ?? 0) <= Number(max))
    }

    if (gobernanzaOnly) {
      result = result.filter((p) => p.gobernanzaComunidad === true)
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'antiguo':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        case 'monto-mayor':
          return (b.montoRequerido || 0) - (a.montoRequerido || 0)
        case 'monto-menor':
          return (a.montoRequerido || 0) - (b.montoRequerido || 0)
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      }
    })

    return result
  }, [proyectos, vista, usuarioId, montoRange, gobernanzaOnly, sortBy])

  useEffect(() => { setPage(0) }, [search, statusFilter, vista, montoRange, gobernanzaOnly, sortBy])

  const totalFilteredPages = Math.max(1, Math.ceil(proyectosFiltrados.length / PAGE_SIZE))
  const paginatedProyectos = useMemo(() => {
    const start = page * PAGE_SIZE
    return proyectosFiltrados.slice(start, start + PAGE_SIZE)
  }, [proyectosFiltrados, page])

  const stats = useMemo(() => [
    { label: 'Total proyectos', value: data?.totalElements ?? 0, icon: FolderKanban },
    { label: 'En financiamiento', value: proyectos.filter(p => p.estado === 'FINANCIAMIENTO').length, icon: CircleDollarSign },
    { label: 'Mis proyectos', value: usuarioId ? proyectos.filter(p => p.creadorId === usuarioId).length : 0, icon: Layers },
  ], [data, proyectos, usuarioId])

  const activeFilters = [statusFilter, montoRange, gobernanzaOnly ? 'gobernanza' : '', vista !== 'todos' ? vista : ''].filter(Boolean).length
  const hayFiltros = activeFilters > 0 || !!search

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Proyectos</h1>
          <p className="text-sm text-slate-400 mt-1">Explorá y gestioná proyectos tokenizados</p>
        </div>
        {puedeCrear && (
          <Link to="/proyectos/crear">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 h-9 px-5 text-sm rounded-lg shadow-lg shadow-violet-600/20">
              <Plus className="w-4 h-4" />
              Nuevo proyecto
            </Button>
          </Link>
        )}
      </div>

      <section aria-label="Estadísticas de proyectos">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <article key={s.label} className="rounded-lg border border-white/5 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <s.icon className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] text-slate-500 uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Filtros de búsqueda">
        <div className="rounded-xl border border-white/5 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {puedeCrear && (
              <div className="flex gap-1 p-1 rounded-lg bg-white/5">
                {['todos', 'mis-proyectos'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVista(v)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap',
                      vista === v
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {v === 'todos' ? 'Todos' : 'Mis proyectos'}
                  </button>
                ))}
              </div>
            )}
            <SearchInput
              placeholder="Buscar proyectos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              containerClassName="w-full sm:min-w-[220px] sm:w-80"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="" className="bg-card">Estado: Todos</option>
              {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-card">{opt.label}</option>
              ))}
            </FilterSelect>

            <FilterSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-card">{opt.label}</option>
              ))}
            </FilterSelect>

            <FilterSelect value={montoRange} onChange={(e) => setMontoRange(e.target.value)}>
              {MONTO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-card">{opt.label}</option>
              ))}
            </FilterSelect>

            <button
              onClick={() => setGobernanzaOnly(!gobernanzaOnly)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                gobernanzaOnly
                  ? 'bg-violet-500/10 text-violet-300'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Gobernanza
            </button>

            {hayFiltros && (
              <button
                onClick={() => {
                  setStatusFilter('')
                  setSearch('')
                  setMontoRange('')
                  setGobernanzaOnly(false)
                  setVista('todos')
                  setSortBy('reciente')
                }}
                className="text-xs text-slate-500 hover:text-white transition-colors whitespace-nowrap"
              >
                × Limpiar
              </button>
            )}
          </div>
          </div>
        </div>
      </section>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : proyectosFiltrados.length === 0 ? (
        <EmptyState
          title={vista === 'mis-proyectos' ? 'No publicaste proyectos' : 'No hay proyectos'}
          description={hayFiltros
            ? 'Ningún proyecto coincide con los filtros seleccionados. Probá con otros criterios.'
            : vista === 'mis-proyectos'
              ? 'Todavía no creaste ningún proyecto. Creá tu primer proyecto para empezar a recibir inversiones.'
              : 'No hay proyectos disponibles en este momento.'}
          action={vista === 'mis-proyectos' && puedeCrear ? { label: 'Crear proyecto', to: '/proyectos/crear' } : undefined}
        />
      ) : (
        <section aria-label="Listado de proyectos">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedProyectos.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                isCreator={p.creadorId === usuarioId}
              />
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={page} totalPages={totalFilteredPages} onPageChange={setPage} />
          </div>
        </section>
      )}
    </div>
  )
}
