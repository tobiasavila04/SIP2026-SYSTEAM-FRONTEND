import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWalletSummary } from '@/hooks/use-wallet'
import { useInvestmentHistory } from '@/hooks/use-investment-history'
import { TxHashLink } from '@/components/shared/tx-hash-link'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  TrendingUp, ExternalLink, Loader2, RefreshCw,
  Wallet, CheckCircle2, ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function StatusBadgeInvestment({ estado }) {
  const config = {
    CONFIRMADA: {
      variant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      label: 'Confirmada',
      tooltip: 'Inversión confirmada en blockchain',
    },
    REEMBOLSADA: {
      variant: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      label: 'Reembolsada',
      tooltip: 'Reintegrado automáticamente',
    },
    PENDIENTE: {
      variant: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      label: 'Pendiente',
      tooltip: 'Esperando confirmación blockchain',
    },
  }
  const c = config[estado] || config.PENDIENTE

  return (
    <span title={c.tooltip} className={cn(
      'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border',
      c.variant
    )}>
      {estado === 'REEMBOLSADA' && <RefreshCw className="w-3 h-3" />}
      {estado === 'CONFIRMADA' && <CheckCircle2 className="w-3 h-3" />}
      {c.label}
    </span>
  )
}

export default function InvestmentHistoryPage() {
  const [page, setPage] = useState(0)
  const { data: walletSummary, isLoading: summaryLoading } = useWalletSummary()
  const { data: historyPage, isLoading: historyLoading, isError, refetch } = useInvestmentHistory(page, 10)
  const isLoading = summaryLoading || historyLoading
  const portfolio = walletSummary?.portfolio ?? []
  const saldoIdea = walletSummary?.balances?.idea ?? 0
  const investments = historyPage?.content ?? []
  const totalPages = historyPage?.totalPages ?? 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState message="No se pudieron cargar las inversiones." onRetry={refetch} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        icon={TrendingUp}
        title="Mis Inversiones"
        description="Resumen de tu cartera y actividad de inversión on-chain"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={Wallet}
          label="Balance $IDEA"
          value={`${Number(saldoIdea).toLocaleString()} $IDEA`}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Proyectos invertidos"
          value={portfolio?.length ?? 0}
        />
        <SummaryCard
          icon={RefreshCw}
          label="Reembolsados"
          value={investments.filter(i => i.estado === 'REEMBOLSADA').length}
        />
      </div>

      <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          {investments.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No tenés inversiones todavía"
              description="Invertí en un proyecto para verlo reflejado en tu historial."
              action={{
                label: 'Explorar proyectos',
                to: '/proyectos'
              }}
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Proyecto</th>
                  <th className="px-4 py-3 font-medium">Monto</th>
                  <th className="px-4 py-3 font-medium">Sub-tokens</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Comprobante</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {investments.map((inv, i) => {
                  const isRefundable = inv.estado === 'CONFIRMADA' && inv.proyectoEstado === 'RECHAZADO'
                  return (
                    <tr key={inv.id ?? i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          to={`/proyectos/${inv.proyectoId}`}
                          className="text-white hover:text-violet-300 transition-colors font-medium inline-flex items-center gap-1"
                        >
                          {inv.proyectoTitulo ?? '—'}
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {inv.montoIdea != null ? `${Number(inv.montoIdea).toLocaleString()} $IDEA` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {inv.subTokensRecibidos ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {inv.createdAt ? format(new Date(inv.createdAt), 'dd MMM yyyy', { locale: es }) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {inv.txHash ? (
                          <TxHashLink hash={inv.txHash} />
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadgeInvestment estado={inv.estado} />
                      </td>
                      <td className="px-4 py-3">
                        {/* El reembolso ahora es procesado automáticamente por el backend */}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </motion.div>
  )
}

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
