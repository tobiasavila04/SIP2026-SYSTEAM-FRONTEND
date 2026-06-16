import { useState } from 'react'
import { ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useSubmitFinding } from '@/hooks/use-audit'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const RESULTADOS = [
  { value: 'APROBADO', label: 'Aprobar', icon: CheckCircle2, className: 'bg-emerald-600 hover:bg-emerald-500 text-white data-state-active:ring-2 data-state-active:ring-emerald-400' },
  { value: 'RECHAZADO', label: 'Rechazar', icon: XCircle, className: 'bg-red-600 hover:bg-red-500 text-white data-state-active:ring-2 data-state-active:ring-red-400' },
]

export function AuditReviewDialog({ open, onOpenChange, projectId, projectTitle }) {
  const [kybUrl, setKybUrl] = useState('')
  const [resultado, setResultado] = useState(null)
  const [observaciones, setObservaciones] = useState('')
  const mutation = useSubmitFinding(projectId)

  const handleSubmit = async () => {
    if (!kybUrl.trim()) {
      toast.error('La URL del documento KYB es obligatoria')
      return
    }
    if (!resultado) {
      toast.error('Seleccioná aprobar o rechazar')
      return
    }

    try {
      await mutation.mutateAsync({
        kybUrl: kybUrl.trim(),
        resultado,
        observaciones: observaciones.trim() || undefined,
      })
      toast.success(
        resultado === 'APROBADO'
          ? `Proyecto "${projectTitle}" aprobado → pasa a Financiamiento`
          : `Proyecto "${projectTitle}" rechazado`
      )
      setKybUrl('')
      setResultado(null)
      setObservaciones('')
      onOpenChange(false)
    } catch (err) {
      toast.error(err?.message || 'Error al enviar dictamen')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !mutation.isPending) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            Auditoría de proyecto
          </DialogTitle>
          <DialogDescription>
            Revisá la documentación y registrá el dictamen mediante el oráculo en la blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project name */}
          <div>
            <p className="text-sm text-slate-400">Proyecto</p>
            <p className="text-sm font-semibold text-white">{projectTitle}</p>
          </div>

          {/* KYB URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Documentación KYB *
            </label>
            <input
              type="url"
              value={kybUrl}
              onChange={(e) => setKybUrl(e.target.value)}
              placeholder="https://bucket.systeam.com/kyb/proyecto-42.pdf"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            />
            <p className="text-[11px] text-slate-600">
              URL del documento KYB subido al bucket seguro
            </p>
          </div>

          {/* Resultado */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Dictamen *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {RESULTADOS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setResultado(r.value)}
                  data-state={resultado === r.value ? 'active' : 'inactive'}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    resultado === r.value
                      ? r.className
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <r.icon className="w-4 h-4" />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Resultado de la auditoría externa, inconsistencias detectadas, etc."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={mutation.isPending || !kybUrl.trim() || !resultado}
            className={resultado === 'APROBADO'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white gap-2'
              : resultado === 'RECHAZADO'
                ? 'bg-red-600 hover:bg-red-500 text-white gap-2'
                : 'gap-2'
            }
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : resultado === 'APROBADO' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : resultado === 'RECHAZADO' ? (
              <XCircle className="w-4 h-4" />
            ) : null}
            {mutation.isPending ? 'Registrando en oráculo...' : 'Registrar dictamen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
