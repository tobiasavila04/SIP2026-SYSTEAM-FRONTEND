import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Coins, Rocket, ShieldCheck, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProjectDisclaimerModal({ open, onOpenChange, onConfirm }) {
  const [accepted, setAccepted] = useState(false)

  // Reset the checkbox when modal opens
  useEffect(() => {
    if (open) setAccepted(false)
  }, [open])

  const handleConfirm = () => {
    if (accepted) {
      onConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] flex flex-col p-0 bg-gradient-to-b from-[#0B0E1A] to-[#070912] border border-white/[0.08] shadow-2xl shadow-black/80 overflow-hidden">
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        
        <DialogHeader className="px-6 pt-8 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Responsabilidades Financieras del Creador
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-sm pl-[52px]">
            Antes de publicar tu proyecto, es crucial que comprendas las condiciones financieras y tu compromiso con los inversores.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Sección 1 */}
          <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
            <div className="mt-1 shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center border border-blue-500/20">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                1. Etapa de Financiamiento
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Los fondos quedarán resguardados en la blockchain. El precio del sub-token es dinámico y <strong className="text-slate-300">aumenta por demanda tras alcanzar el 70% de recaudación</strong>. Los inversores recurrentes recibirán un <strong className="text-slate-300">Descuento por Lealtad (Cross-Rewards)</strong> que es <strong className="text-emerald-400">100% absorbido por IDEAFY</strong> mediante nuestro Fondo de Bonificación, asegurando que tu proyecto reciba el valor completo. Si no cumplís la meta en plazo, se reembolsará automáticamente.
              </p>
            </div>
          </div>

          {/* Sección 2 */}
          <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
            <div className="mt-1 shrink-0">
              <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center border border-violet-500/20">
                <Rocket className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                2. Etapa de Ejecución
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Al alcanzar la meta, los fondos se liberan para que desarrolles el proyecto. Tus sub-tokens comenzarán a tradearse en el Marketplace interno con tu precio base configurado como límite inferior de protección.
              </p>
            </div>
          </div>

          {/* Sección 3 */}
          <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
            <div className="mt-1 shrink-0">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                3. Etapa Finalizada (Dividendos)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deberás comenzar la <strong className="text-slate-300">distribución pasiva de dividendos</strong> a tus inversores de acuerdo con el rubro del proyecto. El mercado secundario seguirá operando con total normalidad.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/[0.01] border-t border-white/[0.06]">
          {/* Checkbox Interacción */}
          <label className="flex items-start gap-3 cursor-pointer group mb-6">
            <div className="relative flex items-center mt-0.5 shrink-0">
              <input 
                type="checkbox" 
                className="peer sr-only" 
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <div className={cn(
                "w-5 h-5 rounded border transition-all flex items-center justify-center",
                accepted 
                  ? "bg-violet-600 border-violet-600 shadow-[0_0_10px_rgba(124,58,237,0.4)]" 
                  : "bg-white/5 border-white/20 group-hover:border-violet-500/50"
              )}>
                {accepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
            </div>
            <span className={cn(
              "text-xs leading-relaxed select-none transition-colors",
              accepted ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"
            )}>
              Entiendo que el Descuento por Lealtad (Cross-Rewards) para inversores es cubierto íntegramente por la plataforma (garantizando que mi proyecto reciba el 100% del valor), y me comprometo al pago de dividendos en caso de éxito.
            </span>
          </label>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors"
            >
              Volver al editor
            </Button>
            <Button
              disabled={!accepted}
              onClick={handleConfirm}
              className={cn(
                "h-11 px-6 rounded-xl font-medium transition-all duration-300 shadow-lg",
                accepted 
                  ? "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20 hover:shadow-violet-500/40"
                  : "bg-slate-900/80 text-slate-500 border border-slate-800"
              )}
            >
              Publicar Proyecto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
