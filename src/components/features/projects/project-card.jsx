import { Link, useNavigate } from 'react-router-dom'
import { SquarePen, Clock, Coins, TrendingUp, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { statusVariants, statusLabels, FundingProgress } from '@/lib/project-constants'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { differenceInDays } from 'date-fns'

export function ProjectCard({ project, isCreator, showActions = true }) {
  const navigate = useNavigate()
  const hasTokens = project.cupoMaximoTokens && project.valorNominalToken
  const hasProgress = project.montoRecaudado != null
  const isFailed = project.estado === 'RECHAZADO' || project.estado === 'CANCELADO'
  const daysLeft = project.plazo ? differenceInDays(new Date(project.plazo), new Date()) : null

  const handleCardClick = (e) => {
    // Don't navigate if user clicked an interactive element inside the card
    if (e.target.closest('a, button')) return
    navigate(`/proyectos/${project.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/proyectos/${project.id}`) }}
      className="group relative rounded-xl border border-white/5 bg-card hover:border-violet-500/20 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-violet-500/5 flex flex-col h-full overflow-hidden cursor-pointer"
    >
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {project.esDestacado && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Star className="w-3 h-3 fill-amber-300" />
            Destacado
          </span>
        </div>
      )}

      <div className="flex-1 p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge variant={isFailed ? 'error' : (statusVariants[project.estado] || 'default')}>
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

          {daysLeft !== null && (
            <div className="ml-auto">
              {project.estado === 'FINALIZADO' || project.estado === 'EJECUCION' ? (
                <>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                    {project.estado === 'FINALIZADO' ? 'Estado' : 'Plazo'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <Clock className="w-3 h-3" />
                    <span>{project.estado === 'FINALIZADO' ? 'Completado' : 'Completado'}</span>
                  </div>
                </>
              ) : isFailed || daysLeft < 0 ? (
                <>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Estado</p>
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <Clock className="w-3 h-3" />
                    <span>Vencido</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Restan</p>
                  <div className={cn(
                    'flex items-center gap-1 text-xs',
                    daysLeft <= 7 ? 'text-amber-400' : 'text-slate-400'
                  )}>
                    <Clock className="w-3 h-3" />
                    <span>{daysLeft} días</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {hasTokens && !isFailed && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Coins className="w-3 h-3" />
            <span>{project.cupoMaximoTokens.toLocaleString()} tokens disponibles</span>
          </div>
        )}

        {hasProgress && !isFailed && (
          <FundingProgress raised={project.montoRecaudado} required={project.montoRequerido} />
        )}

        {isFailed && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-red-400 font-medium">
              {project.estado === 'RECHAZADO'
                ? 'No alcanzó la meta mínima'
                : 'Proyecto cancelado'}
            </span>
          </div>
        )}
      </div>

      {showActions && (
        <div className={cn(
          "px-5 py-3 border-t border-white/5 flex items-center gap-2",
          isCreator ? "justify-between" : "justify-center"
        )}>
          <span className="text-xs text-slate-500 group-hover:text-violet-400 transition-colors inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Ver detalle
          </span>
          {isCreator && (
            <Link to={`/proyectos/${project.id}/editar`} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/5">
                <SquarePen className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

