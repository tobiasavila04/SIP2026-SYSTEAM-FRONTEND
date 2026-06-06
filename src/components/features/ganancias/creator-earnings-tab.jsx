import { useState, useEffect } from 'react'
import { DollarSign, BarChart3, FolderOpen } from 'lucide-react'
import { useMyProjects } from '@/hooks/use-projects'
import { useRepartosProyecto } from '@/hooks/use-dividendos'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton, StatSkeleton } from '@/components/shared/loading-skeleton'
import { formatCurrency, formatDateTime } from '@/lib/utils'

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

/**
 * Fetches repartos for a single project and reports them up via onData.
 * Renders the project table section.
 */
function ProjectRepartosRow({ project, onData }) {
  const { data: repartos, isLoading, isError, refetch } = useRepartosProyecto(project.id)

  useEffect(() => {
    if (!isLoading && !isError && Array.isArray(repartos)) {
      onData(project.id, repartos)
    }
  }, [repartos, isLoading, isError, project.id, onData])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/5 bg-card p-4 space-y-2">
        <Skeleton className="h-4 w-1/3 mb-3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-white/5 bg-card p-4">
        <p className="text-sm font-medium text-white mb-2">{project.titulo}</p>
        <ErrorState
          message="No se pudieron cargar los repartos."
          onRetry={refetch}
        />
      </div>
    )
  }

  const items = Array.isArray(repartos) ? repartos : []

  return (
    <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-medium text-white">{project.titulo}</h3>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-500 italic">Sin repartos aún</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Fecha de reparto</th>
                <th className="px-4 py-3 font-medium">Monto total</th>
                <th className="px-4 py-3 font-medium">Monto por subtoken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((reparto) => (
                <tr key={reparto.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    {reparto.fechaReparto ? formatDateTime(reparto.fechaReparto) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono">
                    {reparto.montoTotal != null ? formatCurrency(reparto.montoTotal) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono">
                    {reparto.montoPorSubtoken != null ? formatCurrency(reparto.montoPorSubtoken) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function CreatorEarningsTab() {
  const { data: projects, isLoading, isError, refetch } = useMyProjects()
  // Map of projectId -> repartos array, populated as child rows load
  const [repartosMap, setRepartosMap] = useState({})

  const handleRepartosData = (projectId, repartos) => {
    setRepartosMap((prev) => {
      if (prev[projectId] === repartos) return prev
      return { ...prev, [projectId]: repartos }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState message="No se pudieron cargar tus proyectos." onRetry={refetch} />
  }

  const projectList = Array.isArray(projects) ? projects : []

  if (projectList.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No tenés proyectos todavía"
        description="Creá un proyecto para ver los repartos de dividendos."
      />
    )
  }

  const allRepartos = Object.values(repartosMap).flat()
  const totalDistribuido = allRepartos.reduce((acc, r) => acc + (r.montoTotal ?? 0), 0)
  const totalRepartos = allRepartos.length
  const projectsWithRepartos = new Set(allRepartos.map((r) => r.proyectoId)).size

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={DollarSign}
          label="Total distribuido"
          value={formatCurrency(totalDistribuido)}
        />
        <SummaryCard
          icon={BarChart3}
          label="Total de repartos"
          value={totalRepartos}
        />
        <SummaryCard
          icon={FolderOpen}
          label="Proyectos con repartos"
          value={projectsWithRepartos}
        />
      </div>

      <div className="space-y-4">
        {projectList.map((project) => (
          <ProjectRepartosRow
            key={project.id}
            project={project}
            onData={handleRepartosData}
          />
        ))}
      </div>
    </div>
  )
}
