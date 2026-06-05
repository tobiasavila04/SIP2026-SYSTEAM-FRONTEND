import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWalletSummary } from '@/hooks/use-wallet'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils'
import {
  Wallet, Coins, TrendingUp, ExternalLink, Loader2
} from 'lucide-react'

export default function WalletPage() {
  const { data, isLoading, isError, refetch } = useWalletSummary()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState message="No se pudo cargar la billetera." onRetry={refetch} />
  }

  const balances = data?.balances ?? {}
  const portfolio = data?.portfolio ?? []
  const saldoIdea = Number(balances.idea ?? 0)
  const saldoUsdt = Number(balances.usdt ?? 0)
  const valorPortfolio = portfolio.reduce(
    (acc, p) => acc + (Number(p.cantidad) * Number(p.precioActual ?? 0)),
    0
  )
  const total = saldoIdea + saldoUsdt + valorPortfolio

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        icon={Wallet}
        title="Mi Billetera"
        description="Resumen de tu saldo y portfolio de subtokens"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceCard
          icon={Coins}
          label="$IDEA"
          value={`${saldoIdea.toLocaleString()} $IDEA`}
          sub="Token IDEAFY"
          accent="violet"
        />
        <BalanceCard
          icon={TrendingUp}
          label="USDT"
          value={`${saldoUsdt.toLocaleString()} USDT`}
          sub="Stablecoin"
          accent="emerald"
        />
        <BalanceCard
          icon={Wallet}
          label="Total portafolio"
          value={formatCurrency(total)}
          sub="IDEA + USDT + subtokens"
          accent="amber"
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
          <Coins className="w-4 h-4" />
          Mi Portfolio
        </h3>

        <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            {portfolio.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="No tenés subtokens todavía"
                description="Invertí en un proyecto para recibir subtokens."
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-medium">Proyecto</th>
                    <th className="px-4 py-3 font-medium">Subtoken</th>
                    <th className="px-4 py-3 font-medium">Cantidad</th>
                    <th className="px-4 py-3 font-medium">Precio actual</th>
                    <th className="px-4 py-3 font-medium">Valor total</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {portfolio.map((item, i) => {
                    const cantidad = Number(item.cantidad ?? 0)
                    const precio = Number(item.precioActual ?? 0)
                    const valor = cantidad * precio
                    return (
                      <tr key={item.subtokenId ?? i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-white font-medium">
                          {item.proyectoNombre ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {item.subtokenSimbolo ? `$ ${item.subtokenSimbolo}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {cantidad.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {precio > 0 ? `${precio.toFixed(2)} $IDEA` : '—'}
                        </td>
                        <td className="px-4 py-3 text-emerald-300 font-mono font-medium">
                          {valor > 0 ? `${valor.toFixed(2)} $IDEA` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/proyectos/${item.subtokenId}`}
                            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            Ver proyecto
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {portfolio.length > 0 && (
          <p className="text-xs text-slate-500 mt-3 text-right">
            Valor total portfolio: <span className="font-medium text-slate-300">{valorPortfolio.toFixed(2)} $IDEA</span>
          </p>
        )}
      </div>
    </motion.div>
  )
}

function BalanceCard({ icon: Icon, label, value, sub, accent }) {
  const gradientMap = {
    violet: 'from-violet-500/10 to-violet-600/5 border-violet-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
  }
  const iconMap = {
    violet: 'text-violet-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  }

  return (
    <div className={`p-5 rounded-xl bg-gradient-to-b ${gradientMap[accent]} border`}>
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <Icon className={`w-4 h-4 ${iconMap[accent]}`} />
        {label}
      </div>
      <p className="text-xl font-bold text-white mb-1">{value}</p>
      <p className="text-[11px] text-slate-500">{sub}</p>
    </div>
  )
}
