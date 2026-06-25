import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Building, Globe, Shield, Star, Crown, Zap, Loader2 } from 'lucide-react';
import { useGamification } from '@/hooks/use-gamification';
import { useWalletSummary } from '@/hooks/use-wallet';

export function CollectorDashboard() {
  const { data, isLoading } = useGamification();
  const { data: walletData, isLoading: walletLoading } = useWalletSummary();
  
  const userLevel = data?.nivel_inversor || 'STARTER';
  const portfolio = walletData?.portfolio || [];

  const proyectosFondeados = data?.proyectos_fondeados || 0;
  const creadoresDistintos = data?.creadores_distintos || 0;

  // Dynamic unlocked state based on synced level for presentation
  const isPartnerOrHigher = ['PARTNER', 'VISIONARY'].includes(userLevel);
  const isInvestorOrHigher = ['INVESTOR', 'PARTNER', 'VISIONARY'].includes(userLevel);

  const SET_BONUSES = [
    {
      id: 'duo',
      title: 'Dúo IDEAFY',
      description: 'Inversión en 2 proyectos.',
      reward: 'Cross-rewards x1.25 + badge cobre',
      icon: Users,
      glow: 'shadow-[0_0_40px_rgba(56,189,248,0.3)]',
      color: 'from-sky-400 to-blue-600',
      progress: Math.min(proyectosFondeados, 2),
      total: 2,
      unlocked: proyectosFondeados >= 2
    },
    {
      id: 'trilogia',
      title: 'Trilogía IDEAFY',
      description: 'Inversión en 3 proyectos.',
      reward: 'Cross-rewards x1.5 + badge oro',
      icon: Trophy,
      glow: 'shadow-[0_0_40px_rgba(217,70,239,0.3)]',
      color: 'from-fuchsia-400 to-purple-600',
      progress: Math.min(proyectosFondeados, 3),
      total: 3,
      unlocked: proyectosFondeados >= 3
    },
    {
      id: 'arquitecto',
      title: 'Arquitecto IDEAFY',
      description: 'Inversión en 5+ proyectos.',
      reward: 'Cross-rewards x1.75 + badge platino',
      icon: Building,
      glow: 'shadow-[0_0_40px_rgba(249,115,22,0.3)]',
      color: 'from-orange-400 to-red-600',
      progress: Math.min(proyectosFondeados, 5),
      total: 5,
      unlocked: proyectosFondeados >= 5
    },
    {
      id: 'diversificador',
      title: 'Diversificador IDEAFY',
      description: 'Inversión en 5 creadores diferentes.',
      reward: 'Tier Partner + governance x2 + badge diamante',
      icon: Globe,
      glow: 'shadow-[0_0_40px_rgba(52,211,153,0.3)]',
      color: 'from-emerald-400 to-teal-600',
      progress: Math.min(creadoresDistintos, 5),
      total: 5,
      unlocked: creadoresDistintos >= 5
    }
  ];

  const REAL_NFTS = portfolio.map((item, index) => {
    const colors = [
      'from-[#64748b] to-[#334155]',
      'from-[#fbbf24] to-[#ea580c]',
      'from-[#d946ef] to-[#7e22ce]',
      'from-[#67e8f9] via-[#3b82f6] to-[#4f46e5]',
      'from-[#10b981] to-[#047857]'
    ];
    const textColors = [
      'text-slate-300', 'text-amber-300', 'text-fuchsia-300', 'text-cyan-300', 'text-emerald-300'
    ];
    const icons = [Shield, Star, Trophy, Crown, Zap];
    const rarities = ['Comun', 'Raro', 'Epico', 'Legendario', 'Exclusivo'];

    const cIdx = index % colors.length;
    let rIdx = 0;
    if (item.cantidad >= 1000) rIdx = 1;
    if (item.cantidad >= 5000) rIdx = 2;
    if (item.cantidad >= 10000) rIdx = 3;
    if (item.cantidad >= 50000) rIdx = 4;
    
    return {
      id: index,
      rarity: rarities[rIdx],
      projectName: item.proyectoNombre,
      icon: icons[rIdx],
      color: colors[cIdx],
      text: textColors[cIdx]
    };
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#030712] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 mb-2">
              IDEAFY Gamification
            </h1>
            <p className="text-[#9ca3af] text-lg font-medium">Tus multiplicadores activos y colección de activos Web3.</p>
          </div>
          <div className="px-6 py-3 bg-[#111827] border border-[#1f2937] shadow-[0_0_30px_rgba(99,102,241,0.15)] rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Trophy className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex flex-col min-w-[80px]">
              <span className="text-xs text-[#9ca3af] font-bold uppercase tracking-widest">Nivel Inversor</span>
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mt-1" />
              ) : (
                <span className="font-black text-xl text-white uppercase">{userLevel}</span>
              )}
            </div>
          </div>
        </div>

        {/* Set Bonuses */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Set Bonuses Activos</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SET_BONUSES.map((bonus, idx) => (
              <motion.div
                key={bonus.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                className={`relative p-6 rounded-3xl border backdrop-blur-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                  bonus.unlocked 
                    ? `bg-[#0f172a]/80 border-[#1e293b] ${bonus.glow}` 
                    : 'bg-[#0a0f1c] border-dashed border-[#1e293b] opacity-80 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                }`}
              >
                {/* Dynamic Background Glow */}
                {bonus.unlocked && (
                  <div className={`absolute -right-20 -top-20 w-48 h-48 bg-gradient-to-br ${bonus.color} opacity-15 blur-[50px] rounded-full pointer-events-none`} />
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${bonus.color} shadow-lg`}>
                    <bonus.icon className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                  {bonus.unlocked && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                        Activado
                      </span>
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-xl text-white mb-2">{bonus.title}</h3>
                <p className="text-[#94a3b8] text-sm mb-6 leading-relaxed min-h-[40px]">{bonus.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-[#64748b]">Progreso</span>
                    <span className="text-white">{bonus.progress} / {bonus.total}</span>
                  </div>
                  <div className="w-full bg-[#1e293b] rounded-full h-3 overflow-hidden border border-[#334155]/50 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(bonus.progress / bonus.total) * 100}%` }}
                      transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${bonus.color} shadow-lg`}
                    />
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${bonus.unlocked ? 'bg-yellow-500/20' : 'bg-[#1e293b]'}`}>
                      {bonus.unlocked ? (
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <span className="text-[10px] flex items-center justify-center opacity-50">🔒</span>
                      )}
                    </div>
                    <p className={`text-sm font-bold ${bonus.unlocked ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500' : 'text-[#64748b]'}`}>
                      {bonus.reward}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* NFTs Gallery */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Crown className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Billetera de Figuritas NFT</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {REAL_NFTS.map((nft, idx) => (
              <motion.div
                key={nft.id}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.15 } }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + (idx * 0.1), duration: 0.4 }}
                className="relative aspect-[3/4] rounded-2xl p-1 group cursor-pointer perspective-1000"
              >
                {/* Border Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${nft.color} rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 shadow-xl`} />
                
                {/* Inner Card */}
                <div className="relative h-full w-full bg-[#0a0f1c] rounded-xl p-5 flex flex-col items-center justify-between border border-white/5 overflow-hidden z-10">
                  {/* Background Ambient Light */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${nft.color} opacity-10 group-hover:opacity-20 transition-all duration-500`} />
                  
                  <div className="text-center mt-4">
                    <nft.icon className={`w-14 h-14 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${nft.text}`} />
                  </div>
                  
                  <div className="w-full flex flex-col items-center gap-2 mb-2">
                    <div className="px-3 py-1 bg-black/40 rounded-full border border-white/10 backdrop-blur-md">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${nft.text}`}>
                        {nft.rarity}
                      </span>
                    </div>
                    <span className="text-sm text-center font-bold text-white leading-tight mt-2">
                      {nft.projectName}
                    </span>
                    <span className="text-[9px] text-[#64748b] text-center px-2 mt-1 leading-snug border-t border-white/5 pt-2">
                      Coleccioná más NFTs de este creador para activar recompensas.
                    </span>
                  </div>
                </div>
                
                {/* External Glow */}
                <div className={`absolute -inset-4 bg-gradient-to-r ${nft.color} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500 -z-10`} />
              </motion.div>
            ))}
            
            {/* Empty Slots or Loading */}
            {walletLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-[#475569]">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <span>Cargando tus inversiones en la blockchain...</span>
              </div>
            ) : REAL_NFTS.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-[#475569] border-2 border-dashed border-[#1e293b] rounded-2xl bg-[#0f172a]/30">
                <Shield className="w-12 h-12 mb-4 opacity-50" />
                <span className="font-semibold text-lg">Aún no tenés NFTs</span>
                <span className="text-sm mt-2 opacity-70">Invertí en tu primer proyecto para empezar a ganar figuritas.</span>
              </div>
            ) : (
              // Fill remaining slots up to 5 if they have less than 5
              Array.from({ length: Math.max(0, 5 - REAL_NFTS.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-[#1e293b] flex flex-col items-center justify-center bg-[#0f172a]/30 transition-colors hover:border-[#334155] hover:bg-[#0f172a]/50 cursor-pointer">
                  <div className="w-12 h-12 rounded-full border border-[#334155] flex items-center justify-center mb-3">
                    <Shield className="w-5 h-5 text-[#475569]" />
                  </div>
                  <span className="text-[#475569] font-semibold text-sm">Slot Vacío</span>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
