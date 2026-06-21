import { useGamification } from '@/hooks/use-gamification'
import { Star, Shield, Trophy, Crown, CheckCircle2, Loader2, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const LEVELS = {
  STARTER: {
    label: 'Starter',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    icon: Star,
    benefits: [
      'Cross-rewards boost x1',
      'Poder de voto x1 en la gobernanza',
      'Acceso al IdeaWrapped Básico'
    ]
  },
  INVESTOR: {
    label: 'Investor',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: Shield,
    benefits: [
      'Cross-rewards boost x1.5',
      'Poder de voto x1.25 en la gobernanza',
      'Acceso al IdeaWrapped Completo'
    ]
  },
  PARTNER: {
    label: 'Partner',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: Trophy,
    benefits: [
      'Cross-rewards boost x2',
      'Poder de voto x2 en la gobernanza',
      'Preview de proyectos (24hs antes)',
      'IdeaWrapped Completo + Ranking Global'
    ]
  },
  VISIONARY: {
    label: 'Visionary',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    icon: Crown,
    benefits: [
      'Cross-rewards boost x3',
      'Poder de voto x3 en la gobernanza',
      'Preview de proyectos + Exclusividad de Inversión 48hs',
      'IdeaWrapped Completo + Badge Exclusivo'
    ]
  }
}

export function InvestorLevelCard() {
  const { data, isLoading, error } = useGamification()

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-white/5 bg-card shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    )
  }

  if (error || !data) {
    console.error("Error cargando gamification:", error);
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 shadow-sm p-4 text-center">
        Error al cargar los beneficios: {error?.message || "No se pudo conectar"}. Por favor intenta recargar.
      </div>
    );
  }

  const userLevelCode = data.nivel_inversor || 'STARTER'
  const levelData = LEVELS[userLevelCode] || LEVELS.STARTER
  const Icon = levelData.icon

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/5 bg-[#0B0F19] shadow-lg transition-all hover:shadow-xl relative group`}>
      {/* Subtle background glow based on level color */}
      <div className={`absolute top-0 right-0 w-64 h-64 opacity-[0.15] pointer-events-none rounded-full blur-3xl transition-opacity group-hover:opacity-25 ${levelData.bgColor.replace('/10', '')}`} style={{ transform: 'translate(30%, -30%)' }} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
      
      <div className={`flex items-center gap-5 border-b border-white/5 p-6 relative z-10`}>
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${levelData.bgColor} ${levelData.borderColor} border shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
          <Icon className={`h-8 w-8 ${levelData.color}`} />
        </div>
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Nivel Actual</h3>
          <div className="flex items-center gap-2">
            <h2 className={`text-3xl font-extrabold tracking-tight ${levelData.color} drop-shadow-sm`}>{levelData.label}</h2>
          </div>
        </div>
      </div>

      <div className="p-6 relative z-10 bg-gradient-to-b from-transparent to-[#050810]/50">
        <h4 className="mb-4 text-sm font-semibold text-slate-200">Tus Privilegios y Beneficios:</h4>
        <ul className="space-y-4 mb-8">
          {levelData.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div className={`p-1 rounded-full ${levelData.bgColor} ${levelData.borderColor} border`}>
                <CheckCircle2 className={`h-3 w-3 shrink-0 ${levelData.color}`} />
              </div>
              <span className="text-sm font-medium text-slate-300">{benefit}</span>
            </li>
          ))}
        </ul>

        <Dialog>
          <DialogTrigger asChild>
            <Button className={`w-full h-11 gap-2 border border-white/10 ${levelData.bgColor} hover:bg-white/10 text-white font-semibold transition-all shadow-sm rounded-xl`}>
              <Info className="w-4 h-4 opacity-70" />
              Descubrir cómo subir de nivel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col border-white/10 bg-[#0B0F19] text-slate-200 shadow-2xl p-0 overflow-hidden">
            <div className="shrink-0 p-8 pb-6 text-center relative overflow-hidden border-b border-white/5">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>
              <DialogTitle className="text-3xl font-extrabold text-white relative z-10 flex items-center justify-center gap-3">
                <Trophy className="w-8 h-8 text-amber-400 drop-shadow-md" />
                Camino del Inversor
              </DialogTitle>
              <p className="text-slate-400 mt-3 max-w-lg mx-auto relative z-10 text-sm leading-relaxed">
                Mejorá tu nivel invirtiendo en distintos proyectos y desbloqueá beneficios exclusivos diseñados para potenciar tus ganancias.
              </p>
            </div>

            <div className="overflow-y-auto flex-1 p-6 lg:p-8 bg-[#0a0f1c]/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* === STARTER === */}
                <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-6 flex flex-col relative transition-all hover:-translate-y-1 hover:shadow-xl hover:border-white/10 shadow-lg">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Star className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-400">Starter</h3>
                      <p className="text-xs text-slate-400">Nivel Inicial</p>
                    </div>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Requisitos</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-slate-300"><span className="text-emerald-500/50 mt-0.5">•</span> 1 Proyecto fondeado</li>
                        <li className="flex items-start gap-2 text-sm text-slate-300"><span className="text-emerald-500/50 mt-0.5">•</span> 1 Creador distinto</li>
                        <li className="flex items-start gap-2 text-sm text-slate-300"><span className="text-emerald-500/50 mt-0.5">•</span> Sin monto mínimo</li>
                      </ul>
                    </div>
                    <div className="h-px bg-white/5 w-full"></div>
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-3">Beneficios</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-500/50 shrink-0 mt-0.5" /> Boost de ganancias x1</li>
                        <li className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-500/50 shrink-0 mt-0.5" /> Poder de voto x1</li>
                        <li className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-500/50 shrink-0 mt-0.5" /> IdeaWrapped Básico</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* === INVESTOR === */}
                <div className="rounded-2xl border border-blue-500/10 bg-[#0f172a] p-6 flex flex-col relative transition-all hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/30 shadow-lg">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-400">Investor</h3>
                      <p className="text-xs text-slate-400">Inversor Activo</p>
                    </div>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Requisitos</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-slate-300"><span className="text-blue-500/50 mt-0.5">•</span> 3+ Proyectos fondeados</li>
                        <li className="flex items-start gap-2 text-sm text-slate-300"><span className="text-blue-500/50 mt-0.5">•</span> 2+ Creadores distintos</li>
                        <li className="flex items-start gap-2 text-sm text-slate-300"><span className="text-blue-500/50 mt-0.5">•</span> +USD 2.000 invertidos</li>
                      </ul>
                    </div>
                    <div className="h-px bg-white/5 w-full"></div>
                    <div>
                      <h4 className="text-xs font-semibold text-blue-500/70 uppercase tracking-wider mb-3">Beneficios</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm text-white font-medium"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> Boost de ganancias x1.5</li>
                        <li className="flex items-start gap-2 text-sm text-white font-medium"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> Poder de voto x1.25</li>
                        <li className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-blue-500/50 shrink-0 mt-0.5" /> IdeaWrapped Completo</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* === PARTNER === */}
                <div className="rounded-2xl border border-amber-500/30 bg-[#0f172a] p-6 flex flex-col relative transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 shadow-lg shadow-amber-500/5 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40 shadow-inner">
                      <Trophy className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-400">Partner</h3>
                      <p className="text-xs text-amber-400/70">Inversor Estratégico</p>
                    </div>
                  </div>

                  <div className="space-y-6 flex-1 relative z-10">
                    <div>
                      <h4 className="text-xs font-semibold text-amber-500/50 uppercase tracking-wider mb-3">Requisitos</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-slate-200"><span className="text-amber-500/50 mt-0.5">•</span> 7+ Proyectos fondeados</li>
                        <li className="flex items-start gap-2 text-sm text-slate-200"><span className="text-amber-500/50 mt-0.5">•</span> 5+ Creadores distintos</li>
                        <li className="flex items-start gap-2 text-sm text-slate-200"><span className="text-amber-500/50 mt-0.5">•</span> +USD 10.000 invertidos</li>
                      </ul>
                    </div>
                    <div className="h-px bg-amber-500/10 w-full"></div>
                    <div>
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Beneficios Top</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm text-white font-medium"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Boost de ganancias x2</li>
                        <li className="flex items-start gap-2 text-sm text-white font-medium"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Poder de voto x2</li>
                        <li className="flex items-start gap-2 text-sm text-amber-100 font-medium"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Preview de Proyectos (24hs antes)</li>
                        <li className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-amber-500/50 shrink-0 mt-0.5" /> IdeaWrapped + Ranking Global</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* === VISIONARY === */}
                <div className="rounded-2xl border border-violet-500/40 bg-[#0f172a] p-6 flex flex-col relative transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/20 shadow-xl shadow-violet-500/10 overflow-hidden ring-1 ring-violet-500/20">
                  <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none"></div>
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/30 blur-3xl rounded-full"></div>
                  
                  {/* Badge Exclusivo */}
                  <div className="absolute top-0 right-0 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-md">
                    Máximo Nivel
                  </div>

                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      <Crown className="w-6 h-6 text-violet-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-violet-300 drop-shadow-md">Visionary</h3>
                      <p className="text-xs text-violet-400/80 font-medium">Inversor Élite</p>
                    </div>
                  </div>

                  <div className="space-y-6 flex-1 relative z-10">
                    <div>
                      <h4 className="text-xs font-semibold text-violet-300/70 uppercase tracking-wider mb-3">Requisitos Élite</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-white font-medium"><span className="text-violet-400 mt-0.5">•</span> 15+ Proyectos fondeados</li>
                        <li className="flex items-start gap-2 text-sm text-white font-medium"><span className="text-violet-400 mt-0.5">•</span> 10+ Creadores distintos</li>
                        <li className="flex items-start gap-2 text-sm text-white font-medium"><span className="text-violet-400 mt-0.5">•</span> +USD 50.000 invertidos</li>
                      </ul>
                    </div>
                    <div className="h-px bg-violet-500/20 w-full"></div>
                    <div>
                      <h4 className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        Beneficios Exclusivos
                      </h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm text-white font-bold"><CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" /> Boost de ganancias x3</li>
                        <li className="flex items-start gap-2 text-sm text-white font-bold"><CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" /> Poder de voto x3</li>
                        <li className="flex items-start gap-2 text-sm text-violet-200 font-semibold"><CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" /> Preview + Exclusividad 48hs</li>
                        <li className="flex items-start gap-2 text-sm text-violet-200 font-semibold"><CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" /> IdeaWrapped + Badge Élite</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="shrink-0 p-5 bg-[#080b13] border-t border-white/5">
              <p className="text-sm text-slate-400 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Tu nivel y privilegios se calculan y actualizan automáticamente al instante tras cada inversión.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
