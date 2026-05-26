import { motion } from 'framer-motion'
import { useWalletSummary } from '@/hooks/use-wallet'
import { useInvestmentHistory } from '@/hooks/use-investment-history'
import { ExternalLink, Loader2, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { formatCurrency } from '@/lib/utils'

const ETHERSCAN_BASE = 'https://sepolia.etherscan.io/tx'

export default function InvestmentHistoryPage() {
  const { data: walletSummary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useWalletSummary()
  const { data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = useInvestmentHistory()

  const isLoading = summaryLoading || historyLoading
  const isError = summaryError || historyError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState message="No se pudieron cargar las inversiones." onRetry={() => { refetchSummary(); refetchHistory() }} />
  }

  const portfolio = walletSummary?.portfolio ?? []
  const saldoIdea = walletSummary?.saldoIdea ?? 0
  const rawInvestments = Array.isArray(history) ? history : history?.content ?? []

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard label="Balance $IDEA" value={`${Number(saldoIdea).toLocaleString()} $IDEA`} />
        <SummaryCard label="Proyectos invertidos" value={portfolio?.length ?? 0} />
      </div>

      <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          {rawInvestments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No hay inversiones registradas aún.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Proyecto</th>
                  <th className="px-4 py-3 font-medium">Monto $IDEA</th>
                  <th className="px-4 py-3 font-medium">Sub-tokens</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">TX Hash</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rawInvestments.map((inv, i) => (
                  <tr key={inv.id ?? i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white">{inv.proyectoTitulo ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {inv.montoIdea != null ? `${Number(inv.montoIdea).toLocaleString()} $IDEA` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {inv.subTokensRecibidos ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {inv.createdAt ? format(new Date(inv.createdAt), 'dd MMM yyyy', { locale: es }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {inv.txHash ? (
                        <a
                          href={`${ETHERSCAN_BASE}/${inv.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors font-mono text-xs"
                        >
                          {inv.txHash.slice(0, 10)}...{inv.txHash.slice(-8)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        inv.estado === 'CONFIRMADA'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : inv.estado === 'REEMBOLSADA'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {inv.estado ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  )
}
