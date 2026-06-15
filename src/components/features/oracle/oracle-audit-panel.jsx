import { ShieldCheck, ExternalLink, TrendingUp, Clock, AlertCircle, Loader2, CheckCircle2, XCircle, FileText, Scale } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

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

function ResultadoBadge({ resultado }) {
  if (resultado === 'APROBADO') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
        <CheckCircle2 className="w-3 h-3" />
        Aprobado
      </span>
    )
  }
  if (resultado === 'RECHAZADO') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/25">
        <XCircle className="w-3 h-3" />
        Rechazado
      </span>
    )
  }
  return null
}

function AuditFindingCard({ finding }) {
  return (
    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ResultadoBadge resultado={finding.resultado} />
          {finding.txHash && <BlockExplorerLink txHash={finding.txHash} />}
        </div>
        <span className="text-[11px] text-slate-500">
          {finding.createdAt ? formatDateTime(finding.createdAt) : '—'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <span className="text-slate-500">Documentación KYB</span>
          {finding.kybUrl ? (
            <a
              href={finding.kybUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors break-all"
            >
              <FileText className="w-3 h-3 shrink-0" />
              {finding.kybUrl.length > 50
                ? `${finding.kybUrl.slice(0, 50)}...`
                : finding.kybUrl}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ) : (
            <span className="text-slate-600">—</span>
          )}
        </div>

        {finding.observaciones && (
          <div className="space-y-1 sm:col-span-2">
            <span className="text-slate-500">Observaciones</span>
            <p className="text-slate-300 leading-relaxed">{finding.observaciones}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function OracleReportRow({ entry }) {
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

export function OracleAuditPanel({ projectId, projectStatus, report, findings, isLoading, isError }) {
  if (isLoading) {
    return (
      <section className="pt-4 border-t border-white/5 space-y-3">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Auditoría
        </h3>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando información de auditoría...
        </div>
      </section>
    )
  }

  const auditFindings = Array.isArray(findings) ? findings : []
  const reports = Array.isArray(report) ? report : []
  const hasAudit = auditFindings.length > 0
  const hasReports = reports.length > 0
  const isInAuditoria = projectStatus === 'EN_AUDITORIA'

  if (!hasAudit && !hasReports && !isInAuditoria) {
    return null
  }

  return (
    <section aria-label="Panel de auditoría" className="pt-4 border-t border-white/5 space-y-4">
      {/* Audit findings */}
      {hasAudit && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            Dictamen de auditoría
          </h3>
          <div className="space-y-3">
            {auditFindings.map((finding, i) => (
              <AuditFindingCard key={finding.id ?? i} finding={finding} />
            ))}
          </div>
        </div>
      )}

      {/* Pending audit notice */}
      {isInAuditoria && !hasAudit && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            Auditoría pendiente
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Este proyecto está esperando la revisión de un auditor.
          </div>
        </div>
      )}

      {/* Oracle billing reports (solo para EJECUCION/FINALIZADO) */}
      {hasReports && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Reportes de facturación
            </h3>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-medium select-none">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              Validado vía Oráculo
            </span>
          </div>

          <div className="space-y-3">
            {reports.map((entry, i) => (
              <OracleReportRow key={entry.txHash ?? i} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
