import { AlertTriangle } from 'lucide-react'

export function ProjectFailedBanner({ project }) {
  if (project.estado !== 'RECHAZADO' && project.estado !== 'CANCELADO') return null

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-red-300">
            Proyecto no financiado
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {project.estado === 'RECHAZADO'
              ? 'Este proyecto no alcanzó su meta mínima de financiamiento. Los inversores fueron reembolsados automáticamente.'
              : 'Este proyecto fue cancelado.'}
          </p>
        </div>
      </div>
    </div>
  )
}
