import { motion } from 'framer-motion'

export function AuthLayout({ error, children }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.008) 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-foreground tracking-tight leading-none">IDEAFY</h1>
          <p className="text-sm text-slate-500 mt-3">Tokenización de activos digitales</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-card p-6 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
              className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2.5 border border-red-500/20"
            >
              {error}
            </motion.div>
          )}

          {children}
        </div>
      </motion.div>
    </div>
  )
}
