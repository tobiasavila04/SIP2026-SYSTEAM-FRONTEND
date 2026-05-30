import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { usePermissions, useAuthStore } from '@/stores/auth-store'
import { useProjects, useEvaluateStates } from '@/hooks/use-projects'
import { useDashboardStats, useModulesStatus } from '@/hooks/use-dashboard'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton, StatSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import {
  Users,
  Briefcase,
  Target,
  DollarSign,
  Play,
  Loader2,
  TrendingUp,
  Award,
  ShieldCheck,
  FolderKanban,
  ArrowRight,
  Clock
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'

// --- CONSTANTES Y COMPONENTES AUXILIARES ---

const typeIcons = {
  project_created: 'bg-blue-500/20 text-blue-400',
  status_change: 'bg-amber-500/20 text-amber-400',
  investment: 'bg-emerald-500/20 text-emerald-400',
  user_action: 'bg-violet-500/20 text-violet-400',
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    return (
      <div className="bg-slate-900 border border-white/5 p-3 rounded-lg shadow-xl">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
          {payload[0].name}
        </p>
        <p className="text-sm font-bold text-white">
          {typeof value === 'number' && value >= 1000
            ? formatCurrency(value)
            : value}
        </p>
      </div>
    )
  }
  return null
}

function ActivityTimeline({ activities }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-500">
        No hay actividad reciente
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, i) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="relative flex gap-4 pb-6 last:pb-0"
        >
          <div className="flex flex-col items-center">
            <div className={`w-2 h-2 rounded-full mt-2 ${typeIcons[activity.type] || 'bg-slate-500/20'}`} />
            {i < activities.length - 1 && (
              <div className="w-px flex-1 bg-white/5 mt-1" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300">{activity.description}</p>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500">{formatDateTime(activity.timestamp)}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function StatCard({ title, value, change, icon: Icon, trend, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="rounded-xl border border-white/5 bg-card p-5 hover:border-white/10 transition-all shadow-md group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
          <Icon className="w-4 h-4 text-violet-400" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      {change && (
        <div className={cn(
          'flex items-center gap-1 mt-1 text-[11px]',
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'
        )}>
          {change}
        </div>
      )}
    </motion.div>
  )
}

// --- COMPONENTE PRINCIPAL ---

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isCreator } = usePermissions()

  // Hooks de datos
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ page: 0, size: 100 })
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useDashboardStats()
  const { data: modulesStatus, isLoading: modulesLoading, refetch: refetchModules } = useModulesStatus(isAdmin)
  const evaluateStates = useEvaluateStates()

  // Diagnóstico en consola de desarrollo
  if (import.meta.env.DEV) {
    console.log("Raw dashboard stats from TanStack Query:", stats)
  }

  // Parseo de actividad reciente
  const recentActivity = useMemo(() => {
    const projects = Array.isArray(projectsData?.content) ? projectsData.content : []
    if (!projects.length) return []
    return projects.slice(0, 5).map((p, i) => ({
      id: p.id || i,
      type: i === 0 ? 'project_created' : i === 1 ? 'investment' : 'status_change',
      title: p.titulo,
      description: p.estado === 'FINANCIAMIENTO'
        ? `Buscando inversión - ${formatCurrency(p.montoRequerido ?? 0)}`
        : p.estado === 'EJECUCION'
          ? 'Proyecto en ejecución'
          : `Estado: ${p.estado}`,
      timestamp: p.createdAt || p.updatedAt || new Date().toISOString(),
    }))
  }, [projectsData])

  // Parseo de métricas principales
  const totalProyectos = stats?.totalProyectos ?? stats?.totalProjects ?? projectsData?.content?.length ?? 0
  const proyectosActivos = stats?.proyectosActivos ?? stats?.activeProjects ?? totalProyectos
  const montoTotalRequerido = stats?.montoTotalRequerido ?? stats?.totalRequiredAmount ?? 0
  const totalInversores = stats?.totalInversores ?? stats?.totalInvestors ?? 0
  const totalUsuarios = stats?.totalUsuarios ?? stats?.totalUsers ?? 0

  const statCards = [
    {
      title: 'Proyectos Activos',
      value: String(proyectosActivos),
      change: `de ${totalProyectos} totales`,
      icon: FolderKanban,
      trend: 'up',
    },
    {
      title: 'Capital Requerido',
      value: formatCurrency(montoTotalRequerido),
      change: 'en financiamiento',
      icon: DollarSign,
      trend: 'up',
    },
    {
      title: 'Inversores',
      value: String(totalInversores),
      change: 'inversores activos',
      icon: Briefcase,
      trend: 'up',
    },
    {
      title: 'Usuarios',
      value: String(totalUsuarios),
      change: 'registrados en plataforma',
      icon: Users,
      trend: 'up',
    },
  ]

  // Mapeo correcto de DTO para proyectos por estado (projectsByStatus en backend)
  const projectsByStatus = stats?.projectsByStatus ?? stats?.proyectosPorEstado;

  const pieData = useMemo(() => {
    if (!projectsByStatus) return []
    if (Array.isArray(projectsByStatus)) {
      return projectsByStatus.map((item) => ({
        name: String(item.estado || item.name || 'Otros').toUpperCase(),
        value: Number(item.cantidad || item.value || 0)
      }))
    }
    return Object.entries(projectsByStatus).map(([key, val]) => ({
      name: String(key).toUpperCase(),
      value: Number(val)
    }))
  }, [projectsByStatus])

  const formatStateLabel = (name) => {
    const labels = { PREPARACION: 'Preparación', FINANCIAMIENTO: 'Financiamiento', EJECUCION: 'Ejecución', FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado' }
    return labels[name] || name
  }

  const getCellColor = (name) => {
    const colors = { PREPARACION: '#f59e0b', FINANCIAMIENTO: '#8b5cf6', EJECUCION: '#10b981', FINALIZADO: '#3b82f6', CANCELADO: '#ef4444' }
    return colors[name] || '#64748b'
  }

  const projectsList = useMemo(() => {
    return Array.isArray(projectsData?.content) ? projectsData.content : []
  }, [projectsData])

  const barData = useMemo(() => {
    const list = stats?.topProyectosRecaudacion ?? stats?.topRecaudacion ?? stats?.topProyectosPorRecaudacion
    if (list && list.length > 0) {
      return list.slice(0, 5).map((p) => ({
        name: p.titulo ?? p.title ?? p.name ?? 'Proyecto',
        monto: p.montoRecaudado ?? p.recaudado ?? p.totalRecaudado ?? p.monto ?? 0
      }))
    }
    // Fallback: Computar rankings del cliente
    return [...projectsList]
      .sort((a, b) => (b.montoRecaudado ?? 0) - (a.montoRecaudado ?? 0))
      .slice(0, 5)
      .map((p) => ({
        name: p.titulo ?? 'Proyecto',
        monto: p.montoRecaudado ?? 0
      }))
  }, [stats, projectsList])

  const topRecaudacionList = useMemo(() => {
    const list = stats?.topProyectosRecaudacion ?? stats?.topRecaudacion ?? stats?.topProyectosPorRecaudacion
    if (list && list.length > 0) return list
    return [...projectsList]
      .sort((a, b) => (b.montoRecaudado ?? 0) - (a.montoRecaudado ?? 0))
      .slice(0, 5)
  }, [stats, projectsList])

  const topInversoresList = useMemo(() => {
    const list = stats?.topProyectosInversores ?? stats?.topInversores ?? stats?.topProyectosPorInversores
    if (list && list.length > 0) return list
    // Fallback de inversores: ordenar por monto recaudado o devolver vacío si no hay datos
    return [...projectsList]
      .sort((a, b) => (b.montoRecaudado ?? 0) - (a.montoRecaudado ?? 0))
      .slice(0, 5)
  }, [stats, projectsList])

  const modulesList = useMemo(() => {
    if (!modulesStatus) return []
    if (Array.isArray(modulesStatus)) {
      return modulesStatus.map((m) => ({ name: m.name ?? m.modulo ?? 'Módulo', status: m.status ?? m.estado ?? 'DOWN' }))
    }
    if (typeof modulesStatus === 'object') {
      return Object.entries(modulesStatus).map(([key, value]) => ({ name: key, status: value }))
    }
    return []
  }, [modulesStatus])

  const formatYAxis = (tickItem) => {
    if (tickItem >= 1e6) return `$${(tickItem / 1e6).toFixed(1)}M`
    if (tickItem >= 1e3) return `$${(tickItem / 1e3).toFixed(0)}k`
    return `$${tickItem}`
  }

  const handleEvaluate = async () => {
    try { await evaluateStates.mutateAsync() } catch { /* Handled globally */ }
  }

  const handleRefetchAll = () => {
    refetchStats()
    if (isAdmin) refetchModules()
  }

  // ESTADOS DE CARGA Y ERROR
  if (statsLoading || projectsLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title={`Bienvenido, ${user?.name || 'Usuario'}`} description="Cargando estadísticas del ecosistema..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] lg:col-span-2 rounded-xl bg-card" />
          <Skeleton className="h-[300px] rounded-xl bg-card" />
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="space-y-8">
        <PageHeader title={`Bienvenido, ${user?.name || 'Usuario'}`} description="Error al cargar la información del panel" />
        <ErrorState message="No se pudieron cargar las estadísticas generales. Por favor, verifica la conexión con el servidor de proyectos." onRetry={handleRefetchAll} />
      </div>
    )
  }

  // RENDERIZADO PRINCIPAL
  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title={`Bienvenido, ${user?.name || 'Usuario'}`}
        description="Resumen de tu actividad en la plataforma"
      >
        {isCreator && (
          <Link to="/proyectos/crear">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 cursor-pointer">
              + Nuevo proyecto
            </Button>
          </Link>
        )}
      </PageHeader>

      {/* 1. Métricas Principales (Del código Original) */}
      <section aria-label="Métricas principales">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <StatCard key={stat.title} {...stat} index={i} />
          ))}
        </div>
      </section>

      {/* 3. Gráficos del ecosistema (NUEVO) */}
      <section aria-label="Gráficos del ecosistema" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/5 bg-card p-6 shadow-lg flex flex-col h-[400px]">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              Proyectos por Estado
            </h3>
          </div>
          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-500">No hay datos de proyectos por estado</p>
            ) : (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={getCellColor(entry.name)} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto px-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getCellColor(entry.name) }} />
                      <span className="text-slate-400 font-medium">{formatStateLabel(entry.name)}</span>
                      <span className="text-white font-bold font-mono ml-auto pl-4">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-card p-6 shadow-lg flex flex-col h-[400px]">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Top 5 Proyectos por Recaudación
            </h3>
          </div>
          <div className="flex-1 min-h-0">
            {barData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-slate-500">No hay datos de recaudación disponibles</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatYAxis} tick={{ fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="monto" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* 4. Rankings de Proyectos (NUEVO) */}
      <section aria-label="Rankings de proyectos" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/5 bg-card p-6 shadow-lg">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-violet-400 font-bold" />
            Top Proyectos por Monto Recaudado
          </h3>
          <div className="space-y-4">
            {topRecaudacionList.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No hay datos de recaudación disponibles</p>
            ) : (
              topRecaudacionList.slice(0, 5).map((project, i) => {
                const title = project.titulo ?? project.title ?? project.name ?? 'Proyecto Sin Título'
                const recaudado = project.montoRecaudado ?? project.recaudado ?? project.totalRecaudado ?? project.monto ?? 0
                const requerido = project.montoRequerido ?? project.requerido ?? 1
                const pct = Math.min(100, Math.max(0, (recaudado / requerido) * 100))

                return (
                  <div key={project.id || i} className="group relative flex flex-col gap-1 p-2 rounded-lg hover:bg-white/[0.02] transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-400 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-sm font-medium text-slate-200 group-hover:text-violet-400 transition-colors line-clamp-1 max-w-[200px] sm:max-w-xs">{title}</span>
                      </div>
                      <span className="text-xs font-bold text-white">{formatCurrency(recaudado)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 w-8 text-right font-medium">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-card p-6 shadow-lg">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400 font-bold" />
            Top Proyectos por Inversores
          </h3>
          <div className="space-y-4">
            {topInversoresList.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No hay datos de inversores disponibles</p>
            ) : (
              topInversoresList.slice(0, 5).map((project, i) => {
                const title = project.titulo ?? project.title ?? project.name ?? 'Proyecto Sin Título'
                const inversores = project.cantidadInversores ?? project.inversores ?? project.totalInversores ?? project.cantidad ?? 0

                return (
                  <div key={project.id || i} className="group relative flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-all">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-1 max-w-[200px] sm:max-w-xs">{title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white bg-white/5 px-2.5 py-1 rounded-md">
                        {inversores} {inversores === 1 ? 'inversor' : 'inversores'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* 6. Actividad y Accesos Rápidos (Del código Original) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-label="Actividad reciente" className="lg:col-span-2 rounded-xl border border-white/5 bg-card p-6 shadow-lg">
          <h2 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            Actividad Reciente
          </h2>
          <ActivityTimeline activities={recentActivity} />
        </section>

        <aside aria-label="Acceso rápido" className="rounded-xl border border-white/5 bg-card p-6 shadow-lg h-fit">
          <h2 className="text-sm font-semibold text-white mb-4">Acceso Rápido</h2>
          <div className="space-y-2">
            <Link to="/proyectos" className="group flex items-center justify-between px-3 py-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              Explorar proyectos
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link to="/perfil" className="group flex items-center justify-between px-3 py-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              Mi perfil
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            {isAdmin && (
              <Link to="/admin/usuarios" className="group flex items-center justify-between px-3 py-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                Administrar usuarios
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
            <Link to="/configuracion" className="group flex items-center justify-between px-3 py-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              Configuración
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}