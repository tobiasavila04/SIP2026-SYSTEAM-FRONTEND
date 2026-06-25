import { useState } from 'react'
import { motion } from 'framer-motion'
import { useEventos } from '@/hooks/use-governance'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Calendar,
  MapPin,
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react'

function formatFecha(fechaStr) {
  if (!fechaStr) return '--'
  const date = new Date(fechaStr)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function EventCard({ evento, onClick }) {
  const attended = evento.asistenciaConfirmada === true
  const reward = Number(evento.rewardAmount ?? 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="group relative rounded-xl border border-white/5 bg-card hover:border-violet-500/20 transition-all duration-300 ease-out flex flex-col h-full overflow-hidden cursor-pointer"
    >
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
              {evento.titulo}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {evento.descripcion || 'Sin descripcion'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatFecha(evento.fechaEvento)}</span>
          </div>
          {evento.lugar && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px]">{evento.lugar}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
          <Badge
            variant="outline"
            className={
              attended
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : 'border-slate-600 text-slate-400'
            }
          >
            <Users className="w-3 h-3 mr-1" />
            {attended ? 'Asistencia confirmada' : 'No asistido'}
          </Badge>

          {reward > 0 && attended && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
              <Award className="w-3 h-3" />
              +{reward} $IDEA
            </span>
          )}
          {reward > 0 && !attended && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Award className="w-3 h-3" />
              {reward} $IDEA
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function EventosPage() {
  const [page, setPage] = useState(0)
  const [selectedEvento, setSelectedEvento] = useState(null)
  const size = 12

  const { data, isLoading, isError, refetch } = useEventos(page, size)

  const eventos = data?.content ?? (Array.isArray(data) ? data : [])
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Calendar}
        title="Eventos"
        description="Eventos de la comunidad, tu asistencia y recompensas obtenidas"
      />

      {isError ? (
        <ErrorState
          message="No se pudieron cargar los eventos."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : eventos.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No hay eventos"
          description="Todavia no hay eventos disponibles en la comunidad."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {eventos.map((evento) => (
              <EventCard key={evento.id} evento={evento} onClick={() => setSelectedEvento(evento)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <span className="text-sm text-slate-400">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!selectedEvento} onOpenChange={(open) => { if (!open) setSelectedEvento(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-400" />
              {selectedEvento?.titulo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedEvento?.descripcion && (
              <p className="text-sm text-slate-400">{selectedEvento.descripcion}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>{formatFecha(selectedEvento?.fechaEvento)}</span>
              </div>
              {Number(selectedEvento?.rewardAmount ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Award className="w-4 h-4" />
                  <span>{Number(selectedEvento?.rewardAmount)} $IDEA</span>
                </div>
              )}
            </div>

            {selectedEvento?.cronograma && (() => {
              try {
                const items = JSON.parse(selectedEvento.cronograma)
                if (!Array.isArray(items) || items.length === 0) return null
                return (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Cronograma
                    </h4>
                    <div className="space-y-0">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 py-2 border-l-2 border-violet-500/30 pl-4 ml-1">
                          <span className="text-xs font-bold text-violet-400 whitespace-nowrap mt-0.5">
                            {item.hora}
                          </span>
                          <span className="text-sm text-white">{item.tema}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              } catch { return null }
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
