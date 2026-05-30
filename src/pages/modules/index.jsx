import { useState } from 'react'
import { useModulesStatus, useDashboardStats } from '@/hooks/use-modules'
import { Loader2, ChevronDown, ChevronRight, Grip } from 'lucide-react'

const estadoIcon = {
  hecho: { icon: '✅', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  progreso: { icon: '🔄', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  pendiente: { icon: '⏳', color: 'bg-slate-700/50 text-slate-400 border-slate-600/30' },
}

export default function ModulesPage() {
  const { data, isLoading } = useModulesStatus()
  const { data: stats } = useDashboardStats()
  const [expanded, setExpanded] = useState({})

  const modulos = data?.modulos ?? []
  const totalEtapas = modulos.reduce((sum, m) => sum + m.etapas.length, 0)
  const hechas = modulos.reduce((sum, m) => sum + m.etapas.filter(e => e.estado === 'hecho').length, 0)
  const pct = totalEtapas > 0 ? Math.round((hechas / totalEtapas) * 100) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Estado de Módulos</h1>
        <p className="text-sm text-slate-400 mt-1">Progreso del desarrollo del sistema</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">
            {hechas} de {totalEtapas} etapas completadas
          </span>
          <span className="text-lg font-bold text-violet-400">{pct}%</span>
        </div>
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {modulos.map((modulo) => {
          const hechasMod = modulo.etapas.filter(e => e.estado === 'hecho').length
          const totalMod = modulo.etapas.length
          const isOpen = expanded[modulo.nombre]

          return (
            <div
              key={modulo.nombre}
              className="bg-slate-800/30 border border-slate-700/30 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(prev => ({ ...prev, [modulo.nombre]: !isOpen }))}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-700/20 transition-colors text-left"
              >
                {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                <Grip className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{modulo.nombre}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 flex-1 bg-slate-700/50 rounded-full max-w-[200px]">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${totalMod > 0 ? (hechasMod / totalMod) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{hechasMod}/{totalMod}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${hechasMod === totalMod ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700/30 text-slate-400 border-slate-600/30'}`}>
                  {hechasMod === totalMod ? 'Completo' : `${pctMod(hechasMod, totalMod)}%`}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700/30 divide-y divide-slate-700/20">
                  {modulo.etapas.map((etapa) => {
                    const st = estadoIcon[etapa.estado] || estadoIcon.pendiente
                    return (
                      <div key={etapa.nombre} className="p-4 pl-12 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span>{st.icon}</span>
                          <span className="text-sm text-white">{etapa.nombre}</span>
                          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${st.color}`}>
                            {etapa.estado}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{etapa.descripcion}</p>
                        {etapa.entregables?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {etapa.entregables.map((e) => (
                              <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/30 text-slate-400 font-mono">
                                {e}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {stats && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
          <h2 className="text-sm font-medium text-white mb-4">Estadísticas del Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Usuarios" value={stats.totalUsuarios ?? '—'} />
            <StatCard label="Proyectos" value={stats.totalProyectos ?? '—'} />
            <StatCard label="Inversiones" value={stats.totalInversiones ?? '—'} />
            <StatCard label="Monto Total" value={stats.montoTotalInvertido ? `${Number(stats.montoTotalInvertido).toFixed(2)} $IDEA` : '—'} />
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-700/20 rounded-lg p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  )
}

function pctMod(hechas, total) {
  if (total === 0) return 0
  return Math.round((hechas / total) * 100)
}
