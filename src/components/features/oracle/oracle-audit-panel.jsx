import { ShieldCheck, ExternalLink, TrendingUp, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

function ChainlinkBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-medium select-none">
      <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
      Validado vía Oráculo Chainlink
    </div>
  )
}

function BlockExplorerLink({ txHash }) {
  if (!txHash) return null
  const url = `https://sepolia.basescan.org/tx/${txHash}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-mono"
    >
      {txHash.slice(0, 10)}...{txHash.slice(-8)}
      <ExternalLink className="w-3 h-3" />
    </a>
  )
}

function ReportRow({ entry }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <TrendingUp className="w-3.5 h-3.5" />
          Facturación reportada
        </div>
        <p className="text-sm font-semibold text-emerald-300">
          {entry.montoFacturado != null ? formatCurrency(entry.montoFacturado) : '—'}
        </p>
      </div>

      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Clock className="w-3.5 h-3.5" />
          Fecha del reporte
        </div>
        <p className="text-sm font-semibold text-slate-300">
          {entry.fechaReporte ? formatDateTime(entry.fechaReporte) : '—'}
        </p>
      </div>

      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <ExternalLink className="w-3.5 h-3.5" />
          Transacción en blockchain
        </div>
        {entry.txHash ? (
          <BlockExplorerLink txHash={entry.txHash} />
        ) : (
          <p className="text-sm font-semibold text-slate-500">—</p>
        )}
      </div>
    </div>
  )
}

export function OracleAuditPanel({ projectId, report, isLoading, isError }) {
  if (isLoading) {
    return (
      <section className="pt-4 border-t border-white/5 space-y-3">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Auditoría On-Chain
        </h3>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando reporte del oráculo...
        </div>
      </section>
    )
  }

  const reports = Array.isArray(report) ? report : []

  if (isError || reports.length === 0) {
    return (
      <section className="pt-4 border-t border-white/5 space-y-3">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Auditoría On-Chain
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
          Sin reporte disponible para este proyecto.
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Panel de auditoría on-chain" className="pt-4 border-t border-white/5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Auditoría On-Chain
        </h3>
        <ChainlinkBadge />
      </div>

      <div className="space-y-3">
        {reports.map((entry, i) => (
          <ReportRow key={entry.txHash ?? i} entry={entry} />
        ))}
      </div>
    </section>
  )
}
