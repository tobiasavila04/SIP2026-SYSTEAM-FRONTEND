import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissions } from '@/stores/auth-store'
import { useProjects } from '@/hooks/use-projects'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { PageHeader } from '@/components/shared/page-header'
import { StatSkeleton } from '@/components/shared/loading-skeleton'
import { FolderKanban, DollarSign, Users, ArrowRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'

const typeIcons = {
  project_created: 'bg-blue-500/20 text-blue-400',
  status_change: 'bg-amber-500/20 text-amber-400',
  investment: 'bg-emerald-500/20 text-emerald-400',
  user_action: 'bg-violet-500/20 text-violet-400',
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
      className="rounded-xl border border-white/5 bg-card p-5 hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-violet-400" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {change && (
        <div className={cn(
          'flex items-center gap-1 mt-1 text-xs',
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'
        )}>
          {change}
        </div>
      )}
    </motion.div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isCreator } = usePermissions()

  const { data: projectsData } = useProjects({ page: 0, size: 100 })
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiRequest(API_ENDPOINTS.DASHBOARD_STATS),
    staleTime: 30_000,
    retry: 1,
  })

  const recentActivity = useMemo(() => {
    const projects = Array.isArray(projectsData?.content) ? projectsData.content : []
    if (!projects.length) return []
    return projects.slice(0, 5).map((p, i) => ({
      id: p.id || i,
      type: i === 0 ? 'project_created' : i === 1 ? 'investment' : 'status_change',
      title: p.titulo,
      description: p.estado === 'FINANCIAMIENTO'
        ? `Buscando inversión - ${formatCurrency(p.montoRequerido)}`
        : p.estado === 'EJECUCION'
          ? 'Proyecto en ejecución'
          : `Estado: ${p.estado}`,
      timestamp: p.createdAt || p.updatedAt || new Date().toISOString(),
    }))
  }, [projectsData])

  const totalProjects = stats?.totalProjects ?? projectsData?.content?.length ?? 0
  const statCards = [
    {
      title: 'Proyectos activos',
      value: stats ? String(stats.activeProjects) : '—',
      change: `de ${totalProjects} totales`,
      icon: FolderKanban,
      trend: 'up',
    },
    {
      title: 'Total requerido',
      value: stats ? formatCurrency(stats.totalRequiredAmount) : '—',
      change: 'en financiamiento',
      icon: DollarSign,
      trend: 'up',
    },
    {
      title: 'Inversores',
      value: stats ? String(stats.totalInvestors) : '—',
      change: 'registrados en plataforma',
      icon: Users,
      trend: 'up',
    },
    {
      title: 'Usuarios',
      value: stats ? String(stats.totalUsers) : '—',
      change: 'registrados',
      icon: Users,
      trend: 'up',
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bienvenido, ${user?.name || 'Usuario'}`}
        description="Resumen de tu actividad en la plataforma"
      >
        {isCreator && (
          <Link to="/proyectos/crear">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20">+ Nuevo proyecto</Button>
          </Link>
        )}
      </PageHeader>

      <section aria-label="Métricas principales">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            : statCards.map((stat, i) => (
                <StatCard key={stat.title} {...stat} index={i} />
              ))
          }
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-label="Actividad reciente" className="lg:col-span-2 rounded-xl border border-white/5 bg-card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Proyectos recientes</h2>
          <ActivityTimeline activities={recentActivity} />
        </section>

        <aside aria-label="Acceso rápido" className="rounded-xl border border-white/5 bg-card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Acceso rápido</h2>
          <div className="space-y-2">
            <Link to="/proyectos" className="group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              Explorar proyectos
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link to="/perfil" className="group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              Mi perfil
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            {isAdmin && (
              <Link to="/admin/usuarios" className="group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                Administrar usuarios
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
            <Link to="/configuracion" className="group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              Configuración
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
