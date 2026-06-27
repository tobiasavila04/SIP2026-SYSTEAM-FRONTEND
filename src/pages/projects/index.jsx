import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProjects, useMyProjects, useAllProjects } from '@/hooks/use-projects'
import { useDashboardStats } from '@/hooks/use-dashboard'
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
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

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
  const { can, isAuditor } = usePermissions()
  const puedeCrear = can('project:create')

  const { data: allProjectsData } = useAllProjects()
  const auditPendingProjects = isAuditor
    ? (allProjectsData?.content?.filter((p) => p.estado === 'EN_AUDITORIA') ?? [])
    : []

  const { data: publicData, isLoading: publicLoading, isError: publicError, refetch: publicRefetch } = useProjects({
    search,
    estado: statusFilter || undefined,
    page: 0,
    size: 500,
  })

  const { data: myData, isLoading: myLoading, isError: myError, refetch: myRefetch } = useMyProjects()
  const { data: dashboardStats } = useDashboardStats()

  const isMyView = vista === 'mis-proyectos' && usuarioId
  const isLoading = isMyView ? myLoading : publicLoading
  const isError = isMyView ? myError : publicError
  const refetch = isMyView ? myRefetch : publicRefetch

  const allProyectos = isMyView ? (myData?.content || []) : (publicData?.content || [])
  const proyectos = allProyectos.filter((p) =>
    p.estado !== 'EN_AUDITORIA' || isAuditor || p.creadorId === usuarioId
  )

  const proyectosFiltrados = useMemo(() => {
    let result = proyectos

    if (isMyView) {
      if (statusFilter) {
        result = result.filter((p) => p.estado === statusFilter)
      }
      if (search) {
        const lowerSearch = search.toLowerCase()
        result = result.filter((p) => p.titulo.toLowerCase().includes(lowerSearch) || p.descripcion.toLowerCase().includes(lowerSearch))
      }
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
      // Destacados primero
      if (a.esDestacado && !b.esDestacado) return -1
      if (!a.esDestacado && b.esDestacado) return 1
      // Luego por el criterio de orden seleccionado
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
  }, [proyectos, isMyView, statusFilter, search, montoRange, gobernanzaOnly, sortBy])

  const destacados = useMemo(() => proyectosFiltrados.filter((p) => p.esDestacado), [proyectosFiltrados])
  const noDestacados = useMemo(() => proyectosFiltrados.filter((p) => !p.esDestacado), [proyectosFiltrados])

  useEffect(() => { setPage(0) }, [search, statusFilter, vista, montoRange, gobernanzaOnly, sortBy])

  const totalFilteredPages = Math.max(1, Math.ceil(noDestacados.length / PAGE_SIZE))
  const paginatedProyectos = useMemo(() => {
    const start = page * PAGE_SIZE
    return noDestacados.slice(start, start + PAGE_SIZE)
  }, [noDestacados, page])

  const stats = useMemo(() => {
    const s = [
      { label: 'Total proyectos', value: dashboardStats?.totalProjects ?? publicData?.totalElements ?? 0, icon: FolderKanban },
      { label: 'En financiamiento', value: dashboardStats?.projectsByStatus?.['FINANCIAMIENTO'] ?? (publicData?.content || []).filter(p => p.estado === 'FINANCIAMIENTO').length, icon: CircleDollarSign },
    ];
    if (puedeCrear) {
      s.push({ label: 'Mis proyectos', value: myData?.totalElements ?? 0, icon: Layers });
    }
    return s;
  }, [publicData, myData, dashboardStats, puedeCrear])

  const activeFilters = [statusFilter, montoRange, gobernanzaOnly ? 'gobernanza' : '', vista !== 'todos' ? vista : ''].filter(Boolean).length
  const hayFiltros = activeFilters > 0 || !!search

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Proyectos</h1>
          <p className="text-base sm:text-lg text-slate-400 mt-2 max-w-3xl">Explorá y gestioná proyectos tokenizados</p>
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

      {puedeCrear && (
        <section aria-label="Estadísticas de proyectos">
          <div className={cn("grid grid-cols-1 gap-3", stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
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
      )}
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

            {puedeCrear && (
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
            )}

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

      {isAuditor && (
        <section aria-label="Proyectos pendientes de auditoría">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">
              Pendientes de auditoría
            </h2>
            {auditPendingProjects.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                {auditPendingProjects.length}
              </span>
            )}
          </div>
          {auditPendingProjects.length === 0 ? (
            <p className="text-sm text-slate-500">No hay proyectos pendientes de auditoría.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {auditPendingProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isCreator={p.creadorId === usuarioId}
                />
              ))}
            </div>
          )}
        </section>
      )}

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
        <>
          {destacados.length > 0 && (
            <section aria-label="Proyectos destacados" className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Destacados</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {destacados.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    isCreator={p.creadorId === usuarioId}
                  />
                ))}
              </div>
            </section>
          )}

          <section aria-label="Listado de proyectos">
            {destacados.length > 0 && (
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Todos los proyectos
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedProyectos.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isCreator={p.creadorId === usuarioId}
                />
              ))}
            </div>
            {noDestacados.length > PAGE_SIZE && (
              <div className="mt-8">
                <Pagination page={page} totalPages={totalFilteredPages} onPageChange={setPage} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
