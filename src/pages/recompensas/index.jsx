import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { useRewardsHistory } from '@/hooks/use-rewards'
import { RewardsSummaryWidget } from '@/components/features/rewards/rewards-summary-widget'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Receipt,
  TrendingDown,
} from 'lucide-react'

const REASON_LABELS = {
  VOTE_REWARD: 'Recompensa de voto',
  EVENT_ATTENDANCE: 'Asistencia a evento',
}

const REASON_BADGES = {
  VOTE_REWARD: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  EVENT_ATTENDANCE: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
}

function formatFecha(fechaStr) {
  if (!fechaStr) return '--'
  const date = new Date(fechaStr)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatHora(fechaStr) {
  if (!fechaStr) return '--'
  const date = new Date(fechaStr)
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RecompensasPage() {
  const [page, setPage] = useState(0)
  const size = 20
  const [reasonFilter, setReasonFilter] = useState('TODOS')

  const { data: govConfig } = useQuery({
    queryKey: ['governance-config'],
    queryFn: () => apiRequest(API_ENDPOINTS.GOVERNANCE_CONFIG),
    staleTime: 5 * 60 * 1000,
  })
  const baseCost = Number(govConfig?.voteCost ?? 0)
  const userVoteCost = Number(govConfig?.userVoteCost ?? govConfig?.voteCost ?? 0)
  const investmentCount = Number(govConfig?.investmentCount ?? 0)
  const hasDiscount = investmentCount > 0 && userVoteCost < baseCost

  const { data, isLoading, isError, refetch } = useRewardsHistory(page, size)

  const rewards = data?.content ?? (Array.isArray(data) ? data : [])
  const totalPages = data?.totalPages ?? 1

  const filteredRewards = rewards.filter((item) => {
    if (reasonFilter === 'TODOS') return true
    return item.reason === reasonFilter
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        icon={Trophy}
        title="Mis Recompensas"
        description="Historial de recompensas obtenidas y verificacion blockchain"
      />

      {/* Summary Widget */}
      <RewardsSummaryWidget />

      {/* Investor Discount Card */}
      {hasDiscount ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Descuento de inversor activo
              </p>
              <p className="text-xs text-emerald-300 mt-0.5">
                Invertiste en {investmentCount} proyecto{investmentCount !== 1 ? 's' : ''} — tu voto cuesta{' '}
                <strong>{userVoteCost} $IDEA</strong> en vez de {baseCost} $IDEA
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Por cada proyecto en el que invertís, se reduce el costo de votar.
              </p>
            </div>
          </div>
        </div>
      ) : investmentCount === 0 && govConfig ? (
        <div className="rounded-xl border border-white/5 bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">
                Descuento de inversor
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Inverti en proyectos para reducir el costo de tus votos. Cada inversion reduce el costo de votar.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filter */}
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Tipo de recompensa
          </label>
          <select
            value={reasonFilter}
            onChange={(e) => {
              setReasonFilter(e.target.value)
              setPage(0)
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1rem',
              backgroundRepeat: 'no-repeat',
              paddingRight: '2.5rem',
            }}
          >
            <option value="TODOS" className="bg-slate-900">Todas</option>
            <option value="VOTE_REWARD" className="bg-slate-900">Recompensa de voto</option>
            <option value="EVENT_ATTENDANCE" className="bg-slate-900">Asistencia a evento</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : isError ? (
        <ErrorState
          message="No se pudieron cargar las recompensas."
          onRetry={() => refetch()}
        />
      ) : filteredRewards.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin recompensas"
          description="Todavia no tenes recompensas. Vota, asisti a eventos o inverti para ganar $IDEA."
        />
      ) : (
        <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Hora</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium text-right">Monto</th>
                  <th className="px-4 py-3 font-medium text-center">Verificacion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRewards.map((item, index) => {
                  const badgeClasses =
                    REASON_BADGES[item.reason] ||
                    'bg-white/5 text-white/70 border border-white/10'
                  const label =
                    REASON_LABELS[item.reason] || item.reason

                  return (
                    <tr
                      key={item.id ?? `${item.reason}-${index}`}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 text-white font-medium">
                        {formatFecha(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {formatHora(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-emerald-300 font-mono font-medium">
                          +{Number(item.amount ?? 0).toLocaleString()} $IDEA
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.txHash ? (
                          <a
                            href={`https://sepolia.basescan.org/tx/${item.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] px-1.5 py-0"
                            >
                              Verificado
                            </Badge>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                            Verificado en plataforma
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
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
    </motion.div>
  )
}
