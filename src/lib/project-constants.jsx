import { formatCurrency } from './utils'

export const statusVariants = {
  PREPARACION: 'info',
  FINANCIAMIENTO: 'success',
  EJECUCION: 'warning',
  FINALIZADO: 'default',
  CANCELADO: 'error',
  RECHAZADO: 'error',
}

export const statusLabels = {
  PREPARACION: 'Preparación',
  FINANCIAMIENTO: 'En Financiamiento',
  EJECUCION: 'En Ejecución',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  RECHAZADO: 'Rechazado',
}

export function FundingProgress({ raised, required, compact }) {
  if (!required) return null
  const percent = raised ? Math.min(Math.ceil((raised / required) * 100), 100) : 0
  return (
    <div className="space-y-1">
      {!compact && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Progreso de financiamiento</span>
          <span className="text-white font-semibold">{percent}%</span>
        </div>
      )}
      {compact && (
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-500">Progreso</span>
          <span className="text-slate-300 font-medium">{percent}%</span>
        </div>
      )}
      <div className={`${compact ? 'h-1.5' : 'h-2.5'} bg-white/5 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            compact
              ? 'bg-gradient-to-r from-violet-500 to-emerald-500'
              : 'bg-gradient-to-r from-violet-500 via-violet-400 to-emerald-400'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className={`flex justify-between ${compact ? 'text-[10px] text-slate-500' : 'text-sm'}`}>
        <span className={compact ? '' : 'text-emerald-300 font-medium'}>{raised ? formatCurrency(raised) : '$ 0'}</span>
        <span className={compact ? '' : 'text-slate-500'}>{formatCurrency(required)}</span>
      </div>
    </div>
  )
}
