import { useState, useEffect, useMemo } from 'react';
import { useWrapped } from '@/hooks/use-wrapped';
import { Loader2, Share2, Rocket, TrendingUp, Trophy, Star, Shield, Crown, PlayCircle, ExternalLink, ShoppingCart } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function IdeaWrappedPage() {
  const { data: rawData, isLoading, error } = useWrapped();
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const data = rawData;
  const totalSlides = useMemo(() => {
    if (!data) return 0;
    let count = 4; // Intro + Proyectos + InversionMayor + TotalInversion
    if (data.transaccionesMarketplace > 0) count++;
    count++; // Nivel y Compartir
    return count;
  }, [data]);

  // Auto-advance slides every 6 seconds unless it's the last one
  useEffect(() => {
    if (!data || data.proyectosFondeados === 0 || currentSlide >= totalSlides - 1) return;
    
    const timer = setTimeout(() => {
      setCurrentSlide(prev => prev + 1);
    }, 6000);
    return () => clearTimeout(timer);
  }, [currentSlide, data, totalSlides]);


  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0F19] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          <h2 className="text-xl font-bold animate-pulse text-indigo-400">Calculando tus métricas del año...</h2>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0F19] text-white p-6">
        <div className="text-center max-w-md bg-red-500/10 border border-red-500/20 p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Ups, algo salió mal</h2>
          <p className="text-slate-400 mb-6">No pudimos cargar tu resumen. Intentá recargando la página.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="border-white/10 text-white">Reintentar</Button>
        </div>
      </div>
    );
  }

  // --- EMPTY STATE (VOT-PREM-03) ---
  if (data.proyectosFondeados === 0) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0F19] text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full mix-blend-screen"></div>
        
        <div className="relative z-10 max-w-lg w-full text-center bg-[#111827]/80 backdrop-blur-xl border border-white/5 p-10 rounded-3xl shadow-2xl">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
            <Rocket className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
            Tu viaje recién empieza
          </h1>
          <p className="text-lg text-slate-300 mb-8 leading-relaxed">
            Este año fue de preparación. El próximo año es tuyo. Mirá los proyectos que están rompiéndola ahora mismo y empezá a construir tu portafolio.
          </p>
          <Button onClick={() => navigate('/explorar')} size="lg" className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] rounded-xl transition-all">
            Explorar Catálogo <ExternalLink className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  // --- WRAPPED STORIES (VOT-PREM-01) ---
  const levelDetails = {
    STARTER: { color: 'text-emerald-400', icon: Star, badge: 'Básico' },
    INVESTOR: { color: 'text-blue-400', icon: Shield, badge: 'Completo' },
    PARTNER: { color: 'text-amber-400', icon: Trophy, badge: 'Completo + Ranking' },
    VISIONARY: { color: 'text-violet-400', icon: Crown, badge: 'Élite Badge' }
  };

  const lvl = levelDetails[data.nivel] || levelDetails.STARTER;
  const LevelIcon = lvl.icon;

  const slides = [
    // SLIDE 0: Intro
    (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-indigo-900 to-[#0B0F19] text-center p-8">
        <PlayCircle className="w-24 h-24 text-indigo-400 mb-8 animate-bounce opacity-80" />
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6 drop-shadow-lg">
          Tu IdeaWrapped 2026
        </h1>
        <p className="text-2xl text-slate-300 font-medium">Un año de apostar por grandes ideas.</p>
      </div>
    ),
    // SLIDE 1: Proyectos y Rubro
    (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-bl from-emerald-900 via-[#0B0F19] to-[#0B0F19] text-center p-8">
        <div className="bg-emerald-500/20 p-6 rounded-3xl mb-8 border border-emerald-500/30 animate-pulse">
          <Rocket className="w-16 h-16 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-emerald-100 mb-4">Este año respaldaste a</h2>
        <div className="text-7xl font-black text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
          {data.proyectosFondeados}
        </div>
        <h2 className="text-3xl font-bold text-emerald-100 mb-8">proyectos innovadores.</h2>
        
        <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/10 mt-4 w-full max-w-md shadow-2xl">
          <p className="text-emerald-200/80 uppercase tracking-widest text-sm font-bold mb-2">Tu Rubro Favorito</p>
          <p className="text-4xl font-black text-white capitalize mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{data.rubroFavorito}</p>
          
          {data.topProyectosRubro && data.topProyectosRubro.length > 0 && (
            <div className="text-left mt-4 border-t border-white/10 pt-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Tus favoritos acá:</p>
              <div className="flex flex-col gap-2">
                {data.topProyectosRubro.map((p, i) => (
                  <div key={i} className="bg-white/5 rounded px-3 py-2 text-emerald-100 text-sm font-medium border border-white/5">
                    {i+1}. {p}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    // SLIDE 2: Inversión Mayor (NUEVA SLIDE)
    (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-orange-900 via-[#0B0F19] to-[#0B0F19] text-center p-8">
        <Star className="w-20 h-20 text-orange-400 mb-8 opacity-90 animate-bounce" />
        <h2 className="text-2xl font-bold text-orange-100 mb-2">Hubo un proyecto en el que</h2>
        <h2 className="text-4xl font-black text-white mb-8">dejaste todo...</h2>
        
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-8 w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-yellow-500"></div>
          <p className="text-5xl font-black text-orange-400 mb-4 drop-shadow-md">
            {data.proyectoMasInvertido || 'Desconocido'}
          </p>
          <p className="text-orange-200 font-medium">Aportaste la increíble suma de</p>
          <p className="text-3xl font-black text-emerald-400 mt-2">
            ${Number(data.montoMasInvertido || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    ),
    // SLIDE 3: Inversión y ROI (PARA TODOS LOS NIVELES)
    (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-tr from-blue-900 via-[#0B0F19] to-[#0B0F19] text-center p-8">
        <TrendingUp className="w-20 h-20 text-blue-400 mb-8 opacity-80 animate-pulse" />
        <h2 className="text-3xl font-bold text-blue-100 mb-4">Invertiste un total de</h2>
        <div className="text-6xl md:text-7xl font-black text-blue-400 mb-8 drop-shadow-[0_0_20px_rgba(96,165,250,0.6)]">
          ${Number(data.totalInvertido).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        
        {data.roiPorcentaje > 0 ? (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
            <p className="text-blue-300 font-medium mb-2 uppercase tracking-widest text-sm">Retorno de Inversión</p>
            <p className="text-6xl font-black text-emerald-400">+{data.roiPorcentaje}%</p>
            <p className="text-xs text-blue-200/50 mt-4">Tus proyectos están rindiendo frutos reales.</p>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <p className="text-blue-300 font-medium mb-2 uppercase tracking-widest text-sm">Estado de Portafolio</p>
            <p className="text-3xl font-bold text-white mb-2">🌱 Semillas plantadas</p>
            <p className="text-sm text-blue-200">Tus proyectos están madurando. ¡Pronto verás los frutos!</p>
          </div>
        )}
      </div>
    ),
    // SLIDE 4: Marketplace (Si tiene transacciones)
    ...(data.transaccionesMarketplace > 0 ? [(
      <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-tr from-fuchsia-900 via-[#0B0F19] to-[#0B0F19] text-center p-8">
        <ShoppingCart className="w-20 h-20 text-fuchsia-400 mb-8 opacity-80 animate-bounce" />
        <h2 className="text-3xl font-bold text-fuchsia-100 mb-4">Tu impacto en el Marketplace</h2>
        <div className="text-7xl font-black text-fuchsia-400 mb-4 drop-shadow-[0_0_20px_rgba(232,121,249,0.6)]">
          {data.transaccionesMarketplace}
        </div>
        <h2 className="text-2xl font-bold text-fuchsia-100 mb-8">transacciones realizadas</h2>
        
        <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
          <p className="text-fuchsia-300 font-medium mb-2 uppercase tracking-widest text-sm">Volumen Operado</p>
          <p className="text-5xl font-black text-emerald-400">${Number(data.volumenMarketplace).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    )] : []),
    // SLIDE 5: Nivel, Ranking y Compartir
    (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-violet-900 to-[#0B0F19] text-center p-8">
        <div className="w-32 h-32 rounded-full bg-black/40 border-4 border-white/10 flex items-center justify-center mb-6 relative overflow-hidden shadow-2xl">
          <div className={`absolute inset-0 opacity-30 bg-current ${lvl.color}`}></div>
          <LevelIcon className={`w-16 h-16 ${lvl.color} drop-shadow-md z-10`} />
        </div>

        {data.nivel === 'VISIONARY' && (
          <div className="bg-violet-500/20 text-violet-300 font-bold px-4 py-1 rounded-full border border-violet-500/50 mb-4 animate-pulse uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            ⭐ Badge Élite Exclusivo ⭐
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-slate-300 mb-2">Sos un inversor</h2>
        <h1 className={`text-6xl font-black mb-8 ${lvl.color} uppercase tracking-tight drop-shadow-lg`}>
          {data.nivel}
        </h1>

        {/* Solo Partner o Visionary ven su ranking absoluto */}
        {(data.nivel === 'PARTNER' || data.nivel === 'VISIONARY') && data.rankingPosicion > 0 && (
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 mb-8 border border-white/10 w-full max-w-sm">
            <p className="text-violet-200 font-medium text-sm">Estás en el TOP del Ranking Global</p>
            <p className="text-3xl font-black text-white"># {data.rankingPosicion} <span className="text-lg text-slate-400 font-normal">de {data.rankingTotalUsuarios}</span></p>
          </div>
        )}

        {/* Beneficios del Nivel */}
        <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
          {data.nivel === 'VISIONARY' && (
            <>
              <p className="text-xs text-violet-300 bg-violet-900/40 p-2 rounded border border-violet-500/30">✨ Beneficio activo: Preview exclusivo 48hs</p>
              <p className="text-xs text-violet-300 bg-violet-900/40 p-2 rounded border border-violet-500/30">🔥 Beneficio activo: Destacar proyectos Voto x3</p>
            </>
          )}
          {data.nivel === 'PARTNER' && (
            <>
              <p className="text-xs text-amber-200 bg-amber-900/40 p-2 rounded border border-amber-500/30">⏳ Beneficio activo: Preview proyectos 24hs antes</p>
              <p className="text-xs text-amber-200 bg-amber-900/40 p-2 rounded border border-amber-500/30">🔥 Beneficio activo: Destacar proyectos Voto x2</p>
            </>
          )}
          {data.nivel === 'INVESTOR' && (
            <p className="text-xs text-blue-200 bg-blue-900/40 p-2 rounded border border-blue-500/30">📈 Beneficio activo: Cross-rewards boost x1.5</p>
          )}
          {data.nivel === 'STARTER' && (
            <p className="text-xs text-emerald-200 bg-emerald-900/40 p-2 rounded border border-emerald-500/30">🌱 Tip: Invertí +$2K para alcanzar Investor y potenciar tus recompensas.</p>
          )}
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs mt-8 relative z-50">
          <Button onClick={() => shareWrapped()} size="lg" className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg relative z-50">
            <Share2 className="w-5 h-5 mr-2" /> Compartir por WhatsApp
          </Button>
          <Button onClick={() => shareOnX()} size="lg" className="h-14 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl shadow-lg border border-white/10 relative z-50">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 mr-2 fill-current"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
            Compartir en X
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="h-12 text-slate-400 hover:text-white relative z-50">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  ];

  // (VOT-PREM-02) Lógica de Compartir nativa y Whatsapp
  // (VOT-PREM-02) Lógica de Compartir nativa y Whatsapp
  const shareWrapped = async () => {
    let text = `¡Fondeé ${data.proyectosFondeados} proyectos este año en IdeaFy! 🚀\n`;
    if (data.rubroFavorito && data.rubroFavorito !== 'Ninguno') {
      text += `🎯 Mi rubro favorito fue: ${data.rubroFavorito}\n`;
    }
    if (data.proyectoMasInvertido) {
      text += `💰 Dejé todo en: ${data.proyectoMasInvertido}\n`;
    }
    text += `🏆 Alcancé el nivel ${data.nivel}!\n\n¿Y vos qué estás esperando para invertir en el futuro?`;
    
    // Bypass navigator.share for better text support (OS dialogs strip text)
    shareToWhatsapp(text);
  };

  const shareToWhatsapp = (text) => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + "\n\nArmá tu portafolio acá: " + window.location.origin)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOnX = () => {
    let text = `¡Fondeé ${data.proyectosFondeados} proyectos este año en @IdeaFy! 🚀\n`;
    if (data.rubroFavorito && data.rubroFavorito !== 'Ninguno') {
      text += `🎯 Mi rubro favorito fue: ${data.rubroFavorito}\n`;
    }
    if (data.proyectoMasInvertido) {
      text += `💰 Dejé todo en: ${data.proyectoMasInvertido}\n`;
    }
    text += `🏆 Alcancé el nivel ${data.nivel}!\n\n¿Y vos qué estás esperando para invertir en el futuro?`;
    
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(xUrl, '_blank', 'noopener,noreferrer');
  };


  return (
    <div 
      className="fixed inset-0 z-50 bg-[#0B0F19] text-white overflow-hidden flex flex-col select-none"
      onClick={(e) => {
        // Ignorar clicks en botones para que los botones funcionen
        if (e.target.closest('button') || e.target.closest('a')) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < window.innerWidth / 3) {
          setCurrentSlide(p => Math.max(0, p - 1));
        } else {
          setCurrentSlide(p => Math.min(slides.length - 1, p + 1));
        }
      }}
    >
      {/* ProgressBar (Stories-style) */}
      <div className="absolute top-0 left-0 w-full p-4 flex gap-2 z-50 pointer-events-none">
        {slides.map((_, idx) => (
          <div key={idx} className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-white transition-all duration-[6000ms] ease-linear`}
              style={{ 
                width: currentSlide > idx ? '100%' : currentSlide === idx ? '100%' : '0%',
                transitionDuration: currentSlide === idx ? '6s' : '0s'
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* Current Slide */}
      <div className="relative z-30 h-full w-full transition-opacity duration-500">
        {slides[currentSlide]}
      </div>
    </div>
  );
}
