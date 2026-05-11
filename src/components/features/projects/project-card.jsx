import { Link } from 'react-router-dom'
import { SquarePen, Clock, Coins, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { statusVariants, statusLabels, FundingProgress } from '@/lib/project-constants'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

export function ProjectCard({ project, isCreator }) {
  const hasTokens = project.cupoMaximoTokens && project.valorNominalToken
  const hasProgress = project.montoRecaudado != null

  return (
    <Link
      to={`/proyectos/${project.id}`}
      className="group relative rounded-xl border border-white/5 bg-card hover:border-violet-500/20 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-violet-500/5 flex flex-col h-full overflow-hidden"
    >
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex-1 p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge variant={statusVariants[project.estado] || 'default'}>
                {statusLabels[project.estado] || project.estado}
              </StatusBadge>
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors duration-300 truncate">
              {project.titulo}
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
          {project.descripcion}
        </p>

        <div className="flex items-center gap-4 pt-2">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Monto</p>
            <p className="text-sm font-semibold text-emerald-300">{formatCurrency(project.montoRequerido)}</p>
          </div>

          {hasTokens && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Token</p>
              <p className="text-sm font-medium text-slate-200">{formatCurrency(project.valorNominalToken)}</p>
            </div>
          )}

          {project.plazo && (
            <div className="ml-auto">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Plazo</p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {formatDate(project.plazo)}
              </div>
            </div>
          )}
        </div>

        {hasTokens && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Coins className="w-3 h-3" />
            <span>{project.cupoMaximoTokens.toLocaleString()} tokens disponibles</span>
          </div>
        )}

        {hasProgress && (
          <FundingProgress raised={project.montoRecaudado} required={project.montoRequerido} />
        )}
      </div>

      <div className={cn(
        "px-5 py-3 border-t border-white/5 flex items-center gap-2",
        isCreator ? "justify-between" : "justify-center"
      )}>
        <span className="text-xs text-slate-500 group-hover:text-violet-400 transition-colors inline-flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Ver detalle
        </span>
        {isCreator && (
          <div onClick={(e) => e.stopPropagation()}>
            <Link to={`/proyectos/${project.id}/editar`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/5">
                <SquarePen className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Link>
  )
}
