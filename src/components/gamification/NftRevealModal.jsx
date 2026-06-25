import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Star, Shield, Crown } from 'lucide-react';

const rarityConfig = {
  Comun: {
    color: 'from-slate-400 to-slate-600',
    shadow: 'shadow-slate-500/50',
    icon: Shield,
    textColor: 'text-slate-200'
  },
  Raro: {
    color: 'from-amber-300 to-orange-500',
    shadow: 'shadow-orange-500/50',
    icon: Star,
    textColor: 'text-amber-100'
  },
  Epico: {
    color: 'from-fuchsia-500 to-purple-700',
    shadow: 'shadow-purple-500/50',
    icon: Trophy,
    textColor: 'text-fuchsia-100'
  },
  Legendario: {
    color: 'from-cyan-300 via-blue-500 to-indigo-600',
    shadow: 'shadow-cyan-400/60',
    icon: Crown,
    textColor: 'text-cyan-50'
  }
};

export function NftRevealModal({ isOpen, onClose, rarity = 'Comun', projectName = 'IDEAFY Project' }) {
  const [stage, setStage] = useState('hidden'); // hidden, shaking, revealed

  useEffect(() => {
    if (isOpen) {
      setStage('shaking');
      const timer = setTimeout(() => {
        setStage('revealed');
      }, 3000); // 3 segundos de suspenso
      return () => clearTimeout(timer);
    } else {
      setStage('hidden');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const config = rarityConfig[rarity] || rarityConfig.Comun;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        {stage === 'shaking' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              rotate: [0, -5, 5, -5, 5, 0],
              y: [0, -10, 10, -10, 10, 0]
            }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ 
              duration: 0.5, 
              repeat: 5, 
              repeatType: "reverse" 
            }}
            className="relative w-64 h-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-4 border-slate-700 flex flex-col items-center justify-center shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
            <Sparkles className="w-16 h-16 text-slate-400 animate-pulse mb-4" />
            <p className="text-slate-300 font-bold text-xl tracking-widest uppercase">Abriendo...</p>
          </motion.div>
        )}

        {stage === 'revealed' && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ type: "spring", bounce: 0.5, duration: 1 }}
            className="relative perspective-1000"
          >
            <div className={`relative w-80 h-[28rem] rounded-2xl bg-gradient-to-br ${config.color} p-1 shadow-2xl ${config.shadow}`}>
              <div className="absolute inset-0 bg-black/20 rounded-2xl backdrop-blur-sm"></div>
              
              {/* Contenido de la carta */}
              <div className="relative h-full w-full bg-slate-950/80 rounded-xl p-6 flex flex-col items-center justify-between border border-white/10 overflow-hidden">
                {/* Rayos de fondo */}
                <div className={`absolute inset-0 bg-gradient-to-t ${config.color} opacity-20`}></div>
                
                <div className="text-center z-10 w-full">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${config.color} mb-4 shadow-lg ${config.shadow}`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h2 className={`text-3xl font-black uppercase tracking-wider mb-2 ${config.textColor}`}>
                    {rarity}
                  </h2>
                  <div className="w-full h-px bg-white/20 my-4"></div>
                  <p className="text-slate-300 text-sm">Token conmemorativo de inversión en:</p>
                  <p className="text-white font-bold text-lg mt-1">{projectName}</p>
                </div>

                <div className="z-10 w-full space-y-3">
                  <button 
                    onClick={onClose}
                    className="w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/20 backdrop-blur-md"
                  >
                    Coleccionar
                  </button>
                </div>
              </div>
            </div>
            
            {/* Destellos externos */}
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute -inset-10 bg-gradient-to-r ${config.color} opacity-20 blur-3xl -z-10 rounded-full`}
            />
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
